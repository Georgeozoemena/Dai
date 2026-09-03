import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Profile } from "../../../types/profile";

import { createProfile } from "../services/profileService";
import { requireCurrentUserId } from "../../auth/services/currentUserService";
import { screenStyles } from "../../../theme";

interface ProfileScreenProps {
  onComplete?: (profile: Profile) => void;
}

export function ProfileScreen({
  onComplete,
}: ProfileScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);

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
        userId, // Link to authenticated Google user

        name: name.trim(),

        email: email.trim() || undefined,

        phone: phone.trim() || undefined,

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
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Create Your Profile</Text>

        <Text style={screenStyles.subtitle}>
          Tell us a little about yourself
          so we can personalize your Dai
          experience.
        </Text>
      </View>

      {/* Name */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Name</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          style={screenStyles.input}
        />
      </View>

      {/* Email */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Email</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={screenStyles.input}
        />
      </View>

      {/* Phone */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Phone</Text>

        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
          style={screenStyles.input}
        />
      </View>

      {/* Submit */}

      <Pressable
        onPress={handleSubmit}
        disabled={saving}
        style={[
          screenStyles.primaryButton,
          { opacity: saving ? 0.5 : 1 },
        ]}
      >
        <Text style={screenStyles.primaryButtonText}>
          {saving
            ? "Creating Profile..."
            : "Continue"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
