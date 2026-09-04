import { useState, useEffect } from "react";
import {
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

import { createProfile } from "../services/profileService";
import { requireCurrentUserId } from "../../auth/services/currentUserService";
import { useAuthStore } from "../../../store/auth/authStore";

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

  // Pre-fill with Google account data
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) {
        setName(currentUser.name);
      }
      if (currentUser.email) {
        setEmail(currentUser.email);
      }
    }
  }, [currentUser]);

  const validateForm = () => {
    if (!name.trim()) {
      return "Please enter your name.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();

    if (error) {
      console.log("PROFILE VALIDATION ERROR:", error);
      return;
    }

    try {
      setSaving(true);

      const userId = await requireCurrentUserId();
      const now = new Date().toISOString();

      const profile: Profile = {
        id: crypto.randomUUID(),
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

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error) {
      console.error(
        "FAILED TO CREATE PROFILE:",
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable 
        onPress={() => router.back()} 
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Complete Your{"\n"}Profile</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                style={styles.input}
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#ccc"
                editable={false}
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#ccc"
              />
            </View>
          </View>
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
            {saving ? "Creating..." : "Continue"}
          </Text>
        </Pressable>
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
    paddingTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 40,
    lineHeight: 44,
  },
  form: {
    gap: 16,
    marginBottom: 40,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
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
  submitButton: {
    backgroundColor: "#120E01",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FBCC33",
    letterSpacing: 0.3,
  },
});
