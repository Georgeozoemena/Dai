import { tokenManager } from './tokenManager';
import { DeviceManager } from '../device/deviceManager';

/**
 * Token refresh result
 */
export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  requiresReauth?: boolean;
}

/**
 * Mutex-protected token refresh manager
 * Prevents duplicate refresh requests during concurrent API calls
 */
class TokenRefreshManager {
  private refreshPromise: Promise<RefreshResult> | null = null;
  private isRefreshing = false;

  /**
   * Refresh access token with mutex protection
   * Multiple concurrent calls will wait for the same refresh operation
   */
  async refreshAccessToken(): Promise<RefreshResult> {
    // If refresh already in progress, return the same promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[TokenRefresh] Waiting for ongoing refresh...');
      return this.refreshPromise;
    }

    // Start new refresh operation
    this.isRefreshing = true;
    this.refreshPromise = this.executeRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Release mutex
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Execute token refresh operation
   */
  private async executeRefresh(): Promise<RefreshResult> {
    try {
      console.log('[TokenRefresh] Starting token refresh...');

      // Step 1: Get current refresh token
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          error: 'no_refresh_token',
          requiresReauth: true
        };
      }

      // Step 2: Validate device for refresh
      const deviceValidation = await DeviceManager.validateDeviceForRefresh();
      if (!deviceValidation.isValid) {
        console.warn('[TokenRefresh] Device validation failed:', deviceValidation.reason);
        return {
          success: false,
          error: 'device_not_registered',
          requiresReauth: true
        };
      }

      // Step 3: Get device info for backend
      const deviceInfo = await DeviceManager.getDeviceInfo();

      // Step 4: Call backend refresh endpoint
      const response = await fetch('https://dai-backend.onrender.com/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          deviceHash: deviceInfo.deviceHash,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion
        })
      });

      const data = await response.json();

      // Step 5: Handle response
      if (!response.ok) {
        console.error('[TokenRefresh] Refresh failed:', data);

        // Detect refresh token reuse (security breach)
        if (response.status === 403 && data.error === 'token_reuse_detected') {
          console.error('[TokenRefresh] SECURITY: Refresh token reuse detected!');
          await this.handleSecurityBreach();
          return {
            success: false,
            error: 'token_reuse_detected',
            requiresReauth: true
          };
        }

        // Invalid/expired refresh token
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: data.error || 'invalid_refresh_token',
            requiresReauth: true
          };
        }

        return {
          success: false,
          error: data.error || 'refresh_failed',
          requiresReauth: false
        };
      }

      // Step 6: Store new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

      await tokenManager.storeTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });

      console.log('[TokenRefresh] Token refresh successful');

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('[TokenRefresh] Refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown_error',
        requiresReauth: false
      };
    }
  }

  /**
   * Handle security breach (token reuse detected)
   * Clear all tokens and force re-authentication
   */
  private async handleSecurityBreach(): Promise<void> {
    console.error('[TokenRefresh] Handling security breach...');
    
    try {
      // Clear all tokens
      await tokenManager.clearTokens();
      
      // Unregister device
      await DeviceManager.unregisterDevice();
      
      // TODO: Notify user of security breach
      // TODO: Send security alert to backend
      
      console.log('[TokenRefresh] Security breach handled, user must re-authenticate');
    } catch (error) {
      console.error('[TokenRefresh] Failed to handle security breach:', error);
    }
  }

  /**
   * Check if currently refreshing
   */
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Reset refresh state (for testing/debugging)
   */
  reset(): void {
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}

// Singleton instance
export const tokenRefreshManager = new TokenRefreshManager();

/**
 * Convenience function for refreshing tokens
 */
export async function refreshAccessToken(): Promise<RefreshResult> {
  return tokenRefreshManager.refreshAccessToken();
}

/**
 * Check if token refresh is in progress
 */
export function isRefreshing(): boolean {
  return tokenRefreshManager.isCurrentlyRefreshing();
}
