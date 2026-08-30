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
          Create an Account
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
            lineHeight: 22,
          }}
        >
          Choose the account you want to
          use for your finances.
        </Text>
      </View>

      {/* Account name */}

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Account Name
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Personal"
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

      {/* Currency */}

      <View style={{ gap: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Currency
        </Text>

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
                  ? "#111"
                  : "#ddd",
                borderRadius: 12,
                padding: 16,
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
                    }}
                  >
                    {currency.code}
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      color: "#666",
                    }}
                  >
                    {currency.name}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
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
            ? "Creating Account..."
            : "Create Account"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
