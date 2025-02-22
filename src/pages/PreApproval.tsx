import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Upload, AlertCircle, Camera, X } from 'lucide-react';
import VideoRecorder from '../components/VideoRecorder';

interface PreApprovalForm {
  monthly_income: number;
  criminal_history: boolean;
  eviction_history: boolean;
  ideal_move_in: string;
}

interface Room {
  id: string;
  title: string;
  price: number;
  min_income: number;
  property: {
    address: string;
  };
}

interface Profile {
  new_video_url: string | null;
}

enum PreApprovalStep {
  CHECKING_VIDEO,
  RECORDING_VIDEO,
  FORM_INPUT
}

export default function PreApproval() {
  const { register, handleSubmit, formState: { errors } } = useForm<PreApprovalForm>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<PreApprovalStep>(PreApprovalStep.CHECKING_VIDEO);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get room_id from query parameters
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('room_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function checkVideoAndLoadData() {
      try {
        setLoading(true);
        
        // Check for existing intro video
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('new_video_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // If video exists, move to form step
        if (profile?.new_video_url) {
          setCurrentStep(PreApprovalStep.FORM_INPUT);
        } else {
          setCurrentStep(PreApprovalStep.RECORDING_VIDEO);
        }

        // Load room details if roomId exists
        if (roomId) {
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select(`
              id,
              title,
              price,
              min_income,
              property:properties(address)
            `)
            .eq('id', roomId)
            .single();

          if (roomError) throw roomError;
          setRoom(roomData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Error checking profile status');
      } finally {
        setLoading(false);
      }
    }

    checkVideoAndLoadData();
  }, [user, roomId, navigate]);

  const handleRecordedVideo = async (file: File) => {
    try {
      setSubmitting(true);
      setUploadProgress(0);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = 'webm';
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload video
      const { error: uploadError } = await supabase.storage
        .from('profile-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (uploadError) throw uploadError;

      // Get video URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-videos')
        .getPublicUrl(fileName);

      // Update profile with new video URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          new_video_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Video uploaded successfully');
      setShowVideoRecorder(false);
      setCurrentStep(PreApprovalStep.FORM_INPUT);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: PreApprovalForm) => {
    if (!user) {
      toast.error('Please log in to submit pre-approval');
      return;
    }

    try {
      setSubmitting(true);

      const preApprovalData = {
        user_id: user.id,
        room_id: roomId,
        monthly_income: data.monthly_income,
        criminal_history: data.criminal_history,
        eviction_history: data.eviction_history,
        ideal_move_in: data.ideal_move_in,
        status: 'pending'
      };

      const { error: preApprovalError } = await supabase
        .from('pre_approvals')
        .insert(preApprovalData);

      if (preApprovalError) {
        throw new Error(`Error creating pre-approval: ${preApprovalError.message}`);
      }

      toast.success('Pre-approval submitted successfully');
      navigate('/pre-approvals');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Error submitting pre-approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentStep === PreApprovalStep.RECORDING_VIDEO) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction Video Required</h2>
          <p className="text-gray-600 mb-6">
            To help landlords get to know you better, we require a short introduction video before you can submit a pre-approval request. This helps increase your chances of approval!
          </p>
          <div className="space-y-4">
            <p className="text-gray-600">
              Your video should include:
            </p>
            <ul className="text-left text-gray-600 list-disc list-inside mb-6">
              <li>A brief introduction about yourself</li>
              <li>Your occupation or student status</li>
              <li>Your hobbies and interests</li>
              <li>What you're looking for in a living space</li>
            </ul>
            <button
              onClick={() => setShowVideoRecorder(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
            >
              <Camera className="w-5 h-5" />
              <span>Record Your Video</span>
            </button>
          </div>
        </div>

        {showVideoRecorder && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Record Introduction Video</h3>
                <button
                  onClick={() => setShowVideoRecorder(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <VideoRecorder
                  onVideoRecorded={handleRecordedVideo}
                  maxDuration={30}
                />
              </div>
            </div>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Uploading Video</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-gray-600">{uploadProgress}% Complete</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        Get Pre-approved {room && `for ${room.title}`}
      </h2>

      {room && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Room Details</h3>
          <div className="space-y-2 text-gray-600">
            <p>Location: {room.property.address}</p>
            <p>Monthly Rent: ${room.price.toLocaleString()}</p>
            <p>Required Monthly Income: ${room.min_income.toLocaleString()}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monthly Income ($)</label>
          <input
            type="number"
            {...register('monthly_income', { 
              required: 'Monthly income is required',
              min: { value: 0, message: 'Monthly income must be positive' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
          {errors.monthly_income && (
            <p className="mt-1 text-sm text-red-600">{errors.monthly_income.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Criminal History</label>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('criminal_history')}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2">I have a criminal history</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Eviction History</label>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('eviction_history')}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2">I have an eviction history</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ideal Move-in Date</label>
          <input
            type="date"
            {...register('ideal_move_in', { required: 'Move-in date is required' })}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
          {errors.ideal_move_in && (
            <p className="mt-1 text-sm text-red-600">{errors.ideal_move_in.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Pre-approval'}
        </button>
      </form>
    </div>
  );
}
