import React from 'react';
import { Pressable, Text, StyleSheet, Image, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../../../theme';
import type { AuthProvider } from '../../lib/providers/types';

interface ProviderButtonProps {
  provider: AuthProvider;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const GOOGLE_MARK = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

/**
 * Authentication provider button
 * 
 * Styled buttons for Google, Apple, Email, and Phone auth
 */
export function ProviderButton({
  provider,
  onPress,
  disabled = false,
  loading = false
}: ProviderButtonProps) {
  const config = getProviderConfig(provider);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        config.style,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={config.label}
    >
      {loading ? (
        <ActivityIndicator color={config.textColor} size="small" />
      ) : (
        <>
          {config.icon}
          <Text style={[styles.buttonText, { color: config.textColor }]}>
            {config.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// Provider configurations
function getProviderConfig(provider: AuthProvider) {
  switch (provider) {
    case 'google':
      return {
        label: 'Continue with Google',
        icon: <Image source={{ uri: GOOGLE_MARK }} style={styles.icon} />,
        style: styles.googleButton,
        textColor: colors.primary
      };

    case 'apple':
      return {
        label: 'Continue with Apple',
        icon: <Ionicons name="logo-apple" size={22} color="#000" />,
        style: styles.appleButton,
        textColor: '#000000'
      };

    case 'email':
      return {
        label: 'Continue with Email',
        icon: <Ionicons name="mail-outline" size={20} color={colors.text} />,
        style: styles.emailButton,
        textColor: colors.text
      };

    case 'phone':
      return {
        label: 'Continue with Phone',
        icon: <Ionicons name="call-outline" size={20} color={colors.text} />,
        style: styles.phoneButton,
        textColor: colors.text
      };

    default:
      return {
        label: 'Continue',
        icon: null,
        style: styles.defaultButton,
        textColor: colors.text
      };
  }
}

/**
 * Small provider icon (for linked accounts display)
 */
export function ProviderIcon({ provider, size = 32 }: { provider: AuthProvider; size?: number }) {
  const iconSize = size * 0.6;

  let icon;
  let backgroundColor;

  switch (provider) {
    case 'google':
      icon = <Image source={{ uri: GOOGLE_MARK }} style={{ width: iconSize, height: iconSize }} />;
      backgroundColor = '#FFFFFF';
      break;

    case 'apple':
      icon = <Ionicons name="logo-apple" size={iconSize} color="#000000" />;
      backgroundColor = '#FFFFFF';
      break;

    case 'email':
      icon = <Ionicons name="mail" size={iconSize} color={colors.secondary} />;
      backgroundColor = colors.primary;
      break;

    case 'phone':
      icon = <Ionicons name="call" size={iconSize} color={colors.secondary} />;
      backgroundColor = colors.primary;
      break;

    default:
      icon = <Ionicons name="person" size={iconSize} color={colors.text} />;
      backgroundColor = colors.background;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {icon}
    </View>
  );
}

/**
 * Provider name label
 */
export function getProviderLabel(provider: AuthProvider): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    default:
      return provider;
  }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 30,
  },
  googleButton: {
    backgroundColor: colors.secondary,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  emailButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
  },
  phoneButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
  },
  defaultButton: {
    backgroundColor: colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    width: 22,
    height: 22,
  },
});
