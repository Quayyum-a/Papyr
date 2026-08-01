// Auth Context for Client Components
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile } from '@/lib/supabase/client';

// Get the production URL for email redirects
const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://papyr-app-mu.vercel.app';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null; requiresVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { display_name?: string; avatar_url?: string }) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function logAuth(event: string, data: Record<string, unknown>) {
  console.log(`[AUTH] ${event}`, {
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      logAuth('FETCH_PROFILE_START', { userId });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        logAuth('FETCH_PROFILE_ERROR', { userId, error: error.message, code: error.code });
        throw error;
      }
      logAuth('FETCH_PROFILE_SUCCESS', { userId, hasData: !!data });
      return data as UserProfile | null;
    } catch (err) {
      logAuth('FETCH_PROFILE_EXCEPTION', { userId, error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        logAuth('INIT_AUTH_START', {});
        const { data: { session }, error } = await supabase.auth.getSession();

        logAuth('INIT_AUTH_SESSION', { hasSession: !!session, hasUser: !!session?.user, error: error?.message });

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        }
      } catch (err) {
        logAuth('INIT_AUTH_EXCEPTION', { error: err instanceof Error ? err.message : String(err) });
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logAuth('AUTH_STATE_CHANGE', { event, hasSession: !!session, hasUser: !!session?.user });
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    logAuth('SIGNUP_ATTEMPT', { email, displayName });
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${PRODUCTION_URL}/auth/callback`;
      logAuth('SIGNUP_REDIRECT_URL', { redirectUrl });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      logAuth('SIGNUP_RESPONSE', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
        errorCode: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
        requiresVerification: data?.user && !data?.session
      });

      if (error) {
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined;
        logAuth('SIGNUP_ERROR', { error: error.message, code: errorCode });
        throw error;
      }

      if (data.user && !data.session) {
        logAuth('SIGNUP_REQUIRES_VERIFICATION', { email, userId: data.user.id });
        return { error: null, requiresVerification: true };
      }

      logAuth('SIGNUP_SUCCESS', { email, userId: data.user?.id });
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      logAuth('SIGNUP_EXCEPTION', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
      setError(errorMessage);
      return { error: err instanceof Error ? err : new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    logAuth('SIGNIN_ATTEMPT', { email });
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      logAuth('SIGNIN_RESPONSE', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
        errorCode: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined
      });

      if (error) {
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined;
        logAuth('SIGNIN_ERROR', { error: error.message, code: errorCode });
        throw error;
      }

      logAuth('SIGNIN_SUCCESS', { email, userId: data.user?.id });
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      logAuth('SIGNIN_EXCEPTION', { error: errorMessage, stack: err instanceof Error ? err.stack : undefined });
      setError(errorMessage);
      return { error: err instanceof Error ? err : new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    logAuth('SIGNOUT_ATTEMPT', {});
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      logAuth('SIGNOUT_SUCCESS', {});
    } catch (err) {
      logAuth('SIGNOUT_EXCEPTION', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { display_name?: string; avatar_url?: string }) => {
    if (!user) return { error: new Error('No user logged in') };

    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      logAuth('PROFILE_UPDATE_SUCCESS', { userId: user.id });
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      logAuth('PROFILE_UPDATE_ERROR', { error: errorMessage });
      setError(errorMessage);
      return { error: err instanceof Error ? err : new Error(errorMessage) };
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
    } catch (err) {
      logAuth('REFRESH_USER_ERROR', { error: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshUser,
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