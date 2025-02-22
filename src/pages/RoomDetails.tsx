import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DollarSign, Calendar, CheckCircle, XCircle, Edit2, X, Home, Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ImageUploader from '../components/ImageUploader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PropertyMap from '../components/PropertyMap';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  min_income: number;
  requires_background_check: boolean;
  available_from: string;
  is_advertised: boolean;
  property: {
    id: string;
    owner_id: string;
    description: string;
    total_rooms: number;
    amenities: string;
    house_rules: string;
    images: string[];
    address: string;
  };
}

interface Property {
  id: string;
  total_rooms: number;
  description: string;
}

interface EditRoomForm {
  property_id: string;
  title: string;
  description: string;
  price: number;
  incomeMultiplier: number;
  requires_background_check: boolean;
  available_from: string;
}

const INCOME_MULTIPLIERS = Array.from({ length: 31 }, (_, i) => ({
  value: 2 + (i * 0.1),
  label: `${(2 + (i * 0.1)).toFixed(1)}x monthly rent`
}));

export default function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyDescription, setShowPropertyDescription] = useState(false);
  const [showHouseRules, setShowHouseRules] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { register: registerEdit, handleSubmit: handleSubmitEdit, setValue, watch } = useForm<EditRoomForm>();

  const editPrice = watch('price', 0);
  const editMultiplier = watch('incomeMultiplier', 2);
  const editMonthlyIncome = editPrice * editMultiplier;

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      if (!user) return false;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (mounted) {
          setIsAdmin(profile?.user_type === 'admin');
        }
        return profile?.user_type === 'admin';
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    }

    async function fetchProperties() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, total_rooms, description')
          .eq('owner_id', user.id);

        if (error) throw error;
        if (mounted) {
          setProperties(data || []);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    }

    async function fetchRoom() {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check admin status first
        const isUserAdmin = await checkAdminStatus();

        const { data, error } = await supabase
          .from('rooms')
          .select(`
            id,
            title,
            description,
            price,
            images,
            min_income,
            requires_background_check,
            available_from,
            is_advertised,
            property:properties(
              id,
              owner_id,
              description,
              total_rooms,
              amenities,
              house_rules,
              images,
              address
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (mounted) {
          if (data) {
            setRoom(data);
            setEditImages(data.images || []);
            // Pre-fill edit form
            setValue('property_id', data.property.id);
            setValue('title', data.title);
            setValue('description', data.description);
            setValue('price', data.price);
            setValue('incomeMultiplier', Math.round((data.min_income / data.price) * 10) / 10);
            setValue('requires_background_check', data.requires_background_check);
            setValue('available_from', data.available_from.split('T')[0]);

            // Fetch properties for dropdown if user is admin or property owner
            if (isUserAdmin || data.property.owner_id === user?.id) {
              fetchProperties();
            }
          } else {
            setError('Room not found');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        if (mounted) {
          setError('Error loading room details');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchRoom();

    return () => {
      mounted = false;
    };
  }, [id, user, navigate, setValue]);

  const onSubmitEdit = async (data: EditRoomForm) => {
    try {
      const minIncome = data.price * data.incomeMultiplier;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          property_id: data.property_id,
          title: data.title,
          description: data.description,
          price: data.price,
          min_income: minIncome,
          requires_background_check: data.requires_background_check,
          available_from: data.available_from,
          images: editImages
        })
        .eq('id', id);

      if (roomError) throw roomError;

      toast.success('Room updated successfully');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
    }
  };

  const handleAdvertiseToggle = async () => {
    if (!room) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_advertised: !room.is_advertised })
        .eq('id', room.id);

      if (error) throw error;

      setRoom(prev => prev ? { ...prev, is_advertised: !prev.is_advertised } : null);
      toast.success(`Room ${room.is_advertised ? 'removed from' : 'added to'} advertisements`);
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      toast.error('Failed to update advertisement status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <p className="text-red-600 mb-4">{error || 'Room not found'}</p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === room.property.owner_id;
  const canEdit = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {canEdit && !isEditing && (
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Room</span>
              </button>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={room.is_advertised}
                  onChange={handleAdvertiseToggle}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Advertise this room</span>
              </label>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Room</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property</label>
                <select
                  {...registerEdit('property_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.description} ({property.total_rooms} rooms)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Title</label>
                <input
                  type="text"
                  {...registerEdit('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Description</label>
                <textarea
                  {...registerEdit('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
                <input
                  type="number"
                  {...registerEdit('price')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Required Income Multiplier</label>
                <select
                  {...registerEdit('incomeMultiplier')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {INCOME_MULTIPLIERS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  Minimum monthly income required: ${editMonthlyIncome.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Available From</label>
                <input
                  type="date"
                  {...registerEdit('available_from')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...registerEdit('requires_background_check')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Requires Background Check
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Images</label>
                <ImageUploader
                  images={editImages}
                  onImagesChange={setEditImages}
                  userId={user?.id || ''}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="h-[400px]"
            >
              {room.images.map((url, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={url || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80'}
                    alt={`Room view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{room.title}</h1>
                <div className="mt-4 flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span>${room.price}/month</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Available from {new Date(room.available_from).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Room Description</h2>
                <p className="text-gray-600">{room.description}</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span>Minimum monthly income: ${room.min_income.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    {room.requires_background_check ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2 text-red-500" />
                    )}
                    <span>Background check {room.requires_background_check ? 'required' : 'not required'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="w-6 h-6 mr-2 text-blue-600" />
                  Property Information
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {room.property.images?.[0] && (
                    <div className="md:col-span-2 mb-4">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <img
                          src={room.property.images[0]}
                          alt="Property"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <Link
                          to={`/property/${room.property.id}`}
                          className="absolute bottom-4 left-4 text-white hover:text-blue-200 transition flex items-center space-x-2"
                        >
                          <span>View Property Details</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Total Rooms
                      </h3>
                      <p className="text-gray-600 mt-1">{room.property.total_rooms} rooms in house</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                        Amenities
                      </h3>
                      <p className="text-gray-600 mt-1">{room.property.amenities || 'No amenities listed'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <button
                        onClick={() => setShowPropertyDescription(!showPropertyDescription)}
                        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        <span>About the Property</span>
                        {showPropertyDescription ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showPropertyDescription && (
                        <div className="prose prose-sm mt-2 text-gray-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {room.property.description || 'No description available'}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => setShowHouseRules(!showHouseRules)}
                        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        <span>House Rules</span>
                        {showHouseRules ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showHouseRules && (
                        <div className="prose prose-sm mt-2 text-gray-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {room.property.house_rules || 'No house rules listed'}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Location</h3>
                  <PropertyMap address={room.property.address} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <Link
            to={`/pre-approval?room_id=${room.id}`}
            className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Get Pre-approved
          </Link>
        </div>
      )}

      {!user && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">Please log in to apply for this room.</p>
        </div>
      )}
    </div>
  );
}
