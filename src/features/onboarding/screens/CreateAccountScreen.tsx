import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { generateId } from "../../../utils/id";
import { formatCurrency } from "../../../utils/currency";
import { colors } from "../../../theme";
import { PageBackButton } from "../../../components/PageBackButton";

interface CreateAccountScreenProps {
  profileId: string;
  onComplete?: (account: Account) => void;
}

export function CreateAccountScreen({
  profileId,
  onComplete,
}: CreateAccountScreenProps) {
  const [name, setName] = useState("Main");
  const [initialBalance, setInitialBalance] = useState("");
  const [currencyCode, setCurrencyCode] = useState("NGN");
  const [saving, setSaving] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [formError, setFormError] = useState("");

  const selectedCurrency =
    CURRENCIES.find((currency) => currency.code === currencyCode) ??
    CURRENCIES[0];
  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();
    return query
      ? CURRENCIES.filter((currency) =>
          `${currency.code} ${currency.name}`.toLowerCase().includes(query),
        )
      : CURRENCIES;
  }, [currencySearch]);
  const previewBalance = parseFloat(initialBalance) || 0;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Add a name for this account to continue.");
      return;
    }
    if (!currencyCode) {
      setFormError("Choose a currency for this account.");
      return;
    }

    try {
      setFormError("");
      setSaving(true);
      const now = new Date().toISOString();
      const account: Account = {
        id: generateId(),
        profileId,
        name: name.trim(),
        initialBalance: parseFloat(initialBalance) || 0,
        currencyCode,
        createdAt: now,
        updatedAt: now,
      };

      await createAccount(account);
      if (onComplete) onComplete(account);
    } catch (error) {
      console.error("FAILED TO CREATE ACCOUNT:", error);
      setFormError("We couldn’t create that account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageBackButton onPress={() => router.back()} style={styles.backButton} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>ACCOUNT SETUP</Text>
          <Text style={styles.title}>Set up an account</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewTopRow}>
            {/* <View style={styles.previewIcon}>
              <Ionicons name="wallet-outline" size={19} color={colors.primary} />
            </View> */}
            <Text style={styles.previewCurrency}>{selectedCurrency.code}</Text>
          </View>
          <Text style={styles.previewLabel}>ACCOUNT BALANCE</Text>
          <Text style={styles.previewAmount}>
            {formatCurrency(previewBalance, currencyCode)}
          </Text>
          <Text style={styles.previewName}>
            {name.trim() || "Account name"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Account name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setFormError("");
              }}
              placeholder="e.g. Everyday, Rent, Savings"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              accessibilityLabel="Account name"
            />
            <Ionicons
              name="create-outline"
              size={19}
              color={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Starting balance</Text>
            <Text style={styles.optional}>OPTIONAL</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>{selectedCurrency.symbol}</Text>
            <TextInput
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder="0"
              keyboardType="decimal-pad"
              style={[styles.input, styles.amountInput]}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Starting balance"
            />
          </View>
          <Text style={styles.hint}>
            Leave it empty if you’re starting from zero.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Currency</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Currency, ${selectedCurrency.name}. Change currency`}
            onPress={() => {
              setCurrencySearch("");
              setCurrencyPickerOpen(true);
            }}
            style={({ pressed }) => [
              styles.currencyButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>
                {selectedCurrency.symbol}
              </Text>
            </View>
            <View style={styles.currencyTextGroup}>
              <Text style={styles.currencyCode}>{selectedCurrency.code}</Text>
              <Text style={styles.currencyName}>{selectedCurrency.name}</Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {!!formError && (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {formError}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !saving && styles.submitPressed,
            saving && styles.submitButtonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.submitButtonText}>Create account</Text>
          )}
          {!saving && (
            <Ionicons name="arrow-forward" size={19} color={colors.primary} />
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={currencyPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyPickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalScrim}
            onPress={() => setCurrencyPickerOpen(false)}
            accessibilityLabel="Close currency picker"
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeading}>
              <View>
                <Text style={styles.sheetTitle}>Choose currency</Text>
                <Text style={styles.sheetSubtitle}>
                  Used for this account’s balance.
                </Text>
              </View>
              <Pressable
                onPress={() => setCurrencyPickerOpen(false)}
                hitSlop={8}
                accessibilityLabel="Close"
              >
                <Ionicons name="close-circle" size={27} color="#999" />
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={currencySearch}
                onChangeText={setCurrencySearch}
                placeholder="Search currencies"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filteredCurrencies.map((currency) => {
                const selected = currencyCode === currency.code;
                return (
                  <Pressable
                    key={currency.code}
                    onPress={() => {
                      setCurrencyCode(currency.code);
                      setCurrencyPickerOpen(false);
                    }}
                    style={[
                      styles.currencyOption,
                      selected && styles.currencyOptionSelected,
                    ]}
                  >
                    <Text style={styles.optionSymbol}>{currency.symbol}</Text>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionCode}>{currency.code}</Text>
                      <Text style={styles.optionName}>{currency.name}</Text>
                    </View>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.text}
                      />
                    )}
                  </Pressable>
                );
              })}
              {filteredCurrencies.length === 0 && (
                <Text style={styles.noCurrencies}>No currencies found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    margin: 20, marginLeft: 20,
    marginBottom: 16,
  },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  headingBlock: { marginBottom: 20 },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "750",
  },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 6 },
  previewCard: {
    backgroundColor: colors.secondary,
    borderRadius: 22,
    padding: 20,
    marginBottom: 26,
    minHeight: 166,
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(184,243,74,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCurrency: {
    color: "#D5D5D5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  previewLabel: {
    color: "#AAA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  previewAmount: {
    color: "#FFF",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 3,
  },
  previewName: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 7,
  },
  field: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "650",
    marginBottom: 9,
  },
  optional: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 9,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 14 },
  amountInput: { fontVariant: ["tabular-nums"] },
  currencyPrefix: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: "600",
    marginRight: 10,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 7 },
  currencyButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  currencyBadge: {
    height: 40,
    width: 40,
    borderRadius: 13,
    backgroundColor: "#F3F5ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  currencyBadgeText: { color: colors.text, fontSize: 18, fontWeight: "700" },
  currencyTextGroup: { flex: 1 },
  currencyCode: { color: colors.text, fontSize: 14, fontWeight: "700" },
  currencyName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  changeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 5,
  },
  pressed: { opacity: 0.78 },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: -7,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 56,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },
  submitPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modalSheet: {
    maxHeight: "78%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4D4D4",
    marginBottom: 18,
  },
  sheetHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  sheetSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  searchContainer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.surface,
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  currencyOption: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderInput,
  },
  currencyOptionSelected: {
    backgroundColor: "#F0F2E9",
    borderRadius: 12,
    borderBottomColor: "transparent",
  },
  optionSymbol: {
    width: 40,
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
  },
  optionCopy: { flex: 1 },
  optionCode: { color: colors.text, fontSize: 14, fontWeight: "700" },
  optionName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  noCurrencies: { color: colors.textMuted, textAlign: "center", padding: 24 },
});
