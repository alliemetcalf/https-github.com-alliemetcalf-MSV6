import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import MarkdownEditor from '../components/MarkdownEditor';

interface Property {
  id: string;
  address: string;
  total_rooms: number;
  description: string;
}

interface PostRoomForm {
  property_id: string;
  title: string;
  roomDescription: string;
  price: number;
  incomeMultiplier: number;
  requiresBackgroundCheck: boolean;
  availableFrom: string;
}

// Generate multipliers from 2.0 to 5.0 with 0.1 increments
const INCOME_MULTIPLIERS = Array.from({ length: 31 }, (_, i) => ({
  value: 2 + (i * 0.1),
  label: `${(2 + (i * 0.1)).toFixed(1)}x monthly rent`
}));

export default function PostRoom() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PostRoomForm>({
    defaultValues: {
      incomeMultiplier: 3
    }
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [description, setDescription] = useState('');

  const price = watch('price', 0);
  const multiplier = watch('incomeMultiplier', 3);
  const minMonthlyIncome = price * multiplier;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      toast.error('Please log in to post a room');
      return;
    }

    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, address, total_rooms, description')
          .eq('owner_id', user.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          toast.error('Please add a property first');
          navigate('/post-property');
          return;
        }

        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Error loading properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [user, navigate]);

  const onSubmit = async (data: PostRoomForm) => {
    if (!user) {
      toast.error('Please log in to post a room');
      return;
    }

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      // Create room
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({
          property_id: data.property_id,
          title: data.title,
          description: description,
          price: data.price,
          images: roomImages,
          min_income: data.price * data.incomeMultiplier,
          requires_background_check: data.requiresBackgroundCheck,
          available_from: data.availableFrom
        });

      if (roomError) {
        console.error('Room error:', roomError);
        throw new Error('Error creating room');
      }

      toast.success('Room posted successfully');
      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Error posting room');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Post a Room</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Select Property</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Property</label>
            <select
              {...register('property_id', { required: 'Please select a property' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address} ({property.total_rooms} rooms)
                </option>
              ))}
            </select>
            {errors.property_id && (
              <p className="mt-1 text-sm text-red-600">{errors.property_id.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Room Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Title</label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Room Description</label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the specific room, its features, and any private amenities"
              rows={3}
            />
            {errors.roomDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.roomDescription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
            <input
              type="number"
              {...register('price', { 
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Required Income Multiplier</label>
            <select
              {...register('incomeMultiplier')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
              {INCOME_MULTIPLIERS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-600">
              Minimum monthly income required: ${minMonthlyIncome.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Available From</label>
            <input
              type="date"
              {...register('availableFrom', { required: 'Available date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            {errors.availableFrom && (
              <p className="mt-1 text-sm text-red-600">{errors.availableFrom.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('requiresBackgroundCheck')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Requires Background Check
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Room Images</label>
            <ImageUploader
              images={roomImages}
              onImagesChange={setRoomImages}
              userId={user?.id || ''}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {submitting ? 'Posting Room...' : 'Post Room'}
        </button>
      </form>
    </div>
  );
}
