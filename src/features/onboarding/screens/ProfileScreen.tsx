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

      const now = new Date().toISOString();

      const profile: Profile = {
        id: crypto.randomUUID(),

        name: name.trim(),

        email: email.trim() || undefined,

        phone: phone.trim() || undefined,

        createdAt: now,
        updatedAt: now,
      };

      await createProfile(profile);

      console.log("PROFILE CREATED:", profile);

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
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      {/* Header */}

      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Create Your Profile
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
            lineHeight: 22,
          }}
        >
          Tell us a little about yourself
          so we can personalize your Dai
          experience.
        </Text>
      </View>

      {/* Name */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Name
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Email */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Phone */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Phone
        </Text>

        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
          }}
        />
      </View>

      {/* Submit */}

      <Pressable
        onPress={handleSubmit}
        disabled={saving}
        style={{
          backgroundColor: "#111",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
          opacity: saving ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {saving
            ? "Creating Profile..."
            : "Continue"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
