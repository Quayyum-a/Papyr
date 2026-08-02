/**
 * URL Utilities for Papyr
 * Handles environment-aware URL generation for authentication flows
 */

const PRODUCTION_URL = 'https://papyr-app-mu.vercel.app';
const PREVIEW_URL_PREFIX = 'https://papyr-git-';
const LOCALHOST_URL = 'http://localhost:3000';

/**
 * Detects the current environment
 * @returns 'development' | 'preview' | 'production'
 */
export function getEnvironment(): 'development' | 'preview' | 'production' {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('papyr-git-') || hostname.includes('vercel.app')) {
      return 'preview';
    }
    return 'production';
  }

  // Server-side detection
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'development') return 'development';

  // Fallback to env var
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl?.includes('localhost')) return 'development';
  if (appUrl?.includes('vercel.app')) return 'preview';
  if (appUrl?.includes('papyr-app-mu.vercel.app')) return 'production';

  return 'development';
}

/**
 * Gets the base application URL for the current environment
 */
export function getAppUrl(): string {
  const env = getEnvironment();
  switch (env) {
    case 'production':
      return PRODUCTION_URL;
    case 'preview':
      // Preview URLs are dynamic, fallback to env var or construct from Vercel env
      return process.env.NEXT_PUBLIC_APP_URL || PREVIEW_URL_PREFIX;
    case 'development':
    default:
      return process.env.NEXT_PUBLIC_APP_URL || LOCALHOST_URL;
  }
}

/**
 * Gets the authentication callback URL for the current environment
 */
export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}

/**
 * Gets the login URL with optional redirect
 */
export function getLoginUrl(redirectTo?: string): string {
  const baseUrl = `${getAppUrl()}/auth/login`;
  if (redirectTo) {
    return `${baseUrl}?redirect=${encodeURIComponent(redirectTo)}`;
  }
  return baseUrl;
}

/**
 * Gets the signup URL with optional redirect
 */
export function getSignupUrl(redirectTo?: string): string {
  const baseUrl = `${getAppUrl()}/auth/signup`;
  if (redirectTo) {
    return `${baseUrl}?redirect=${encodeURIComponent(redirectTo)}`;
  }
  return baseUrl;
}

/**
 * Gets the dashboard URL
 */
export function getDashboardUrl(): string {
  return `${getAppUrl()}/dashboard`;
}

/**
 * Gets the callback URL with optional next parameter
 */
export function getCallbackUrl(next?: string): string {
  const baseUrl = getAuthCallbackUrl();
  if (next) {
    return `${baseUrl}?next=${encodeURIComponent(next)}`;
  }
  return baseUrl;
}

/**
 * Gets the password reset callback URL
 */
export function getPasswordResetCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback?type=recovery`;
}

/**
 * Gets the magic link callback URL
 */
export function getMagicLinkCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}

/**
 * Checks if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets the current origin
 */
export function getOrigin(): string {
  if (isBrowser()) {
    return window.location.origin;
  }
  return getAppUrl();
}

/**
 * Builds a full URL with query parameters
 */
export function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, getAppUrl());
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

/**
 * Extracts the redirect URL from search params or defaults to dashboard
 */
export function getRedirectFromSearchParams(searchParams: URLSearchParams): string {
  return searchParams.get('redirect') ?? '/dashboard';
}

/**
 * Validates that a URL is safe for redirect (same origin)
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = getOrigin();
    return parsed.origin === origin;
  } catch {
    return false;
  }
}

/**
 * Gets a safe redirect URL, falling back to dashboard
 */
export function getSafeRedirect(url: string | null): string {
  if (!url) return '/dashboard';
  if (isSafeRedirectUrl(url)) return url;
  return '/dashboard';
}