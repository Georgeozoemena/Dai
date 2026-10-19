import { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { Profile } from "../../../types/profile";

import { createProfile, getProfile, updateProfile } from "../services/profileService";
import { useAuthStore } from "../../../store/auth/authStore";
import { generateId } from "../../../utils/id";
import { colors } from "../../../theme";
import { PageBackButton } from "../../../components/PageBackButton";
import { PhoneInput } from "../../auth/components/ui/PhoneInput";

interface ProfileScreenProps {
  onComplete?: (profile: Profile) => void;
}

export function ProfileScreen({
  onComplete,
}: ProfileScreenProps) {
  const currentUser = useAuthStore((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
  });

  // Check if user authenticated via OAuth (Google)
  const isOAuthUser = currentUser?.email && currentUser?.emailVerified;

  // Load existing profile and pre-fill data
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        
        // Check if profile already exists
        const profile = await getProfile();
        setExistingProfile(profile);
        
        if (profile) {
          // Pre-fill with existing profile data
          setName(profile.name || "");
          setEmail(profile.email || "");
          setPhone(profile.phone || "");
        } else if (currentUser) {
          // Pre-fill with auth data for new profiles
          if (currentUser.name) {
            setName(currentUser.name);
          }
          if (currentUser.email) {
            setEmail(currentUser.email);
          }
          if (currentUser.phone) {
            setPhone(currentUser.phone);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
    };

    if (!name.trim()) {
      newErrors.name = "Please enter your name";
    }

    // Email validation only if not OAuth user
    if (!isOAuthUser && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);

    return !newErrors.name && !newErrors.email;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!currentUser || !currentUser.id) {
      console.error('[ProfileScreen] No user in auth store');
      
      const message = "Authentication error. Please log in again.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
      return;
    }

    try {
      setSaving(true);

      const userId = currentUser.id;
      const now = new Date().toISOString();

      let profile: Profile;

      if (existingProfile) {
        // Update existing profile
        profile = {
          ...existingProfile,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          avatar: currentUser?.avatar || existingProfile.avatar,
          updatedAt: now,
        };

        await updateProfile(profile);
        console.log("PROFILE UPDATED FOR USER:", userId, profile);
      } else {
        // Create new profile
        profile = {
          id: generateId(),
          userId,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          avatar: currentUser?.avatar,
          createdAt: now,
          updatedAt: now,
        };

        await createProfile(profile);
        console.log("PROFILE CREATED FOR USER:", userId, profile);
      }

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error) {
      console.error(
        "FAILED TO CREATE PROFILE:",
        error,
      );
      
      const message = "Failed to save profile. Please try again.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <PageBackButton onPress={() => router.back()} style={styles.backButton} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>
          {existingProfile ? "Update Your\nProfile" : "Complete Your\nProfile"}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                errors.name && styles.inputContainerError
              ]}>
                <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors({ ...errors, name: "" });
                    }
                  }}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  style={styles.input}
                  placeholderTextColor="#ccc"
                />
              </View>
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                errors.email && styles.inputContainerError,
                isOAuthUser && styles.inputContainerVerified
              ]}>
                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#ccc"
                  editable={!isOAuthUser}
                />
                {isOAuthUser && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : isOAuthUser ? (
                <Text style={styles.helperText}>Verified via Google</Text>
              ) : null}
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <PhoneInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number (optional)"
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={saving}
              style={[
                styles.submitButton,
                saving && styles.submitButtonDisabled,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {saving ? "Saving..." : "Continue"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
    marginBottom: 0,
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 40,
    lineHeight: 44,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  inputContainerError: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  inputContainerVerified: {
    backgroundColor: "#f8fdf9",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  helperText: {
    fontSize: 13,
    color: colors.success,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
