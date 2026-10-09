import { useState } from "react";

import { router } from "expo-router";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAccountStore } from "../../../store/account/accountStore";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

import {
  createSavingsGoal,
  calculateSuggestedAmount,
  calculateNextDueDate,
} from "../services/savingsGoalService";
import { colors, screenStyles } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../../utils/currency";

export function CreateSavingsGoalScreen() {
  const currentAccountId = useAccountStore(
    (state) => state.currentAccountId,
  );
  
  const currencyCode = useAccountCurrency();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  
  // Ajo-inspired discipline (core to all goals)
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [customAmount, setCustomAmount] = useState("");

  const [saving, setSaving] = useState(false);

  const handleCreateGoal = async () => {
    if (!currentAccountId) {
      Alert.alert(
        "No account selected",
        "Please select an account first.",
      );

      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Goal name required",
        "Please enter a name for your goal.",
      );

      return;
    }

    const numericTarget = Number(targetAmount);

    if (
      Number.isNaN(numericTarget) ||
      numericTarget <= 0
    ) {
      Alert.alert(
        "Invalid target",
        "Please enter a valid target amount.",
      );

      return;
    }

    try {
      setSaving(true);

      const now = new Date();
      const nowISO = now.toISOString();

      // Calculate suggested amount (use custom if provided, otherwise auto-calculate)
      const suggestedAmount = customAmount && Number(customAmount) > 0
        ? Number(customAmount)
        : calculateSuggestedAmount(numericTarget, 0, targetDate, frequency);

      const goal = {
        id: `${Date.now()}`,
        accountId: currentAccountId,
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: numericTarget,
        currentAmount: 0,
        targetDate: targetDate || undefined,
        frequency,
        suggestedAmount,
        startDate: nowISO,
        nextDueDate: calculateNextDueDate(now, frequency).toISOString(),
        missedPayments: 0,
        streak: 0,
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      await createSavingsGoal(goal);
      
      // Navigate to goals list immediately
      router.replace("/savings-goals");
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          "Goal Created!",
          `Your "${goal.name}" savings goal is ready! Remember to contribute ${formatCurrency(suggestedAmount, currencyCode)} ${frequency}.`,
        );
      }, 100);
    } catch (error) {
      console.error(
        "FAILED TO CREATE SAVINGS GOAL:",
        error,
      );

      Alert.alert(
        "Something went wrong",
        "Could not create your savings goal.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate auto-suggested amount preview
  const numericTarget = Number(targetAmount) || 0;
  const autoSuggestedAmount = numericTarget > 0
    ? calculateSuggestedAmount(numericTarget, 0, targetDate, frequency)
    : 0;
  
  const displaySuggestedAmount = customAmount && Number(customAmount) > 0
    ? Number(customAmount)
    : autoSuggestedAmount;

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Ionicons name="people" size={28} color={colors.secondary} />
          <Text style={screenStyles.title}>Create Savings Goal</Text>
        </View>

        <Text style={screenStyles.subtitle}>
          Save with discipline. Regular contributions, tracked progress, real results - the Ajo way.
        </Text>
      </View>

      {/* Goal Name */}
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>What are you saving for? *</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. New Laptop, Emergency Fund, Vacation"
          style={screenStyles.input}
        />
      </View>

      {/* Description */}
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Description (Optional)</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add more details about your goal"
          style={[screenStyles.input, { minHeight: 80 }]}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Target Amount */}
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Target Amount *</Text>

        <TextInput
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder={`0.00 ${currencyCode}`}
          keyboardType="decimal-pad"
          style={screenStyles.input}
        />
      </View>

      {/* Ajo Discipline Section */}
      <View style={styles.ajoSection}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Ionicons name="trophy" size={20} color={colors.secondary} />
          <Text style={styles.ajoTitle}>Ajo-Inspired Discipline</Text>
        </View>
        
        <Text style={styles.ajoDescription}>
          Build the savings habit with regular contributions. We'll track your streak and keep you motivated!
        </Text>

        {/* Frequency Selection */}
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={screenStyles.label}>How often will you contribute? *</Text>
          
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["daily", "weekly", "monthly"] as const).map((freq) => (
              <Pressable
                key={freq}
                onPress={() => setFrequency(freq)}
                style={[
                  styles.frequencyButton,
                  frequency === freq && styles.frequencyButtonSelected
                ]}
              >
                <Text style={[
                  styles.frequencyButtonText,
                  frequency === freq && styles.frequencyButtonTextSelected
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Amount (Optional) */}
        <View style={{ gap: 8 }}>
          <Text style={screenStyles.label}>Contribution Amount (Optional)</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -4 }}>
            Leave blank to use our smart suggestion based on your target and deadline.
          </Text>

          <TextInput
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder={`e.g. ${autoSuggestedAmount > 0 ? formatCurrency(autoSuggestedAmount, currencyCode) : `1,000 ${currencyCode}`}`}
            keyboardType="decimal-pad"
            style={screenStyles.input}
          />
        </View>

        {/* Preview Calculator */}
        {displaySuggestedAmount > 0 && numericTarget > 0 && (
          <View style={styles.ajoPreview}>
            <Ionicons name="calculator" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ajoPreviewText}>
                {Math.ceil(numericTarget / displaySuggestedAmount)} {frequency} contributions needed
              </Text>
              <Text style={styles.ajoPreviewSubtext}>
                {formatCurrency(displaySuggestedAmount, currencyCode)} per {frequency.replace('ly', '')} = {formatCurrency(numericTarget, currencyCode)} target
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Target Date */}
      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Target Date (Optional)</Text>
        
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: -4 }}>
          When do you want to reach this goal? This helps us calculate your suggested contribution.
        </Text>

        <TextInput
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD (e.g., 2027-06-30)"
          style={screenStyles.input}
        />
      </View>

      {/* Create Button */}
      <Pressable
        onPress={handleCreateGoal}
        disabled={saving}
        style={[screenStyles.primaryButton, { opacity: saving ? 0.5 : 1 }]}
      >
        <Text style={screenStyles.primaryButtonText}>
          {saving ? "Creating..." : "Start Saving"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ajoSection: {
    backgroundColor: `${colors.secondary}15`,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
  },
  ajoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  ajoDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  frequencyButtonSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  frequencyButtonTextSelected: {
    color: colors.background,
  },
  ajoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    marginTop: 8,
  },
  ajoPreviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  ajoPreviewSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
