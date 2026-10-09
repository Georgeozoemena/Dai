/**
 * Token Manager - Secure token storage using react-native-keychain
 * Handles access tokens (15 min) and refresh tokens (30 days)
 * 
 * Security: Uses Keychain (iOS) / Keystore (Android) / LocalStorage fallback (Web)
 */

import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

const KEYCHAIN_SERVICE = 'com.dai.finance.tokens';
const WEB_ACCESS_TOKEN_KEY = 'dai_access_token';
const WEB_REFRESH_TOKEN_KEY = 'dai_refresh_token';
const WEB_EXPIRES_AT_KEY = 'dai_expires_at';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

interface TokenPayload {
  userId: string;
  email?: string;
  exp: number;
  iat: number;
}

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  /**
   * Initialize token manager - load tokens from secure storage
   */
  async initialize(): Promise<boolean> {
    try {
      // Web fallback: use localStorage (more compatible than AsyncStorage)
      if (Platform.OS === 'web') {
        const accessToken = localStorage.getItem(WEB_ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(WEB_REFRESH_TOKEN_KEY);
        const expiresAt = localStorage.getItem(WEB_EXPIRES_AT_KEY);

        if (accessToken && refreshToken && expiresAt) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.expiresAt = parseInt(expiresAt, 10);
          console.log('[TokenManager] Tokens loaded from localStorage');
          return this.hasValidToken();
        }
        return false;
      }

      // Native: use Keychain
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });

      if (credentials) {
        const tokens: TokenPair = JSON.parse(credentials.password);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.expiresAt = tokens.expiresAt;

        console.log('[TokenManager] Tokens loaded from Keychain');
        // Check if tokens are still valid
        return this.hasValidToken();
      }

      return false;
    } catch (error) {
      console.error('[TokenManager] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Store tokens securely in Keychain/Keystore or localStorage (web)
   */
  async storeTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  }): Promise<void> {
    try {
      const expiresIn = tokens.expiresIn || 900; // 15 minutes default
      
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresAt = Date.now() + expiresIn * 1000;

      // Web fallback: use localStorage
      if (Platform.OS === 'web') {
        localStorage.setItem(WEB_ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(WEB_REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem(WEB_EXPIRES_AT_KEY, this.expiresAt.toString());
        console.log('[TokenManager] Tokens stored in localStorage');
        return;
      }

      // Native: use Keychain
      const tokenPair: TokenPair = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: this.expiresAt,
      };

      await Keychain.setGenericPassword('tokens', JSON.stringify(tokenPair), {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        ...(Platform.OS === 'android' && {
          securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        }),
      });
      console.log('[TokenManager] Tokens stored in Keychain');
    } catch (error) {
      console.error('[TokenManager] Failed to store tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  /**
   * Get current access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      await this.initialize();
    }

    // Token expired or about to expire (within 1 minute)
    if (this.expiresAt && Date.now() >= this.expiresAt - 60000) {
      console.log('[TokenManager] Token expired or about to expire');
      // Token refresh should be handled by authClient.ts
      return null;
    }

    return this.accessToken;
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    if (!this.refreshToken) {
      await this.initialize();
    }
    return this.refreshToken;
  }

  /**
   * Check if we have a valid token
   */
  hasValidToken(): boolean {
    if (!this.accessToken || !this.expiresAt) {
      return false;
    }

    // Token still valid for at least 1 minute
    const isValid = Date.now() < this.expiresAt - 60000;
    console.log('[TokenManager] Token valid:', isValid, `(expires in ${Math.floor((this.expiresAt - Date.now()) / 1000)}s)`);
    return isValid;
  }

  /**
   * Decode JWT payload (no verification - backend validates)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode base64url
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as TokenPayload;
    } catch (error) {
      console.error('[TokenManager] Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get user ID from access token
   */
  getUserId(): string | null {
    if (!this.accessToken) return null;

    const payload = this.decodeToken(this.accessToken);
    return payload?.userId || null;
  }

  /**
   * Clear all tokens (logout)
   */
  async clearTokens(): Promise<void> {
    try {
      // Web fallback: clear localStorage
      if (Platform.OS === 'web') {
        localStorage.removeItem(WEB_ACCESS_TOKEN_KEY);
        localStorage.removeItem(WEB_REFRESH_TOKEN_KEY);
        localStorage.removeItem(WEB_EXPIRES_AT_KEY);
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        console.log('[TokenManager] Tokens cleared from localStorage');
        return;
      }

      // Native: clear Keychain
      await Keychain.resetGenericPassword({
        service: KEYCHAIN_SERVICE,
      });

      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      console.log('[TokenManager] Tokens cleared from Keychain');
    } catch (error) {
      console.error('[TokenManager] Failed to clear tokens:', error);
    }
  }

  /**
   * Check if token is about to expire (within 2 minutes)
   */
  shouldRefresh(): boolean {
    if (!this.expiresAt) return false;
    return Date.now() >= this.expiresAt - 120000; // 2 minutes buffer
  }
}

// Singleton instance
export const tokenManager = new TokenManager();
