import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DeleteVideoButtonProps {
  videoUrl: string;
  userId: string;
  onVideoDeleted: () => void;
}

export default function DeleteVideoButton({ videoUrl, userId, onVideoDeleted }: DeleteVideoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Extract filename from URL
      const urlParts = videoUrl.split('/');
      const filePath = `${userId}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-videos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          new_video_url: null,
          previous_video_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Video deleted successfully');
      onVideoDeleted();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isDeleting}
        className="flex items-center justify-center space-x-2 mt-4 px-4 py-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete Video</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Introduction Video?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your introduction video? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
