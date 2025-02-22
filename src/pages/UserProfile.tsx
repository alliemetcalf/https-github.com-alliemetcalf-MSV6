import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, DollarSign, MapPin, Phone, Mail, Building2, CheckCircle, Clock, User, Edit2, Save, X, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import MarkdownEditor from '../components/MarkdownEditor';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  preferred_name: string | null;
  current_city: string | null;
  current_state: string | null;
  phone: string | null;
  allow_calls: boolean;
  allow_texts: boolean;
  monthly_income: number | null;
  employer: string | null;
  occupation: string | null;
  desired_move_date: string | null;
  about_host: string | null;
  user_type: string;
  picture_url: string | null;
  new_video_url: string | null;
  is_active: boolean;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing || false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aboutHost, setAboutHost] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function checkAdminStatus() {
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        setIsAdmin(adminProfile?.user_type === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setProfile(data);
        setEditedProfile(data);
        setAboutHost(data.about_host || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
    fetchProfile();
  }, [user, id, navigate]);

  const canEdit = isAdmin || user?.id === id;

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    try {
      setSaving(true);

      const updateData = {
        ...editedProfile,
        about_host: aboutHost,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setProfile(updateData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!profile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, is_active: isActive } : null);
      setEditedProfile(prev => prev ? { ...prev, is_active: isActive } : null);
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {user?.id === id && (
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">This is your profile</span>
          </div>
          <Link
            to="/profile"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit My Profile</span>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {profile.picture_url ? (
                  <img
                    src={profile.picture_url}
                    alt={profile.preferred_name || `${profile.first_name} ${profile.last_name}`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.preferred_name || profile.first_name}
                  </h1>
                  {!profile.is_active && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.user_type === 'admin' 
                      ? 'bg-purple-100 text-purple-800'
                      : profile.user_type === 'host'
                      ? 'bg-green-100 text-green-800'
                      : profile.user_type === 'tenant'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.user_type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && (
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profile.is_active}
                      onChange={(e) => handleStatusChange(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span>Active</span>
                  </label>
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedProfile(profile);
                        }}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={editedProfile?.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={editedProfile?.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                    <input
                      type="text"
                      value={editedProfile?.preferred_name || ''}
                      onChange={(e) => handleInputChange('preferred_name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={editedProfile?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                    <div className="mt-2 space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editedProfile?.allow_calls || false}
                          onChange={(e) => handleInputChange('allow_calls', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                        <span className="ml-2 text-sm text-gray-600">Allow calls</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editedProfile?.allow_texts || false}
                          onChange={(e) => handleInputChange('allow_texts', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                        <span className="ml-2 text-sm text-gray-600">Allow texts</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current City</label>
                    <input
                      type="text"
                      value={editedProfile?.current_city || ''}
                      onChange={(e) => handleInputChange('current_city', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={editedProfile?.current_state || ''}
                      onChange={(e) => handleInputChange('current_state', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {editedProfile?.user_type === 'tenant' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
                        <input
                          type="number"
                          value={editedProfile?.monthly_income || ''}
                          onChange={(e) => handleInputChange('monthly_income', parseInt(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employer</label>
                        <input
                          type="text"
                          value={editedProfile?.employer || ''}
                          onChange={(e) => handleInputChange('employer', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <input
                          type="text"
                          value={editedProfile?.occupation || ''}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Desired Move Date</label>
                        <input
                          type="date"
                          value={editedProfile?.desired_move_date?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('desired_move_date', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                        />
                      </div>
                    </>
                  )}

                  {editedProfile?.user_type === 'host' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">About Me (as a Host)</label>
                      <MarkdownEditor
                        value={aboutHost}
                        onChange={setAboutHost}
                        placeholder="Tell potential tenants about yourself as a host..."
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="mb-4 text-gray-600">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h2>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h2>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-5 h-5 mr-2" />
                        <span>{profile.email}</span>
                      </div>
                      {profile.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-5 h-5 mr-2" />
                          <span>{profile.phone}</span>
                          <div className="ml-2 space-x-2">
                            {profile.allow_calls && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Calls OK
                              </span>
                            )}
                            {profile.allow_texts && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Texts OK
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {profile.current_city && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-5 h-5 mr-2" />
                          <span>
                            {profile.current_city}
                            {profile.current_state && `, ${profile.current_state}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.user_type === 'tenant' && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Tenant Information</h2>
                      <div className="space-y-2">
                        {profile.monthly_income && (
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-5 h-5 mr-2" />
                            <span>Monthly Income: ${profile.monthly_income.toLocaleString()}</span>
                          </div>
                        )}
                        {profile.employer && (
                          <div className="flex items-center text-gray-600">
                            <Building2 className="w-5 h-5 mr-2" />
                            <span>
                              {profile.employer}
                              {profile.occupation && ` - ${profile.occupation}`}
                            </span>
                          </div>
                        )}
                        {profile.desired_move_date && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-5 h-5 mr-2" />
                            <span>
                              Desired Move Date: {new Date(profile.desired_move_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {profile.user_type === 'host' && profile.about_host && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">About {profile.preferred_name || profile.first_name}</h2>
                    <div className="prose prose-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {profile.about_host}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {profile.new_video_url && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Introduction Video</h2>
              <video
                src={profile.new_video_url}
                controls
                className="w-full max-w-2xl rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
