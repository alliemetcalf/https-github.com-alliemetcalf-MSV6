import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, DollarSign, Calendar, ChevronDown, ChevronUp, PlusSquare, Edit2, X, User, Save, Check, CheckSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import PropertyMap from '../components/PropertyMap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Property {
  id: string;
  address: string;
  total_rooms: number;
  description: string;
  amenities: string;
  house_rules: string;
  images: string[];
  property_type: string;
  amenities_list: string[];
  utilities_included: string[];
  vibes: string[];
  owner: {
    id: string;
    full_name: string;
    about_host: string | null;
    picture_url: string | null;
    current_city: string | null;
    current_state: string | null;
    phone: string | null;
    allow_calls: boolean;
    allow_texts: boolean;
  };
  rooms: {
    id: string;
    title: string;
    price: number;
    available_from: string;
    images: string[];
  }[];
}

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyDescription, setShowPropertyDescription] = useState(false);
  const [showHouseRules, setShowHouseRules] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showHostPopup, setShowHostPopup] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.user_type === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }

    async function fetchProperty() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            owner:profiles(
              id,
              full_name,
              about_host,
              picture_url,
              current_city,
              current_state,
              phone,
              allow_calls,
              allow_texts
            ),
            rooms(
              id,
              title,
              price,
              available_from,
              images
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
    fetchProperty();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <p className="text-red-600 mb-4">{error || 'Property not found'}</p>
      </div>
    );
  }

  const isOwner = user?.id === property.owner.id;
  const canEdit = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {canEdit && (
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                to={`/post-property?edit=${property.id}`}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Property</span>
              </Link>
            </div>
          </div>
        )}

        {property.images && property.images.length > 0 && (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            className="h-[400px]"
          >
            {property.images.map((url, index) => (
              <SwiperSlide key={index}>
                <img
                  src={url}
                  alt={`Property view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.address}</h1>
          
          <div className="mb-4">
            <button
              onClick={() => setShowHostPopup(true)}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Hosted by {property.owner.full_name}
            </button>
          </div>

          {showHostPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      {property.owner.picture_url ? (
                        <img
                          src={property.owner.picture_url}
                          alt={property.owner.full_name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {property.owner.full_name}
                        </h2>
                        {property.owner.current_city && (
                          <p className="text-gray-600">
                            {property.owner.current_city}
                            {property.owner.current_state && `, ${property.owner.current_state}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHostPopup(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  {property.owner.about_host && (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {property.owner.about_host}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <button
                onClick={() => setShowPropertyDescription(!showPropertyDescription)}
                className="flex items-center justify-between w-full text-left text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition"
              >
                <span>About the Property</span>
                {showPropertyDescription ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {showPropertyDescription && (
                <div className="prose prose-sm text-gray-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {property.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Details</h2>
              <ul className="space-y-2 text-gray-600">
                <li>Total Rooms: {property.total_rooms}</li>
                <li>Property Type: {property.property_type}</li>
                <button
                  onClick={() => setShowHouseRules(!showHouseRules)}
                  className="flex items-center justify-between w-full text-left text-blue-600 hover:text-blue-700 transition"
                >
                  <span>House Rules</span>
                  {showHouseRules ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showHouseRules && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-200 prose prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {property.house_rules || 'No house rules listed'}
                    </ReactMarkdown>
                  </div>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {/* Property Features */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="space-y-2">
                  {property.amenities_list.map((amenity) => (
                    <div key={amenity} className="flex items-center text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Utilities Included */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Utilities Included</h3>
                <div className="space-y-2">
                  {property.utilities_included.map((utility) => (
                    <div key={utility} className="flex items-center text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                      <span>{utility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vibes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vibes</h3>
                <div className="space-y-2">
                  {property.vibes.map((vibe) => (
                    <div key={vibe} className="flex items-center text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                      <span>{vibe}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Rooms Section */}
            {property.rooms && property.rooms.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.rooms.map((room) => (
                    <Link
                      key={room.id}
                      to={`/room/${room.id}`}
                      className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition duration-200"
                    >
                      <div className="relative h-48">
                        <img
                          src={room.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80'}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{room.title}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>${room.price}/month</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Available from {new Date(room.available_from).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
        <PropertyMap address={property.address} />
      </div>
    </div>
  );
}
