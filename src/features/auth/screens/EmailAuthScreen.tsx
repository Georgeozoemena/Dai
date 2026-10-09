import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmailAuth } from '../hooks/useEmailAuth';
import { useIdentityManager } from '../hooks/useIdentityManager';
import { PasswordStrengthMeter, isPasswordValid } from '../components/ui/PasswordStrengthMeter';
import { colors, radii } from '../../../theme';

type Mode = 'login' | 'signup';

export function EmailAuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, signup, isLoading, error: authError } = useEmailAuth();
  const { checkForConflict } = useIdentityManager();

  const isLogin = mode === 'login';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (!isLogin && !isPasswordValid(password)) {
      setPasswordError('Password does not meet requirements');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    // Validate inputs
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (!emailValid || !passwordValid) {
      return;
    }

    try {
      if (isLogin) {
        // Login
        await login(email, password);
      } else {
        // Check for account conflict before signup
        const conflict = await checkForConflict('email', email);

        if (conflict) {
          // Account exists with this email
          Alert.alert(
            'Account Exists',
            `An account already exists with ${email}. Would you like to link your accounts or log in instead?`,
            [
              {
                text: 'Log In',
                onPress: () => setMode('login')
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

        // No conflict - proceed with signup
        await signup(email, password, name || undefined);
      }
    } catch (err) {
      // Error is already handled in hook
      console.error('[EmailAuth] Submit error:', err);
    }
  };

  const handleAccountLinking = (conflict: any) => {
    // TODO: Navigate to account linking flow
    Alert.alert(
      'Account Linking',
      `You can link this email to your existing account (${conflict.existingProviders.join(', ')}). This feature will be available in Settings after logging in.`,
      [{ text: 'OK' }]
    );
  };

  const toggleMode = () => {
    setMode(isLogin ? 'signup' : 'login');
    setEmailError('');
    setPasswordError('');
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Log in to continue managing your finances'
              : 'Sign up to start tracking your money'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name (Signup only) */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name (optional)</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                textContentType="name"
                style={styles.input}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={text => {
                setEmail(text);
                setEmailError('');
              }}
              onBlur={() => validateEmail(email)}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              style={[styles.input, emailError && styles.inputError]}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setPasswordError('');
                }}
                onBlur={() => validatePassword(password)}
                placeholder={isLogin ? 'Enter password' : 'Create password'}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={isLogin ? 'password' : 'newPassword'}
                style={[styles.input, styles.passwordInput, passwordError && styles.inputError]}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Password Strength (Signup only) */}
            {!isLogin && password.length > 0 && (
              <View style={styles.strengthMeter}>
                <PasswordStrengthMeter password={password} />
              </View>
            )}
          </View>

          {/* Error Message */}
          {authError && (
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.alertText}>{authError}</Text>
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
              pressed && !isLoading && styles.submitButtonPressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Log In' : 'Sign Up'}
              </Text>
            )}
          </Pressable>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Pressable onPress={toggleMode} disabled={isLoading}>
              <Text style={styles.toggleButton}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Text>
            </Pressable>
          </View>

          {/* Forgot Password (Login only) */}
          {isLogin && (
            <Pressable
              onPress={() => {
                // TODO: Navigate to forgot password
                Alert.alert('Forgot Password', 'Password reset will be available soon!');
              }}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
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
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 4,
  },
  strengthMeter: {
    marginTop: 12,
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
  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  toggleText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  toggleButton: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
});
