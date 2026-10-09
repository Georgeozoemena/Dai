import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAppleAuth } from '../hooks/useAppleAuth';
import { ProviderButton } from '../components/ui/ProviderButton';
import { colors } from '../../../theme';

/**
 * Authentication Method Selection Screen
 * 
 * Entry point for authentication - choose your preferred method:
 * - Google OAuth
 * - Apple Sign-In (disabled until Apple Developer account)
 * - Email/Password
 * - Phone/OTP
 */
export function AuthMethodScreen() {
  const { isReady: googleReady, promptAsync: googlePrompt, isAuthenticating: googleLoading } = useGoogleAuth();
  const { isAvailable: appleAvailable, unavailableReason } = useAppleAuth();

  const handleGoogleAuth = () => {
    googlePrompt();
  };

  const handleAppleAuth = () => {
    Alert.alert(
      'Coming Soon',
      unavailableReason || 'Apple Sign-In will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailAuth = () => {
    router.push('/auth/email' as any);
  };

  const handlePhoneAuth = () => {
    router.push('/auth/phone' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        testID="auth-method-screen"
      >
        {/* Branding Section */}
        <View style={styles.brandingSection}>
          {/* Logo */}
          <Image
            source={require('../../../../assets/MOVA-logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="MOVA Logo"
          />

          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText} accessibilityRole="header">
              Track your{'\n'}
              <Text style={styles.taglineHighlight}>finances</Text> in seconds
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Authentication Methods */}
        <View style={styles.authSection}>
          <View style={styles.buttonGroup}>
            <ProviderButton
              provider="google"
              onPress={handleGoogleAuth}
              disabled={!googleReady}
              loading={googleLoading}
              accessibilityLabel="Sign in with Google"
            />

            <ProviderButton
              provider="apple"
              onPress={handleAppleAuth}
              disabled={!appleAvailable}
              accessibilityLabel="Sign in with Apple (Coming Soon)"
            />

            <View style={styles.divider} accessibilityRole="text">
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <ProviderButton
              provider="email"
              onPress={handleEmailAuth}
              accessibilityLabel="Sign in with Email"
            />

            <ProviderButton
              provider="phone"
              onPress={handlePhoneAuth}
              accessibilityLabel="Sign in with Phone Number"
            />
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandingSection: {
    paddingHorizontal: 24,
    gap: 32,
  },
  logo: {
    width: 180,
    height: 160,
    marginBottom: 36,
  },
  taglineContainer: {
    width: '100%',
  },
  taglineText: {
    fontSize: Platform.select({ ios: 42, android: 38, default: 42 }),
    fontFamily: 'sora',
    fontWeight: '600',
    color: colors.secondary,
    lineHeight: Platform.select({ ios: 58, android: 52, default: 58 }),
  },
  taglineHighlight: {
    borderRadius: 100,
    fontStyle: 'italic',
    paddingVertical: 4,
    paddingHorizontal: 26,
    backgroundColor: colors.secondary,
    color: colors.primary,
  },
  authSection: {
    paddingHorizontal: 24,
    gap: 20,
  },
  buttonGroup: {
    gap: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.08)',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(17, 17, 17, 0.6)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(17, 17, 17, 0.37)',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
