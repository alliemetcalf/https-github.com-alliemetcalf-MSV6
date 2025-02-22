import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  available_from: string;
  min_income: number;
  property: {
    id: string;
    address: string;
    images: string[];
  };
}

interface Profile {
  monthly_income: number | null;
}

export default function Home() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const fetchRooms = async (filterByIncome = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('rooms')
        .select(`
          id,
          title,
          description,
          price,
          images,
          available_from,
          min_income,
          property:properties(id, address, images)
        `);

      if (filterByIncome && userProfile?.monthly_income) {
        query = query.lte('min_income', userProfile.monthly_income);
      } else {
        if (minPrice) {
          query = query.gte('price', parseInt(minPrice));
        }
        if (maxPrice) {
          query = query.lte('price', parseInt(maxPrice));
        }
      }

      const { data, error: fetchError } = await query.order('price', { ascending: true });

      if (fetchError) throw fetchError;
      setRooms(data || []);

      if (filterByIncome) {
        if (!userProfile?.monthly_income) {
          toast.error('Please set your monthly income in your profile first');
          return;
        }
        if (!data || data.length === 0) {
          toast.error('No rooms match your income criteria');
        } else {
          toast.success(`Found ${data.length} room${data.length === 1 ? '' : 's'} you qualify for`);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('monthly_income')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setUserProfile(data);
          }
        });
    }
    fetchRooms();
  }, [user]);

  const handleQualifiedFilter = () => {
    if (!user) {
      toast.error('Please log in to use this feature');
      return;
    }
    
    if (!userProfile?.monthly_income) {
      toast.error('Please set your monthly income in your profile first');
      return;
    }

    fetchRooms(true);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    fetchRooms(false);
    toast.success('Filters cleared');
  };

  const handleShowResults = () => {
    fetchRooms(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-4">Search or list a room for rent - simply, safely, and stress-free!</h2>
        <p className="text-base sm:text-lg text-blue-600 mb-8">Browse and search available co-living rooms</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filter Rooms</h2>
        <div className="hidden md:flex items-center justify-center space-x-4">
          <div className="flex-shrink-0 w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Price
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min price"
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>
          <div className="flex-shrink-0 w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Price
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>
          <div className="flex-shrink-0 flex items-end space-x-2">
            <button
              onClick={handleShowResults}
              className="h-10 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Show Results
            </button>
            <button
              onClick={clearFilters}
              className="h-10 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Clear
            </button>
            {user && (
              <button
                onClick={handleQualifiedFilter}
                className="h-10 text-blue-600 hover:text-blue-800 transition text-sm whitespace-nowrap"
              >
                Show me the rooms I qualify for
              </button>
            )}
          </div>
        </div>

        <div className="md:hidden space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Price
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min price"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Price
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max price"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShowResults}
              className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Show Results
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Clear
            </button>
            {user && (
              <button
                onClick={handleQualifiedFilter}
                className="w-full sm:w-auto text-blue-600 hover:text-blue-800 transition text-sm"
              >
                Which rooms do I qualify for?
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
            <div className="relative h-48 sm:h-56">
              <Link to={`/room/${room.id}`}>
                <img
                  src={room.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80'}
                  alt={room.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white font-semibold text-lg sm:text-xl">{room.title}</p>
                </div>
              </Link>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                <p className="text-sm">${room.price.toLocaleString()}/month</p>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <p className="text-sm">Available from {new Date(room.available_from).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Link
                to={`/property/${room.property.id}`}
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition mb-2"
              >
                View Property Details
              </Link>
              <Link
                to={`/pre-approval?room_id=${room.id}`}
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                Get Pre-approved
              </Link>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && !error && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No rooms match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 transition"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
