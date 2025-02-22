import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, checkConnection } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    async function initializeAuth() {
      try {
        // Check Supabase connection first
        const isConnected = await checkConnection();
        if (!isConnected) {
          throw new Error('Unable to connect to Supabase');
        }

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!mounted) return;
            
            const currentUser = session?.user ?? null;
            setUser(currentUser);
          }
        );

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying auth initialization (attempt ${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initializeAuth, 1000 * retryCount);
        } else {
          if (mounted) {
            setLoading(false);
            toast.error('Failed to initialize authentication. Please refresh the page.');
          }
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // First check if a profile already exists with this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('An account with this email already exists');
    }

    // Sign up the user
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    if (signUpError) throw signUpError;

    if (data.user) {
      try {
        // Create profile using upsert to avoid conflicts
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            first_name: fullName.split(' ')[0],
            last_name: fullName.split(' ').slice(1).join(' '),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (profileError) throw profileError;
      } catch (error) {
        // If profile creation fails, delete the auth user to maintain consistency
        await supabase.auth.admin.deleteUser(data.user.id);
        throw error;
      }
    }

    return { user: data.user };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
