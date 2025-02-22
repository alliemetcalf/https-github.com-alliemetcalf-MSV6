import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, Edit2, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  address: string;
  total_rooms: number;
  is_suspended: boolean;
  rooms: {
    id: string;
    title: string;
    price: number;
    available_from: string;
    is_advertised: boolean;
    is_suspended: boolean;
  }[];
}

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuspended, setShowSuspended] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            address,
            total_rooms,
            is_suspended,
            rooms (
              id,
              title,
              price,
              available_from,
              is_advertised,
              is_suspended
            )
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [user, navigate]);

  const handleSuspendRoom = async (roomId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_suspended: suspend })
        .eq('id', roomId);

      if (error) throw error;

      // Update local state
      setProperties(prevProperties => 
        prevProperties.map(property => ({
          ...property,
          rooms: property.rooms.map(room => 
            room.id === roomId ? { ...room, is_suspended: suspend } : room
          )
        }))
      );

      toast.success(`Room ${suspend ? 'suspended' : 'reactivated'} successfully`);
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room status');
    }
  };

  const handleSuspendProperty = async (propertyId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_suspended: suspend })
        .eq('id', propertyId);

      if (error) throw error;

      // Update local state
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId ? { ...property, is_suspended: suspend } : property
        )
      );

      toast.success(`Property ${suspend ? 'suspended' : 'reactivated'} successfully`);
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter properties based on suspension status
  const filteredProperties = properties.filter(property => property.is_suspended === showSuspended);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {showSuspended ? 'Suspended Listings' : 'Active Listings'}
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSuspended(!showSuspended)}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            {showSuspended ? 'View Active Listings' : 'View Suspended Listings'}
          </button>
          <Link
            to="/post-property"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Add New Property
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900">{property.address}</h2>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!property.is_suspended}
                        onChange={(e) => handleSuspendProperty(property.id, !e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  <p className="text-gray-600">Total Rooms: {property.total_rooms}</p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/property/${property.id}`}
                    className="p-2 text-blue-600 hover:text-blue-700 transition"
                    title="View Property"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/post-property?edit=${property.id}`}
                    className="p-2 text-blue-600 hover:text-blue-700 transition"
                    title="Edit Property"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {property.rooms.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Rooms</h3>
                  <div className="divide-y divide-gray-200">
                    {property.rooms.map((room) => (
                      <div key={room.id} className="py-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <Link
                              to={`/room/${room.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition"
                            >
                              {room.title}
                            </Link>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!room.is_suspended}
                                onChange={(e) => handleSuspendRoom(room.id, !e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">Active</span>
                            </label>
                            {room.is_advertised && !room.is_suspended && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Advertised
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {room.price}/month
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Available {new Date(room.available_from).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link
                            to={`/room/${room.id}`}
                            className="p-2 text-blue-600 hover:text-blue-700 transition"
                            title="View Room"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/post-room?edit=${room.id}`}
                            className="p-2 text-blue-600 hover:text-blue-700 transition"
                            title="Edit Room"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center py-4 bg-gray-50 rounded-md">
                  <p className="text-gray-600">No rooms listed yet</p>
                  <Link
                    to={`/post-room?property=${property.id}`}
                    className="mt-2 inline-block text-blue-600 hover:text-blue-700"
                  >
                    Add a Room
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProperties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg mb-4">
              {showSuspended 
                ? "You don't have any suspended listings" 
                : "You haven't posted any properties yet"}
            </p>
            {!showSuspended && (
              <Link
                to="/post-property"
                className="text-blue-600 hover:text-blue-700 transition"
              >
                Post your first property
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
