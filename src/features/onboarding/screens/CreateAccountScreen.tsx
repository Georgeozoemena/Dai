import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Account } from "../../../types/account";
import { createAccount } from "../../accounts/services/accountService";
import { CURRENCIES } from "../../../constants/currencies";
import { colors, radii, screenStyles } from "../../../theme";

interface CreateAccountScreenProps {
  profileId: string;
  onComplete?: (account: Account) => void;
}

export function CreateAccountScreen({
  profileId,
  onComplete,
}: CreateAccountScreenProps) {
  const [name, setName] = useState("");
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
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      {/* Header */}

      <View>
        <Text style={screenStyles.title}>Create an Account</Text>

        <Text style={screenStyles.subtitle}>
          Choose the account you want to
          use for your finances.
        </Text>
      </View>

      {/* Account name */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Account Name</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Personal"
          style={screenStyles.input}
        />
      </View>

      {/* Currency */}

      <View style={{ gap: 12 }}>
        <Text style={screenStyles.label}>Currency</Text>

        {CURRENCIES.map((currency) => {
          const selected =
            currencyCode === currency.code;

          return (
            <Pressable
              key={currency.code}
              onPress={() =>
                setCurrencyCode(currency.code)
              }
              style={{
                borderWidth: 1,
                borderColor: selected
                  ? colors.secondary
                  : colors.borderInput,
                borderRadius: radii.sm,
                padding: 16,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    {currency.code}
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      color: colors.textSecondary,
                    }}
                  >
                    {currency.name}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {currency.symbol}
                </Text>
              </View>
            </Pressable>
          );
        })}
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
            ? "Creating Account..."
            : "Create Account"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
