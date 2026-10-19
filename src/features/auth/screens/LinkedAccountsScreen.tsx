import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIdentityManager } from '../hooks/useIdentityManager';
import { useAuthStore } from '../../../store/auth/authStore';
import { getProviderLabel } from '../components/ui/ProviderButton';
import { colors, radii, screenStyles } from '../../../theme';
import { PageBackButton } from '../../../components/PageBackButton';
import type { AuthProvider } from '../lib/providers/types';

/**
 * Linked Accounts Management Screen
 * 
 * Allows users to:
 * - View all linked authentication providers
 * - Link new providers to their account
 * - Unlink providers (with safety checks)
 * - See linking history
 */
export function LinkedAccountsScreen() {
  const user = useAuthStore(state => state.user);
  const {
    linkedProviders,
    loadLinkedProviders,
    linkProvider,
    unlinkProvider,
    canUnlink,
    isLoading,
    error
  } = useIdentityManager();

  const [unlinkingProvider, setUnlinkingProvider] = useState<AuthProvider | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadLinkedProviders(user.id);
    }
  }, [user?.id]);

  const handleUnlink = async (provider: AuthProvider) => {
    if (!user?.id) return;

    // Check if unlinking is allowed
    const canUnlinkResult = await canUnlink(user.id, provider);

    if (!canUnlinkResult) {
      Alert.alert(
        'Cannot Unlink',
        'You need at least one login method. Add another provider before unlinking this one.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm unlinking
    Alert.alert(
      'Unlink Account',
      `Are you sure you want to unlink ${getProviderLabel(provider)}? You won't be able to sign in with this method anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            setUnlinkingProvider(provider);
            const result = await unlinkProvider(user.id, provider);
            setUnlinkingProvider(null);

            if (result.success) {
              Alert.alert('Success', `${getProviderLabel(provider)} has been unlinked from your account.`);
            }
          }
        }
      ]
    );
  };

  const handleLinkProvider = (provider: AuthProvider) => {
    // TODO: Navigate to specific provider auth flow with linking context
    Alert.alert(
      'Link Account',
      `To link ${getProviderLabel(provider)}, you'll need to sign in with that method. This will require additional verification for security.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to appropriate auth screen
            switch (provider) {
              case 'email':
                router.push('/auth/email' as any);
                break;
              case 'phone':
                router.push('/auth/phone' as any);
                break;
              case 'google':
                // Handle Google OAuth linking
                Alert.alert('Coming Soon', 'Google linking will be available soon!');
                break;
              case 'apple':
                Alert.alert('Not Available', 'Apple Sign-In requires Apple Developer account.');
                break;
            }
          }
        }
      ]
    );
  };

  const availableToLink: AuthProvider[] = ['google', 'apple', 'email', 'phone'].filter(
    p => !linkedProviders.includes(p as AuthProvider)
  );

  return (
    <View style={screenStyles.root}>
      <ScrollView contentContainerStyle={screenStyles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <PageBackButton onPress={() => router.back()} style={styles.backButton} />
          <Text style={screenStyles.title}>Linked Accounts</Text>
        </View>

        <Text style={styles.description}>
          Manage how you sign in to your account. You can link multiple providers for convenience.
        </Text>

        {/* Loading State */}
        {isLoading && !linkedProviders.length && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading linked accounts...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Linked Providers */}
        {linkedProviders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Sign-In Methods</Text>
            <Text style={styles.sectionSubtitle}>
              You can use any of these to access your account
            </Text>

            <View style={styles.providerList}>
              {linkedProviders.map(provider => (
                <View key={provider} style={styles.providerCard}>
                  <View style={styles.providerInfo}>
                    <View style={[styles.providerIconContainer, getProviderColor(provider)]}>
                      <Ionicons
                        name={getProviderIcon(provider)}
                        size={24}
                        color={colors.surface}
                      />
                    </View>

                    <View style={styles.providerDetails}>
                      <Text style={styles.providerName}>{getProviderLabel(provider)}</Text>
                      <Text style={styles.providerStatus}>
                        {provider === 'email' && user?.email && `${user.email}`}
                        {provider === 'phone' && user?.phone && `${user.phone}`}
                        {(provider === 'google' || provider === 'apple') && 'Connected'}
                      </Text>
                    </View>
                  </View>

                  {/* Unlink Button */}
                  {linkedProviders.length > 1 && (
                    <Pressable
                      onPress={() => handleUnlink(provider)}
                      disabled={unlinkingProvider === provider}
                      style={styles.unlinkButton}
                    >
                      {unlinkingProvider === provider ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Text style={styles.unlinkButtonText}>Unlink</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            {/* Last Provider Warning */}
            {linkedProviders.length === 1 && (
              <View style={styles.warningBox}>
                <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
                <Text style={styles.warningText}>
                  This is your only sign-in method. Add another before unlinking.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Available to Link */}
        {availableToLink.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Sign-In Method</Text>
            <Text style={styles.sectionSubtitle}>
              Link another provider for easier access
            </Text>

            <View style={styles.providerList}>
              {availableToLink.map(provider => (
                <Pressable
                  key={provider}
                  onPress={() => handleLinkProvider(provider)}
                  style={({ pressed }) => [
                    styles.linkCard,
                    pressed && styles.linkCardPressed
                  ]}
                >
                  <View style={styles.providerInfo}>
                    <View style={[styles.providerIconContainer, styles.providerIconUnlinked]}>
                      <Ionicons
                        name={getProviderIcon(provider)}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>

                    <View style={styles.providerDetails}>
                      <Text style={styles.providerName}>{getProviderLabel(provider)}</Text>
                      <Text style={styles.providerStatusUnlinked}>Not connected</Text>
                    </View>
                  </View>

                  <Ionicons name="add-circle" size={24} color={colors.secondary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Security Note</Text>
            <Text style={styles.infoText}>
              Linking a new provider requires additional verification to protect your account. You'll need to verify your identity with PIN or OTP.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper functions
function getProviderIcon(provider: AuthProvider): keyof typeof Ionicons.glyphMap {
  switch (provider) {
    case 'google':
      return 'logo-google';
    case 'apple':
      return 'logo-apple';
    case 'email':
      return 'mail';
    case 'phone':
      return 'call';
    default:
      return 'person';
  }
}

function getProviderColor(provider: AuthProvider) {
  switch (provider) {
    case 'google':
      return { backgroundColor: '#DB4437' };
    case 'apple':
      return { backgroundColor: '#000000' };
    case 'email':
      return { backgroundColor: '#0066CC' };
    case 'phone':
      return { backgroundColor: '#34C759' };
    default:
      return { backgroundColor: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(208, 0, 0, 0.08)',
    borderRadius: radii.md,
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },
  providerList: {
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderStyle: 'dashed',
  },
  linkCardPressed: {
    opacity: 0.7,
    backgroundColor: colors.background,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIconUnlinked: {
    backgroundColor: colors.background,
  },
  providerDetails: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  providerStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  providerStatusUnlinked: {
    fontSize: 13,
    color: colors.textMuted,
  },
  unlinkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(208, 0, 0, 0.08)',
    minWidth: 70,
    alignItems: 'center',
  },
  unlinkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 204, 51, 0.1)',
    borderRadius: radii.md,
    padding: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
