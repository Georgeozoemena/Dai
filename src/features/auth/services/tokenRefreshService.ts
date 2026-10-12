/**
 * Token Refresh Service
 * 
 * Handles automatic token refresh when access token expires
 * Uses refresh token to get new access + refresh token pair (rotation)
 */

import Constants from 'expo-constants';
import { tokenManager } from '../lib/tokens/tokenManager';
import { useAuthStore } from '../../../store/auth/authStore';

const LOCAL_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  process.env.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  'http://localhost:5000';

const PRODUCTION_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  'https://dai-backend.onrender.com';

// Try local first, fallback to production
const API_URLS = [LOCAL_API_URL, PRODUCTION_API_URL];

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

/**
 * Try to reach backend with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 3000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try multiple backend URLs with fallback
 */
async function fetchWithFallback(
  endpoint: string,
  options: RequestInit
): Promise<{ response: Response; usedUrl: string }> {
  let lastError: Error | null = null;

  for (const baseUrl of API_URLS) {
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetchWithTimeout(url, options, 3000);
      return { response, usedUrl: baseUrl };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  throw new Error(`Cannot reach backend: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Refresh access token using refresh token
 * Returns new token pair (tokens rotate for security)
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  try {
    const refreshToken = await tokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('[TokenRefresh] Attempting to refresh access token...');

    const { response, usedUrl } = await fetchWithFallback('/api/v2/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    console.log('[TokenRefresh] Response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('[TokenRefresh] Refresh failed:', data);
      
      // If refresh token is invalid/expired, user needs to login again
      if (response.status === 401 || response.status === 403) {
        // Clear tokens and logout
        await tokenManager.clearTokens();
        useAuthStore.getState().logout();
        throw new Error('Refresh token expired. Please login again.');
      }

      throw new Error(data.message || 'Token refresh failed');
    }

    // Validate response
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Invalid refresh response');
    }

    console.log(`[TokenRefresh] ✅ Tokens refreshed successfully using: ${usedUrl}`);

    // Store new tokens (they rotate!)
    await tokenManager.storeTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn || 900,
    });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  } catch (error) {
    console.error('[TokenRefresh] Failed to refresh token:', error);
    throw error;
  }
}

/**
 * Automatically refresh token if needed before API call
 * Call this before making authenticated requests
 */
export async function ensureValidToken(): Promise<string | null> {
  try {
    // Check if token needs refresh
    if (tokenManager.shouldRefresh()) {
      console.log('[TokenRefresh] Token needs refresh');
      const newTokens = await refreshAccessToken();
      return newTokens.accessToken;
    }

    // Token is still valid
    const token = await tokenManager.getAccessToken();
    return token;
  } catch (error) {
    console.error('[TokenRefresh] Failed to ensure valid token:', error);
    return null;
  }
}

/**
 * Create an authenticated fetch wrapper that handles token refresh
 * Use this for all API calls that require authentication
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Ensure we have a valid token (refresh if needed)
    const token = await ensureValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    // Add Authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    // Make the request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get 401, try refreshing token once
    if (response.status === 401) {
      console.log('[TokenRefresh] Got 401, attempting token refresh...');

      try {
        const newTokens = await refreshAccessToken();
        
        // Retry request with new token
        headers.Authorization = `Bearer ${newTokens.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });

        console.log('[TokenRefresh] Retry with new token:', response.status);
      } catch (refreshError) {
        console.error('[TokenRefresh] Refresh failed on 401:', refreshError);
        // Clear tokens and redirect to login
        await tokenManager.clearTokens();
        useAuthStore.getState().logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('[AuthenticatedFetch] Request failed:', error);
    throw error;
  }
}
