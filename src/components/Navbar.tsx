import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, PlusSquare, User, CheckCircle, ClipboardList, Menu, X, Home, Eye, Users, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Profile {
  picture_url: string | null;
  user_type: string;
}

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasPreApproval, setHasPreApproval] = useState(false);
  const [hasProperty, setHasProperty] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef(null);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user) return;

      try {
        // Check pre-approval status
        const { data: preApproval } = await supabase
          .from('pre_approvals')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        setHasPreApproval(!!preApproval);

        // Check property status
        const { data: property } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        setHasProperty(!!property);

        // Get user profile with picture
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type, picture_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setIsAdmin(profileData.user_type === 'admin');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    }

    checkUserStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setProfile(null);
      setIsAdmin(false);
      setHasPreApproval(false);
      setHasProperty(false);
      setShowProfileMenu(false);
      setShowPostMenu(false);
      setIsMobileMenuOpen(false);

      toast.success('Signed out successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Error signing out. Please try again.');
    }
  };

  // Close menus on route change
  useEffect(() => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    setShowPostMenu(false);
    setShowAdminMenu(false);
  }, [location]);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  return (
    <nav className="bg-gradient-to-r from-primary-dark via-primary to-secondary text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
              }
            }}
          >
            <img src="https://bmkkpzzpguxniskbxrhd.supabase.co/storage/v1/object/public/profile_icons//MS_Stamp_diecut.png" alt="Logo" className="w-8 h-8" />
            <span className="hidden sm:inline">Multisingle</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md hover:bg-primary-dark transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className="flex items-center space-x-1 hover:text-secondary-light transition"
                    >
                      <Users className="w-5 h-5" />
                      <span>Admin</span>
                    </button>
                    {showAdminMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1" role="menu">
                          <Link
                            to="/admin/properties"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowAdminMenu(false)}
                          >
                            <Building2 className="w-4 h-4 mr-2" />
                            Manage Properties
                          </Link>
                          <Link
                            to="/admin/users"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowAdminMenu(false)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Manage Users
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {hasPreApproval ? (
                  <CheckCircle className="w-5 h-5 text-secondary-light" />
                ) : (
                  <Link
                    to="/pre-approval"
                    className="flex items-center space-x-1 hover:text-secondary-light transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  to="/pre-approvals"
                  className="flex items-center space-x-1 hover:text-secondary-light transition"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Pre-approvals</span>
                </Link>
                <Link
                  to="/post-property"
                  className="flex items-center space-x-1 hover:text-secondary-light transition"
                >
                  <PlusSquare className="w-5 h-5" />
                  <span>Post Property</span>
                </Link>
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center hover:text-secondary-light transition"
                  >
                    {profile?.picture_url ? (
                      <img
                        src={profile.picture_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center border-2 border-white">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          View Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 hover:text-secondary-light transition"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 hover:text-secondary-light transition"
                >
                  <User className="w-5 h-5" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-4 space-y-2 border-t border-primary-light">
            {user ? (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 w-full text-left"
                >
                  {profile?.picture_url ? (
                    <img
                      src={profile.picture_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center border-2 border-white">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <span className="font-medium">My Profile</span>
                </button>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/properties"
                      className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>Manage Properties</span>
                      </div>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Manage Users</span>
                      </div>
                    </Link>
                  </>
                )}
                <Link
                  to="/pre-approvals"
                  className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-5 h-5" />
                    <span>Pre-approvals</span>
                  </div>
                </Link>
                <Link
                  to="/post-property"
                  className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <PlusSquare className="w-5 h-5" />
                    <span>Post Property</span>
                  </div>
                </Link>
                <Link
                  to="/my-listings"
                  className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Home className="w-5 h-5" />
                    <span>My Listings</span>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left py-2 hover:bg-primary-dark px-3 rounded transition"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </div>
                </Link>
                <Link
                  to="/register"
                  className="block py-2 hover:bg-primary-dark px-3 rounded transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Register</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
