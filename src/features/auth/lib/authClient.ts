import { tokenManager } from './tokens/tokenManager';
import { tokenRefreshManager, type RefreshResult } from './tokens/tokenRefresh';

/**
 * Request queue item for handling 401 retries
 */
interface QueuedRequest {
  url: string;
  options: RequestInit;
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
}

/**
 * Authenticated API client with automatic token refresh on 401
 * Queues requests during token refresh to prevent race conditions
 */
class AuthClient {
  private baseUrl = 'https://dai-backend.onrender.com/api';
  private requestQueue: QueuedRequest[] = [];

  /**
   * Make authenticated API request
   * Automatically adds Authorization header and handles 401 responses
   */
  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    // Get access token
    const accessToken = await tokenManager.getAccessToken();

    // Add Authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    };

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 - token expired
      if (response.status === 401) {
        console.log('[AuthClient] 401 detected, attempting token refresh...');
        return this.handleUnauthorized(url, requestOptions);
      }

      return response;
    } catch (error) {
      // Silently fail for analytics and non-critical requests
      // Only log errors for debugging, don't throw to console
      if (endpoint.includes('/activity')) {
        // Analytics endpoint - fail silently
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      }
      
      // For other endpoints, still log but don't spam console
      console.warn('[AuthClient] Request failed (network error):', endpoint);
      throw error;
    }
  }

  /**
   * Handle 401 Unauthorized response
   * Refresh token and retry request
   */
  private async handleUnauthorized(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    // If refresh already in progress, queue this request
    if (tokenRefreshManager.isCurrentlyRefreshing()) {
      console.log('[AuthClient] Queueing request during refresh...');
      return this.queueRequest(url, options);
    }

    // Attempt token refresh
    const refreshResult = await tokenRefreshManager.refreshAccessToken();

    // Refresh failed - requires re-authentication
    if (!refreshResult.success || refreshResult.requiresReauth) {
      console.error('[AuthClient] Token refresh failed, clearing auth state');
      await this.handleAuthFailure(refreshResult);
      throw new Error('Authentication required');
    }

    // Retry original request with new token
    console.log('[AuthClient] Retrying request with new token...');
    const newAccessToken = refreshResult.accessToken;

    const retryOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`
      }
    };

    const retryResponse = await fetch(url, retryOptions);

    // Process queued requests
    this.processQueue(newAccessToken);

    return retryResponse;
  }

  /**
   * Queue request during token refresh
   * Returns a promise that resolves when refresh completes
   */
  private queueRequest(url: string, options: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
    });
  }

  /**
   * Process queued requests after successful token refresh
   */
  private async processQueue(newAccessToken: string): Promise<void> {
    console.log(`[AuthClient] Processing ${this.requestQueue.length} queued requests...`);

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const item of queue) {
      try {
        const retryOptions: RequestInit = {
          ...item.options,
          headers: {
            ...item.options.headers,
            Authorization: `Bearer ${newAccessToken}`
          }
        };

        const response = await fetch(item.url, retryOptions);
        item.resolve(response);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  /**
   * Handle authentication failure
   * Clear tokens and notify app to redirect to login
   */
  private async handleAuthFailure(refreshResult: RefreshResult): Promise<void> {
    await tokenManager.clearTokens();

    // TODO: Emit event or use navigation to redirect to login
    // For now, just log the error
    console.error('[AuthClient] Auth failure:', refreshResult.error);

    // Clear queue
    this.requestQueue.forEach(item => {
      item.reject(new Error('Authentication required'));
    });
    this.requestQueue = [];
  }

  /**
   * Make GET request
   */
  async get(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make POST request
   */
  async post(endpoint: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Make PUT request
   */
  async put(endpoint: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Make PATCH request
   */
  async patch(endpoint: string, body?: any, options?: RequestInit): Promise<Response> {
    return this.fetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Make DELETE request
   */
  async delete(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload(endpoint: string, formData: FormData, options?: RequestInit): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const accessToken = await tokenManager.getAccessToken();

    const headers = {
      ...(options?.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      // Don't set Content-Type - browser will set it with boundary
    };

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData
    });

    if (response.status === 401) {
      return this.handleUnauthorized(url, {
        ...options,
        method: 'POST',
        body: formData
      });
    }

    return response;
  }
}

// Singleton instance
export const authClient = new AuthClient();
