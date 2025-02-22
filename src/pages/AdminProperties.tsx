import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, DollarSign, Calendar, Trash2, Edit2, X, Users, Building2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

interface Property {
  id: string;
  address: string;
  total_rooms: number;
  description: string;
  amenities: string;
  house_rules: string;
  images: string[];
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
  rooms: {
    id: string;
    title: string;
    description: string;
    price: number;
    available_from: string;
    images: string[];
    min_income: number;
    requires_background_check: boolean;
  }[];
}

function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

        setIsAdmin(true);
        fetchProperties();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    }

    checkAdminStatus();
  }, [user, navigate]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles(id, full_name, email),
          rooms(
            id, 
            title,
            description,
            price,
            available_from,
            images,
            min_income,
            requires_background_check
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyId));
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="mt-2 text-gray-600">Manage all properties and their associated rooms</p>
        </div>
        <Link
          to="/admin/users"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          <Users className="w-5 h-5" />
          <span>Manage Users</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rooms
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{property.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{property.owner.full_name}</div>
                    <div className="text-sm text-gray-500">{property.owner.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/admin/properties/${property.id}/rooms`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {property.rooms.length} listed
                      <div className="text-sm text-gray-500">
                        From ${Math.min(...property.rooms.map(r => r.price || 0), 0)}/mo
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(property.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <Link
                        to={`/property/${property.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Property"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/post-property?edit=${property.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Property"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Property"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">No properties found</p>
        </div>
      )}
    </div>
  );
}

export default AdminProperties;
