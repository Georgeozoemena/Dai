import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenManager } from "../../features/auth/lib/tokens/tokenManager";
import { DeviceManager } from "../../features/auth/lib/device/deviceManager";

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null; // Kept for backward compatibility, but tokens now in Keychain

  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: async (user, token) => {
        try {
          // Store tokens in Keychain (secure)
          await tokenManager.storeTokens({
            accessToken: token,
            refreshToken: token // Assume same for now, backend should provide both
          });

          // Register device fingerprint (non-fatal)
          try {
            await DeviceManager.registerDevice();
          } catch (deviceError) {
            console.warn('[AuthStore] Device registration failed (non-fatal):', deviceError);
          }

          // Update store (token kept for backward compatibility)
          set({
            user,
            token,
          });

          console.log('[AuthStore] Authentication set successfully');
        } catch (error) {
          console.error('[AuthStore] Failed to set auth:', error);
          throw error;
        }
      },

      clearAuth: async () => {
        try {
          // Clear tokens from Keychain
          await tokenManager.clearTokens();

          // Unregister device
          try {
            await DeviceManager.unregisterDevice();
          } catch (deviceError) {
            console.warn('[AuthStore] Device unregistration failed (non-fatal):', deviceError);
          }

          // Clear store
          set({
            user: null,
            token: null,
          });

          console.log('[AuthStore] Authentication cleared successfully');
        } catch (error) {
          console.error('[AuthStore] Failed to clear auth:', error);
          // Still clear store even if Keychain operations fail
          set({
            user: null,
            token: null,
          });
        }
      },

      restoreAuth: async () => {
        // This is called by bootstrap to ensure store is hydrated
        // Zustand persist middleware handles the actual restoration
        console.log('[AuthStore] Auth restored from storage');
      },
    }),
    {
      name: 'dai-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
