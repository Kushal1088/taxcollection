import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  registerCitizen: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch public.users profile for an authenticated user
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  useEffect(() => {
    // Initial session retrieval
    const initializeAuth = async () => {
      try {
        // Parse hash params if redirected from main portal
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1)); // remove '#'
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!error && data?.session) {
              // Clear hash from URL
              window.history.replaceState(null, null, window.location.pathname);
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session?.user) {
        setUser(session.user);
        const prof = await fetchProfile(session.user.id);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      setUser(data.user);
      const prof = await fetchProfile(data.user.id);
      setProfile(prof);
      return { data: { ...data, profile: prof }, error: null };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const registerCitizen = async (email, password, { fullName, mobileNumber, address, aadhaarNumber }) => {
    setLoading(true);
    try {
      console.log('[AuthContext] Attempting Supabase signUp for email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            mobile_number: mobileNumber,
            address,
            aadhaar_number: aadhaarNumber,
            role: 'citizen'
          }
        }
      });
      
      if (error) {
        console.error('[AuthContext] Supabase signUp returned error:', error);
        throw error;
      }

      if (data?.user) {
        console.log('[AuthContext] Supabase signUp succeeded. User ID:', data.user.id);
        setUser(data.user);
        
        // Force active status on client side
        await supabase.from('users').update({ status: 'active' }).eq('id', data.user.id);

        // Delete any automatically created requests during signup
        await supabase.from('citizen_requests').delete().eq('citizen_id', data.user.id);

        const prof = await fetchProfile(data.user.id);
        if (!prof) {
          console.error('[AuthContext] Failed to retrieve public profile for user:', data.user.id);
        } else {
          console.log('[AuthContext] Successfully retrieved public profile:', prof);
        }
        setProfile(prof);
      }
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Exception caught during registration:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, registerCitizen, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
