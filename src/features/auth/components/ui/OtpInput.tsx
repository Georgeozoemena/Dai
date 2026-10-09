import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Platform
} from 'react-native';
import { colors, radii } from '../../../../theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Cross-platform helper to select text in a TextInput
 * - Native: Uses setSelection (React Native API)
 * - Web: Uses setSelectionRange or select (DOM API)
 */
function selectTextInInput(ref: TextInput | null, start: number, end: number) {
  if (!ref) return;

  try {
    // Try native setSelection first (iOS/Android)
    if (typeof (ref as any).setSelection === 'function') {
      (ref as any).setSelection(start, end);
      return;
    }

    // Web fallback: access the underlying DOM input element
    if (Platform.OS === 'web') {
      // React Native Web exposes the DOM node via a private property
      const inputElement = (ref as any)._inputRef || (ref as any)._node;
      
      if (inputElement) {
        // Try setSelectionRange (standard DOM API)
        if (typeof inputElement.setSelectionRange === 'function') {
          inputElement.setSelectionRange(start, end);
          return;
        }
        
        // Fallback to select() for full selection
        if (typeof inputElement.select === 'function') {
          inputElement.select();
          return;
        }
      }
    }
  } catch (error) {
    // Silently fail - text selection is a UX enhancement, not critical
    console.debug('[OtpInput] Text selection not supported:', error);
  }
}

/**
 * OTP/Verification code input component
 * 
 * Features:
 * - Auto-focus next box on digit entry
 * - Backspace navigation
 * - Auto-complete callback
 * - Shake animation on error
 * - Paste support
 */
export function OtpInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  disabled = false,
  autoFocus = true
}: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Split value into array of digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    // Auto-focus first input on mount
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [autoFocus]);

  useEffect(() => {
    // Shake on error
    if (error) {
      shakeInputs();
    }
  }, [error]);

  useEffect(() => {
    // Call onComplete when all digits filled
    if (digits.every(d => d !== '') && onComplete) {
      onComplete(digits.join(''));
    }
  }, [value]);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChangeText = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.replace(/\D/g, '').slice(-1);

    // Update value
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('');
    onChangeText(newValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    // Extract digits from pasted text
    const pastedDigits = text.replace(/\D/g, '').slice(0, length);
    onChangeText(pastedDigits);

    // Focus last filled box or next empty box
    const focusIndex = Math.min(pastedDigits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleFocus = (index: number) => {
    // Select text on focus for easy replacement (cross-platform)
    selectTextInInput(inputRefs.current[index], 0, 1);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputsContainer,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.inputBox,
              digit && styles.inputBoxFilled,
              error && styles.inputBoxError,
            ]}
          >
            <TextInput
              ref={ref => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={text => handleChangeText(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              style={styles.input}
              selectTextOnFocus
              // Handle paste on first input
              {...(index === 0 ? { onPaste: (e: any) => handlePaste(e.nativeEvent.text) } : {})}
            />
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : null}
          </View>
        ))}
      </Animated.View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/**
 * OTP input with resend functionality
 */
interface OtpInputWithResendProps extends OtpInputProps {
  expiresIn?: number; // seconds
  onResend?: () => void;
  resendLabel?: string;
}

export function OtpInputWithResend({
  expiresIn = 300,
  onResend,
  resendLabel = 'Resend code',
  ...otpProps
}: OtpInputWithResendProps) {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleResend = () => {
    if (canResend && onResend) {
      onResend();
      setTimeLeft(expiresIn);
      setCanResend(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View>
      <OtpInput {...otpProps} />

      <View style={styles.resendContainer}>
        {canResend ? (
          <Pressable onPress={handleResend}>
            <Text style={styles.resendButton}>{resendLabel}</Text>
          </Pressable>
        ) : (
          <Text style={styles.timerText}>
            Resend code in {formatTime(timeLeft)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  inputBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inputBoxFilled: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(251, 204, 51, 0.05)',
  },
  inputBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(208, 0, 0, 0.05)',
  },
  input: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  digit: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 12,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
