import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../lib/mockDb';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, fullName: string, role: 'client' | 'tradie', mobileNumber: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUser(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await fetchProfile(authUser.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setUser(null);
        setLoading(false);
      }
    };

    initAuth();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth state change event:', event);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    setLoading(true);
    try {
      // In production mode, we usually need email + password. For this MVP, we support passwordless or a default password.
      // In demo mode, our mockSupabase will authenticate through mockDb login.
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123', // default mock password
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (err: any) {
      console.error('SignIn error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, fullName: string, role: 'client' | 'tradie', mobileNumber: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123', // default password
        options: {
          data: {
            full_name: fullName,
            role: role,
            mobile_number: mobileNumber,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (err: any) {
      console.error('SignUp error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'Failed to register' };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setLoading(false);
      // Clean reload to reset cache and memories (BFF pattern / secure session guideline)
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
