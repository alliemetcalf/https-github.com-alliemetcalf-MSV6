import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Calendar, DollarSign, AlertCircle, Home, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface PreApproval {
  id: string;
  monthly_income: number;
  criminal_history: boolean;
  eviction_history: boolean;
  ideal_move_in: string;
  status: string;
  created_at: string;
  room: {
    id: string;
    title: string;
    price: number;
    min_income: number;
    property: {
      id: string;
      owner_id: string;
    };
  } | null;
  profile: {
    full_name: string;
    email: string;
    new_video_url: string | null;
  };
}

export default function PreApprovalList() {
  const { user } = useAuth();
  const [preApprovals, setPreApprovals] = useState<PreApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function checkPermissionsAndFetchData() {
      try {
        // First check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        const userIsAdmin = profile?.user_type === 'admin';
        setIsAdmin(userIsAdmin);

        // Fetch pre-approvals based on user role
        let query = supabase
          .from('pre_approvals')
          .select(`
            *,
            room:rooms(
              id,
              title,
              price,
              min_income,
              property:properties(id, owner_id)
            ),
            profile:profiles(
              full_name,
              email,
              new_video_url
            )
          `)
          .order('created_at', { ascending: false });

        // If not admin, only show pre-approvals for properties they own
        if (!userIsAdmin) {
          query = query.eq('room.property.owner_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPreApprovals(data || []);
      } catch (error) {
        console.error('Error fetching pre-approvals:', error);
        toast.error('Failed to load pre-approvals');
      } finally {
        setLoading(false);
      }
    }

    checkPermissionsAndFetchData();
  }, [user, navigate]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pre_approvals')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPreApprovals(prev =>
        prev.map(approval =>
          approval.id === id ? { ...approval, status: newStatus } : approval
        )
      );

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin && preApprovals.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pre-approval Requests</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">No pre-approval requests found for your properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pre-approval Requests</h1>
      
      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Introduction Video</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <video
                src={activeVideo}
                controls
                autoPlay
                className="w-full rounded-lg"
                style={{ maxHeight: '70vh' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {preApprovals.map((approval) => (
          <div key={approval.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {approval.profile.full_name}
                  </h2>
                  <p className="text-gray-600">{approval.profile.email}</p>
                </div>
                {approval.profile.new_video_url && (
                  <button
                    onClick={() => setActiveVideo(approval.profile.new_video_url)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition"
                  >
                    <Video className="w-5 h-5" />
                    <span>Watch my intro</span>
                  </button>
                )}
              </div>
              <div className="mt-2 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                    approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'}`}
                >
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                </span>
              </div>
            </div>

            {approval.room && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Room Details
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>Title: {approval.room.title}</p>
                  <div className="space-y-1">
                    <p>Monthly Rent: ${approval.room.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Required Monthly Income: ${approval.room.min_income.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-5 h-5 mr-2" />
                <span>Monthly Income: ${approval.monthly_income.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Move-in: {new Date(approval.ideal_move_in).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Applied: {new Date(approval.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                {approval.criminal_history ? (
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                <span className="text-gray-600">
                  {approval.criminal_history ? 'Has criminal history' : 'No criminal history'}
                </span>
              </div>

              <div className="flex items-center">
                {approval.eviction_history ? (
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                )}
                <span className="text-gray-600">
                  {approval.eviction_history ? 'Has eviction history' : 'No eviction history'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => updateStatus(approval.id, 'approved')}
                disabled={approval.status === 'approved'}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(approval.id, 'rejected')}
                disabled={approval.status === 'rejected'}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus(approval.id, 'pending')}
                disabled={approval.status === 'pending'}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Pending
              </button>
            </div>
          </div>
        ))}

        {preApprovals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">No pre-approval requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
