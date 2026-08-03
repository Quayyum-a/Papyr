'use client';

import { useState } from 'react';

interface UseGoogleOAuthOptions {
  isLoading?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useGoogleOAuth({ isLoading = false, onSuccess, onError }: UseGoogleOAuthOptions = {}) {
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleOAuth = async () => {
    if (isLoading || oauthLoading) return;

    setOauthLoading(true);
    try {
      // TODO: Implement actual Google OAuth flow with Supabase
      // For now, simulate unavailable OAuth
      throw new Error('Google OAuth not configured yet');
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err : new Error('Google OAuth failed'));
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const isDisabled = isLoading || oauthLoading;
  const isAvailable = false; // Set to true when OAuth is configured

  return {
    handleGoogleOAuth,
    isDisabled,
    isAvailable,
    isLoading: oauthLoading,
  };
}