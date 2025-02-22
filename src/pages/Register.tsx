import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Home, Search, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface RegisterForm {
  email: string;
  password: string;
  fullName: string;
  userType: 'tenant' | 'host';
  video: FileList;
}

export default function Register() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RegisterForm>();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'host' | null>(null);
  const videoFile = watch('video');

  const handleRoleSelect = (role: 'tenant' | 'host') => {
    setSelectedRole(role);
    setValue('userType', role, { shouldValidate: true });
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (30MB max)
      if (file.size > 30 * 1024 * 1024) {
        toast.error('Video must be less than 30MB');
        event.target.value = '';
        return;
      }

      // Check duration when possible
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          toast.error('Video must be 30 seconds or less');
          event.target.value = '';
          return;
        }
      };

      video.src = URL.createObjectURL(file);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (uploading) return;
    if (!selectedRole) {
      toast.error('Please select your role');
      return;
    }

    try {
      setUploading(true);

      const { error: signUpError, data: userData } = await signUp(data.email, data.password, data.fullName);
      if (signUpError) throw signUpError;

      // Update profile with user type
      if (userData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            user_type: selectedRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.user.id);

        if (profileError) throw profileError;
      }

      // If video is provided, upload it
      if (data.video?.[0] && userData?.user) {
        const file = data.video[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userData.user.id}/${Math.random()}.${fileExt}`;
        const filePath = fileName;

        // Upload video
        const { error: uploadError } = await supabase.storage
          .from('profile-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get video URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-videos')
          .getPublicUrl(filePath);

        // Update profile with video URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ new_video_url: publicUrl })
          .eq('id', userData.user.id);

        if (updateError) throw updateError;
      }

      toast.success('Please check your email to confirm your account');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error creating account');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              disabled={uploading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              disabled={uploading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              disabled={uploading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">I want to:</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('tenant')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${selectedRole === 'tenant'
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                    : 'border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
              >
                <Search className={`w-6 h-6 ${selectedRole === 'tenant' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${selectedRole === 'tenant' ? 'text-blue-700' : 'text-gray-900'}`}>
                  Find a Room
                </span>
                <span className="text-xs text-gray-500">I'm looking for a place to rent</span>
                {selectedRole === 'tenant' && (
                  <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('host')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${selectedRole === 'host'
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                    : 'border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
              >
                <Home className={`w-6 h-6 ${selectedRole === 'host' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${selectedRole === 'host' ? 'text-blue-700' : 'text-gray-900'}`}>
                  Post a Room
                </span>
                <span className="text-xs text-gray-500">I have a room to rent out</span>
                {selectedRole === 'host' && (
                  <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                )}
              </button>
            </div>
            {errors.userType && (
              <p className="mt-2 text-sm text-red-600">Please select a role</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Introduction Video (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      {...register('video')}
                      onChange={handleVideoChange}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">MP4, MOV up to 30MB (max 30 seconds)</p>
              </div>
            </div>
            {videoFile?.[0] && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {videoFile[0].name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !selectedRole}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
          >
            {uploading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
