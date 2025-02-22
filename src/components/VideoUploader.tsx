import React, { useRef, useState } from 'react';
import { Camera, StopCircle, RefreshCw, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import VideoRecorder from './VideoRecorder';

interface VideoUploaderProps {
  currentVideoUrl: string | null;
  userId: string;
  onVideoUpdate: (url: string | null) => void;
}

export default function VideoUploader({ currentVideoUrl, userId, onVideoUpdate }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVideo = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'Video must be smaller than 50MB' };
    }

    // Check file type
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      return { valid: false, error: 'Only MP4 and WebM formats are supported' };
    }

    // Check duration and resolution
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        
        if (video.duration > 60) {
          resolve({ valid: false, error: 'Video must be 60 seconds or shorter' });
          return;
        }

        if (video.videoHeight < 720) {
          resolve({ valid: false, error: 'Video must be at least 720p resolution' });
          return;
        }

        resolve({ valid: true });
      };

      video.onerror = () => {
        resolve({ valid: false, error: 'Invalid video file' });
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateVideo(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setShowVideoRecorder(true);
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error('Error processing video');
    }
  };

  const handleRecordedVideo = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const fileExt = 'webm';
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      // Upload video
      const { error: uploadError } = await supabase.storage
        .from('profile-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percent);
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
        .eq('id', userId);

      if (updateError) throw updateError;

      onVideoUpdate(publicUrl);
      toast.success('Video uploaded successfully');
      setShowVideoRecorder(false);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
      setProgress(0);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Video Display */}
      {currentVideoUrl && !showVideoRecorder && (
        <div className="relative">
          <video
            src={currentVideoUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Video Recorder */}
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

      {/* Upload Progress */}
      {uploading && progress > 0 && progress < 100 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Uploading Video</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600">{progress}% Complete</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!showVideoRecorder && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowVideoRecorder(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            disabled={uploading}
          >
            <Camera className="w-5 h-5" />
            <span>{currentVideoUrl ? 'Record New Video' : 'Record Introduction Video'}</span>
          </button>
        </div>
      )}

      {/* Requirements */}
      <div className="text-xs text-gray-500 text-center">
        Maximum 30 seconds • Minimum 720p resolution
      </div>
    </div>
  );
}
