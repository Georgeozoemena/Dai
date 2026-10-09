import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhoneAuth, formatPhoneNumber } from '../hooks/usePhoneAuth';
import { useIdentityManager } from '../hooks/useIdentityManager';
import { PhoneInput } from '../components/ui/PhoneInput';
import { OtpInputWithResend } from '../components/ui/OtpInput';
import { colors, radii } from '../../../theme';

type Step = 'phone' | 'otp';

export function PhoneAuthScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { requestOtp, verifyOtp, isLoading, error: authError, expiresIn } = usePhoneAuth();
  const { checkForConflict } = useIdentityManager();

  const handleSendOtp = async () => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return;
    }

    // Check for account conflict before sending OTP
    const conflict = await checkForConflict('phone', undefined, phone);

    if (conflict) {
      // Account exists with this phone
      Alert.alert(
        'Account Exists',
        `An account already exists with ${formatPhoneNumber(phone)}. Would you like to link your accounts or continue?`,
        [
          {
            text: 'Continue',
            onPress: () => proceedWithOtp()
          },
          {
            text: 'Link Account',
            onPress: () => handleAccountLinking(conflict)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // No conflict - proceed with OTP
    await proceedWithOtp();
  };

  const proceedWithOtp = async () => {
    const success = await requestOtp(phone);
    if (success) {
      setStep('otp');
      setPhoneError('');
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      await verifyOtp(phone, code);
      // Success - user will be redirected by the hook
    } catch (err) {
      // Error is handled by hook
      setOtp(''); // Clear OTP on error
    }
  };

  const handleAccountLinking = (conflict: any) => {
    Alert.alert(
      'Account Linking',
      `You can link this phone to your existing account (${conflict.existingProviders.join(', ')}). This feature will be available in Settings after logging in.`,
      [{ text: 'OK' }]
    );
  };

  const handleResendOtp = async () => {
    setOtp('');
    await requestOtp(phone);
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else {
      router.back();
    }
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
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Phone number</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to receive a verification code
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verify your number</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.phoneHighlight}>{formatPhoneNumber(phone)}</Text>
              </Text>
            </>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'phone' ? (
            // Phone Entry Step
            <>
              <PhoneInput
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  setPhoneError('');
                }}
                error={phoneError}
                disabled={isLoading}
                placeholder="Phone number"
              />

              {/* Error Message */}
              {authError && (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.alertText}>{authError}</Text>
                </View>
              )}

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
                <Text style={styles.infoText}>
                  We'll send you a text message with a 6-digit verification code. Standard message rates may apply.
                </Text>
              </View>

              {/* Send Button */}
              <Pressable
                onPress={handleSendOtp}
                disabled={isLoading || !phone}
                style={({ pressed }) => [
                  styles.button,
                  (isLoading || !phone) && styles.buttonDisabled,
                  pressed && !isLoading && phone && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Code'}
                </Text>
              </Pressable>
            </>
          ) : (
            // OTP Verification Step
            <>
              <OtpInputWithResend
                length={6}
                value={otp}
                onChangeText={setOtp}
                onComplete={handleVerifyOtp}
                error={authError || undefined}
                disabled={isLoading}
                autoFocus
                expiresIn={expiresIn || 300}
                onResend={handleResendOtp}
                resendLabel="Resend code"
              />

              {/* Change Number */}
              <Pressable
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                }}
                style={styles.changeNumberButton}
              >
                <Text style={styles.changeNumberText}>Change phone number</Text>
              </Pressable>

              {/* Auto-verify Info */}
              <View style={styles.infoBox}>
                <Ionicons name="sparkles-outline" size={18} color={colors.secondary} />
                <Text style={styles.infoTextSmall}>
                  The code will be verified automatically when you enter all 6 digits
                </Text>
              </View>
            </>
          )}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  phoneHighlight: {
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(208, 0, 0, 0.08)',
    borderRadius: radii.md,
    padding: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 204, 51, 0.1)',
    borderRadius: radii.md,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoTextSmall: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  changeNumberButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  changeNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
});
