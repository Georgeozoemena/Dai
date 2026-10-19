import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OtpInputWithResend } from '../components/ui/OtpInput';
import { colors, radii } from '../../../theme';
import { PageBackButton } from '../../../components/PageBackButton';
import Constants from 'expo-constants';

const LOCAL_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  process.env.EXPO_PUBLIC_BACKEND_URL_LOCAL ||
  'http://localhost:5000';

const PRODUCTION_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  process.env.EXPO_PUBLIC_BACKEND_URL_PRODUCTION ||
  'https://dai-backend.onrender.com';

const API_URLS = [LOCAL_API_URL, PRODUCTION_API_URL];

/**
 * Try multiple backend URLs with fallback
 */
async function fetchWithFallback(
  endpoint: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_URLS) {
    const url = `${baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  throw lastError || new Error('Cannot reach backend');
}

/**
 * Email Verification Screen
 * 
 * After email signup, user receives a 6-digit code via email
 * They enter it here to verify their email address
 */
export function EmailVerificationScreen() {
  const params = useLocalSearchParams<{
    email: string;
    userId: string;
  }>();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const email = params.email || '';
  const userId = params.userId || '';

  useEffect(() => {
    // Allow resend after 60 seconds
    const timer = setTimeout(() => setCanResend(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  const handleVerifyCode = async (verificationCode: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[EmailVerification] Verifying code for:', email);

      const response = await fetchWithFallback('/api/v2/auth/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();
      console.log('[EmailVerification] Response:', response.status, data);

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'invalid_code') {
          setError('Invalid verification code');
        } else if (data.code === 'expired_code') {
          setError('Code expired. Please request a new one.');
        } else {
          setError(data.message || 'Verification failed');
        }
        setCode(''); // Clear code on error
        return;
      }

      // Success - navigate to bio screen
      console.log('[EmailVerification] ✅ Email verified successfully');
      
      // Show success state briefly
      setIsVerified(true);
      
      // Navigate to bio screen after brief delay
      setTimeout(() => {
        router.replace({
          pathname: '/auth/bio',
          params: {
            isNewUser: 'true',
            emailVerified: 'true',
            userId,
          },
        });
      }, 800);
    } catch (err) {
      console.error('[EmailVerification] Verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCode('');

      console.log('[EmailVerification] Resending verification code...');

      const response = await fetchWithFallback('/api/v2/auth/email/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      console.log('[EmailVerification] ✅ Code resent successfully');
      setCanResend(false);
      
      // Allow resend again after 60 seconds
      setTimeout(() => setCanResend(true), 60000);
    } catch (err) {
      console.error('[EmailVerification] Resend failed:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel Verification?',
      'You need to verify your email to continue. Are you sure you want to go back?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <PageBackButton onPress={handleBack} style={styles.backButton} />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={48} color={colors.secondary} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.content}>
          {/* Success Message */}
          {isVerified && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.successText}>Email verified successfully!</Text>
            </View>
          )}

          <OtpInputWithResend
            length={6}
            value={code}
            onChangeText={setCode}
            onComplete={handleVerifyCode}
            error={error || undefined}
            disabled={isLoading}
            autoFocus
            expiresIn={600} // 10 minutes
            onResend={canResend ? handleResendCode : undefined}
            resendLabel={canResend ? 'Resend code' : 'Please wait...'}
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.secondary} /><Text style={styles.infoText}>Check your spam folder if you don't see the email. The code expires in 10 minutes.</Text>
          </View>

          {/* Change Email */}
          <Pressable
            onPress={() => {
              Alert.alert(
                'Change Email?',
                'You\'ll need to sign up again with a different email address.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Up Again',
                    onPress: () => router.replace('/auth/email'),
                  },
                ]
              );
            }}
            style={styles.changeEmailButton}
          >
            <Text style={styles.changeEmailText}>Wrong email? Change it</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  emailHighlight: {
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 204, 51, 0.1)',
    borderRadius: radii.md,
    padding: 14,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${colors.success}15`,
    borderRadius: radii.md,
    padding: 14,
  },
  successText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  changeEmailButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  changeEmailText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
});
