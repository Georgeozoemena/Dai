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
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii } from '../../../theme';
import { PageBackButton } from '../../../components/PageBackButton';
import { useAuthStore } from '../../../store/auth/authStore';

interface UserBioData {
  fullName: string;
  dateOfBirth: string;
  occupation: string;
  profileImage?: string; // Base64 or URI
}

/**
 * User Bio Screen - "Tell us about you"
 * 
 * Collects additional user information after authentication
 * Part of the onboarding flow before PIN setup
 */
export function UserBioScreen() {
  const params = useLocalSearchParams<{
    userId: string;
    emailVerified?: string;
    isNewUser?: string;
  }>();

  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState<UserBioData>({
    fullName: user?.name || '',
    dateOfBirth: '',
    occupation: '',
    profileImage: user?.avatar || undefined,
  });

  const [errors, setErrors] = useState<Partial<UserBioData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const userId = params.userId || user?.id || '';
  const emailVerified = params.emailVerified === 'true';
  const isNewUser = params.isNewUser === 'true';

  const handleInputChange = (field: keyof UserBioData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserBioData> = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    // Date of birth validation (optional but validate format if provided)
    if (formData.dateOfBirth && !isValidDate(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Invalid date format (DD/MM/YYYY)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidDate = (dateString: string): boolean => {
    // Simple DD/MM/YYYY validation
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    return true;
  };

  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.'
        );
        return;
      }

      setUploadingImage(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData((prev) => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('[UserBio] Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a profile picture.'
        );
        return;
      }

      setUploadingImage(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData((prev) => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('[UserBio] Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handlePickImage,
        },
        ...(formData.profileImage
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: () => {
                  setFormData((prev) => ({
                    ...prev,
                    profileImage: undefined,
                  }));
                },
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Send bio data to backend
      // const response = await fetch('/api/user/profile', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId,
      //     ...formData,
      //   }),
      // });

      console.log('[UserBio] Bio data collected:', formData);

      // Check if we're in onboarding flow or settings
      if (isNewUser) {
        // Onboarding flow - navigate to PIN setup
        router.replace({
          pathname: '/pin-setup',
          params: {
            isNewUser: 'true',
            emailVerified: emailVerified ? 'true' : undefined,
            userId,
          },
        });
      } else {
        // Settings flow - go back or to dashboard
        Alert.alert(
          'Profile Updated',
          'Your profile information has been saved.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[UserBio] Failed to save bio:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (!isNewUser) {
      // In settings, just go back
      router.back();
      return;
    }

    // In onboarding flow, confirm skip
    Alert.alert(
      'Skip for now?',
      'You can always add this information later in your profile settings.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            router.replace({
              pathname: '/pin-setup',
              params: {
                isNewUser: 'true',
                emailVerified: emailVerified ? 'true' : undefined,
                userId,
              },
            });
          },
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
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button - Only show when not in onboarding */}
        {!isNewUser && (
          <View style={styles.backButtonContainer}>
            <PageBackButton onPress={() => router.back()} style={styles.backButton} />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          {/* Profile Image Picker */}
          <Pressable onPress={handleImageOptions} style={styles.imagePickerContainer}>
            {formData.profileImage ? (
              <Image source={{ uri: formData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={48} color={colors.textSecondary} />
              </View>
            )}
            
            {/* Camera Badge */}
            <View style={styles.cameraBadge}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.primary} />
              )}
            </View>
          </Pressable>

          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience and provide better financial insights
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                value={formData.fullName}
                onChangeText={(text) => handleInputChange('fullName', text)}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={[styles.inputContainer, errors.dateOfBirth && styles.inputError]}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <TextInput
                value={formData.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="numeric"
                maxLength={10}
                editable={!isLoading}
              />
            </View>
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
            <Text style={styles.helperText}>Optional - Helps us provide age-appropriate advice</Text>
          </View>

          {/* Occupation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Occupation</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
              <TextInput
                value={formData.occupation}
                onChangeText={(text) => handleInputChange('occupation', text)}
                placeholder="e.g., Software Engineer, Teacher"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            <Text style={styles.helperText}>Optional - Helps us understand your financial needs</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="lock-closed" size={18} color={colors.secondary} />
            <Text style={styles.infoText}>
              Your information is private and secure. We use it only to personalize your experience.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleContinue}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.continueButton,
              isLoading && styles.buttonDisabled,
              pressed && !isLoading && styles.buttonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Saving...' : isNewUser ? 'Continue' : 'Save Changes'}
            </Text>
            {!isLoading && isNewUser && (
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            )}
          </Pressable>

          {isNewUser && (
            <Pressable onPress={handleSkip} disabled={isLoading} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  imagePickerContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: -4,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${colors.secondary}10`,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: radii.md,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
