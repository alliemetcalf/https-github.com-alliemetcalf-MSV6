import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import MarkdownEditor from '../components/MarkdownEditor';

const UTILITIES = [
  'All',
  'Electricity',
  'Gas/Propane',
  'Water',
  'Trash',
  'Internet',
  'Common Area Cleaning'
] as const;

const VIBES = [
  'Chill',
  'Party',
  'LGBT+ Inclusive',
  'Quiet',
  'Social',
  'Clean',
  'Friendly',
  'Private',
  'Communal',
  'Noisy',
  'Respectful',
  'Supportive',
  'Independent',
  'Late Night',
  'Weekenders',
  'Non Discrimination Policy'
] as const;

const AMENITIES = [
  'Central Air Conditioning',
  'Evaporative Cooler',
  'Window Unit Air Conditioner',
  'Central Furnace',
  'Baseboard Heaters',
  'Deck or Patio',
  'Outdoor Seating',
  'Wood Floors',
  'Tile Floors',
  'Fenced Yard',
  'Storage',
  'Off Street/Assigned Parking',
  'Elevator',
  'Fireplace',
  'Laundry',
  'Hot Tub/Jacuzzi',
  'Pool',
  'Dishwasher',
  'Common Bathroom',
  'Cable Television',
  'Furnished',
  'Dog Run',
  'Smoking Area',
  'Gated/Security Service',
  'Security Cameras',
  'Coworking/Office space',
  'Fitness Area',
  'Media Room/Theater',
  'BBQ',
  'Individual Refrigerator/Kitchen Storage',
  'Furnished Kitchen',
  'Kitchen Appliances',
  'Ice Maker',
  'Garden',
  'Solar Power',
  'Loft',
  'Upstairs Unit',
  'Accessible',
  'Keypad Locks'
] as const;

interface PostPropertyForm {
  address: string;
  totalRooms: number;
  description: string;
  amenities: string;
  houseRules: string;
}

interface Room {
  id: string;
  title: string;
  price: number;
  images: string[];
  available_from: string;
}

export default function PostProperty() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PostPropertyForm>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchPropertyData() {
      if (!editId) {
        setLoading(false);
        return;
      }

      try {
        const { data: property, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) throw error;

        if (property) {
          setValue('address', property.address);
          setValue('totalRooms', property.total_rooms);
          setDescription(property.description || '');
          setValue('amenities', property.amenities || '');
          setHouseRules(property.house_rules || '');
          setImages(property.images || []);
          setSelectedAmenities(property.amenities_list || []);
          setSelectedUtilities(property.utilities_included || []);
          setSelectedVibes(property.vibes || []);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property data');
      }
    }

    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            id,
            title,
            price,
            images,
            available_from,
            property:properties(owner_id)
          `)
          .eq('property.owner_id', user.id);

        if (error) throw error;
        setRooms(data || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load existing rooms');
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyData();
    fetchRooms();
  }, [user, navigate, editId, setValue]);

  const handleUtilityChange = (utility: string) => {
    if (utility === 'All') {
      if (selectedUtilities.includes('All')) {
        setSelectedUtilities([]);
      } else {
        setSelectedUtilities(UTILITIES as unknown as string[]);
      }
    } else {
      if (selectedUtilities.includes(utility)) {
        setSelectedUtilities(prev => prev.filter(u => u !== utility));
        setSelectedUtilities(prev => prev.filter(u => u !== 'All'));
      } else {
        setSelectedUtilities(prev => [...prev, utility]);
        if (UTILITIES.slice(1).every(u => [...selectedUtilities, utility].includes(u))) {
          setSelectedUtilities([...UTILITIES] as string[]);
        }
      }
    }
  };

  const onSubmit = async (data: PostPropertyForm) => {
    if (!user) {
      toast.error('Please log in to post a property');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);

      const propertyData = {
        owner_id: user.id,
        address: data.address,
        total_rooms: data.totalRooms,
        description: description,
        amenities: data.amenities,
        house_rules: houseRules,
        images: images,
        listing_type: 'property',
        listing_status: 'available',
        amenities_list: selectedAmenities,
        utilities_included: selectedUtilities,
        vibes: selectedVibes
      };

      if (editId) {
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editId);

        if (updateError) throw updateError;
        toast.success('Property updated successfully');
      } else {
        const { error: insertError } = await supabase
          .from('properties')
          .insert(propertyData);

        if (insertError) throw insertError;
        toast.success('Property posted successfully');
      }

      navigate('/admin/properties');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(editId ? 'Error updating property' : 'Error posting property');
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">
          {editId ? 'Edit Property' : 'Post a Property'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Address</label>
            <input
              type="text"
              {...register('address', { required: 'Address is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Enter the full property address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Rooms</label>
            <input
              type="number"
              {...register('totalRooms', {
                required: 'Total rooms is required',
                min: { value: 1, message: 'Must have at least 1 room' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              min="1"
            />
            {errors.totalRooms && (
              <p className="mt-1 text-sm text-red-600">{errors.totalRooms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Property Description</label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the property, location, and general living environment"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vibe</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              {VIBES.map((vibe) => (
                <label key={vibe} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedVibes.includes(vibe)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVibes([...selectedVibes, vibe]);
                      } else {
                        setSelectedVibes(selectedVibes.filter(v => v !== vibe));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{vibe}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Utilities Included</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              {UTILITIES.map((utility) => (
                <label key={utility} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUtilities.includes(utility)}
                    onChange={() => handleUtilityChange(utility)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{utility}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              {AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAmenities([...selectedAmenities, amenity]);
                      } else {
                        setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">House Rules</label>
            <MarkdownEditor
              value={houseRules}
              onChange={setHouseRules}
              placeholder="List all house rules and expectations"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Property Photos</label>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              Add photos of common areas, exterior, and amenities
            </p>
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              userId={user?.id || ''}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? (editId ? 'Updating Property...' : 'Posting Property...') : (editId ? 'Update Property' : 'Post Property')}
          </button>
        </form>
      </div>

      {rooms.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Property Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-gray-50 rounded-lg p-4">
                <div className="relative h-48">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80'}
                    alt={room.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900">{room.title}</h4>
                  <p className="text-gray-600">${room.price}/month</p>
                  <p className="text-gray-600">
                    Available from: {new Date(room.available_from).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
