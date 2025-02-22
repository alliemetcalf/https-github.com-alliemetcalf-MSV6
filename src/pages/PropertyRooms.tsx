import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Calendar, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  available_from: string;
  images: string[];
}

interface Property {
  id: string;
  address: string;
}

export default function PropertyRooms() {
  const { propertyId } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (!profile || profile.user_type !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    }

    async function fetchData() {
      try {
        await checkAdminStatus();

        const [propertyResponse, roomsResponse] = await Promise.all([
          supabase
            .from('properties')
            .select('id, address')
            .eq('id', propertyId)
            .single(),
          supabase
            .from('rooms')
            .select('id, title, description, price, available_from, images')
            .eq('property_id', propertyId)
        ]);

        if (propertyResponse.error) throw propertyResponse.error;
        if (roomsResponse.error) throw roomsResponse.error;

        setProperty(propertyResponse.data);
        setRooms(roomsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load property rooms');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId, user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Rooms at {property?.address}
          </h1>
          <p className="mt-2 text-gray-600">
            Manage rooms for this property
          </p>
        </div>
        <Link
          to="/admin/properties"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Properties
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <img
                src={room.images?.[0] || 'https://via.placeholder.com/400x300'}
                alt={room.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {room.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  ${room.price}/month
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Available from {new Date(room.available_from).toLocaleDateString()}
                </div>
              </div>
              <Link
                to={`/room/${room.id}`}
                className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Room
              </Link>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">No rooms found for this property</p>
        </div>
      )}
    </div>
  );
}
