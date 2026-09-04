import { useState } from "react";
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

import type { Account } from "../../../types/account";
import { createAccount } from "../../accounts/services/accountService";
import { CURRENCIES } from "../../../constants/currencies";

interface CreateAccountScreenProps {
  profileId: string;
  onComplete?: (account: Account) => void;
}

export function CreateAccountScreen({
  profileId,
  onComplete,
}: CreateAccountScreenProps) {
  const [name, setName] = useState("Main");
  const [currencyCode, setCurrencyCode] = useState("NGN");
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      return "Please enter an account name.";
    }

    if (!currencyCode) {
      return "Please select a currency.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();

    if (error) {
      console.log(
        "ACCOUNT VALIDATION ERROR:",
        error,
      );
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const account: Account = {
        id: crypto.randomUUID(),

        profileId,

        name: name.trim(),

        currencyCode,

        createdAt: now,

        updatedAt: now,
      };

      await createAccount(account);

      console.log(
        "ACCOUNT CREATED:",
        account,
      );

      if (onComplete) {
        onComplete(account);
      }
    } catch (error) {
      console.error(
        "FAILED TO CREATE ACCOUNT:",
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
        <Text style={styles.title}>Create Your{"\n"}First Account</Text>

        {/* Account Name */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons name="wallet" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Personal, Savings"
              style={styles.input}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Currency</Text>
          <View style={styles.currencyList}>
            {CURRENCIES.map((currency) => {
              const selected = currencyCode === currency.code;

              return (
                <Pressable
                  key={currency.code}
                  onPress={() => setCurrencyCode(currency.code)}
                  style={[
                    styles.currencyCard,
                    selected && styles.currencyCardSelected,
                  ]}
                >
                  <View style={styles.currencyLeft}>
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={24} color="#1a1a1a" />
                  )}
                </Pressable>
              );
            })}
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
            {saving ? "Creating..." : "Create Account"}
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
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
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
  section: {
    gap: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    paddingHorizontal: 4,
  },
  currencyList: {
    gap: 12,
  },
  currencyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  currencyCardSelected: {
    borderColor: "#1a1a1a",
    backgroundColor: "#f9f9f9",
  },
  currencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    width: 32,
  },
  currencyInfo: {
    gap: 2,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  currencyName: {
    fontSize: 13,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#120E01",
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
    color: "#FBCC33",
    letterSpacing: 0.3,
  },
});
