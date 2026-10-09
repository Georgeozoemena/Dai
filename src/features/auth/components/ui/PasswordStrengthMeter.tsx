import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../../../theme';

type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

/**
 * Password strength meter with visual indicator
 * 
 * Checks for:
 * - Minimum 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character (optional for strong)
 */
export function PasswordStrengthMeter({
  password,
  showRequirements = true
}: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password);
  const requirements = getPasswordRequirements(password);

  if (!password) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBar}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              getBarStyle(strength),
              { width: `${getStrengthPercentage(strength)}%` }
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, getTextColor(strength)]}>
          {getStrengthLabel(strength)}
        </Text>
      </View>

      {/* Requirements List */}
      {showRequirements && (
        <View style={styles.requirements}>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={req.met ? colors.success : colors.textMuted}
              />
              <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
                {req.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Calculate password strength
function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak';

  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Determine strength
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  if (score <= 5) return 'strong';
  return 'very-strong';
}

// Get password requirements with met status
function getPasswordRequirements(password: string) {
  return [
    {
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      label: 'One lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      label: 'One number',
      met: /[0-9]/.test(password)
    },
    {
      label: 'One special character (optional)',
      met: /[^a-zA-Z0-9]/.test(password)
    }
  ];
}

// Get strength percentage for bar
function getStrengthPercentage(strength: PasswordStrength): number {
  switch (strength) {
    case 'weak':
      return 25;
    case 'medium':
      return 50;
    case 'strong':
      return 75;
    case 'very-strong':
      return 100;
  }
}

// Get strength label
function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    case 'very-strong':
      return 'Very Strong';
  }
}

// Get bar style
function getBarStyle(strength: PasswordStrength) {
  switch (strength) {
    case 'weak':
      return { backgroundColor: colors.error };
    case 'medium':
      return { backgroundColor: colors.warning };
    case 'strong':
      return { backgroundColor: colors.success };
    case 'very-strong':
      return { backgroundColor: colors.secondary };
  }
}

// Get text color
function getTextColor(strength: PasswordStrength) {
  switch (strength) {
    case 'weak':
      return { color: colors.error };
    case 'medium':
      return { color: colors.warning };
    case 'strong':
      return { color: colors.success };
    case 'very-strong':
      return { color: colors.secondary };
  }
}

/**
 * Check if password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  strengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.full,
    transition: 'width 0.3s ease',
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 70,
  },
  requirements: {
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  requirementMet: {
    color: colors.success,
  },
});
