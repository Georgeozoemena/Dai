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
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useAccountStore } from "../../../store/account/accountStore";
import { useAccountCurrency } from "../../../hooks/useAccountCurrency";

import {
  createSavingsGoal,
  calculateSuggestedAmount,
  calculateNextDueDate,
} from "../services/savingsGoalService";
import { scheduleGoalReminder } from "../services/savingsReminderService";
import { colors, radii } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { PageBackButton } from "../../../components/PageBackButton";
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
  const [enableReminders, setEnableReminders] = useState(true);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [targetAmountFocused, setTargetAmountFocused] = useState(false);
  const [customAmountFocused, setCustomAmountFocused] = useState(false);
  const [targetDateFocused, setTargetDateFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

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
      
      // Schedule reminder if enabled
      if (enableReminders) {
        await scheduleGoalReminder(goal);
      }
      
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Simple Header */}
      <View style={styles.header}>
        <PageBackButton onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.headerTitle}>New Savings Goal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Goal Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Goal Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholder="e.g., New Laptop"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.inputLarge,
              nameFocused && styles.inputFocused
            ]}
          />
        </View>

        {/* Target Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Target Amount</Text>
          <View style={[
            styles.amountInputContainer,
            targetAmountFocused && styles.inputFocused
          ]}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              value={targetAmount}
              onChangeText={setTargetAmount}
              onFocus={() => setTargetAmountFocused(true)}
              onBlur={() => setTargetAmountFocused(false)}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* Frequency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contribution Frequency</Text>
          <View style={styles.frequencyContainer}>
            {(["daily", "weekly", "monthly"] as const).map((freq) => (
              <Pressable
                key={freq}
                onPress={() => setFrequency(freq)}
                style={[
                  styles.frequencyOption,
                  frequency === freq && styles.frequencyOptionActive
                ]}
              >
                <Text style={[
                  styles.frequencyText,
                  frequency === freq && styles.frequencyTextActive
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contribution Amount */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Payment Amount</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <Text style={styles.helperTextTop}>
            Leave blank to use smart auto-calculation
          </Text>
          <View style={[
            styles.paymentAmountCard,
            customAmountFocused && styles.paymentAmountCardFocused
          ]}>
            <View style={styles.paymentAmountHeader}>
              <Ionicons name="wallet" size={20} color={colors.secondary} />
              <Text style={styles.paymentAmountLabel}>Per {frequency} payment</Text>
            </View>
            <View style={styles.paymentAmountInputRow}>
              <Text style={styles.paymentCurrencySymbol}>₦</Text>
              <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                onFocus={() => setCustomAmountFocused(true)}
                onBlur={() => setCustomAmountFocused(false)}
                placeholder={autoSuggestedAmount > 0 ? String(autoSuggestedAmount) : "0"}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.paymentAmountInput}
              />
            </View>
          </View>
          {displaySuggestedAmount > 0 && numericTarget > 0 && (
            <View style={styles.calculationHint}>
              <Ionicons name="calculator-outline" size={18} color={colors.secondary} />
              <Text style={styles.calculationText}>
                {Math.ceil(numericTarget / displaySuggestedAmount)} × {formatCurrency(displaySuggestedAmount, currencyCode)} = {formatCurrency(numericTarget, currencyCode)}
              </Text>
            </View>
          )}
        </View>

        {/* Target Date */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Target Date</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <View style={[
            styles.dateInputContainer,
            targetDateFocused && styles.inputFocused
          ]}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={targetDate}
              onChangeText={setTargetDate}
              onFocus={() => setTargetDateFocused(true)}
              onBlur={() => setTargetDateFocused(false)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={styles.dateInput}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            placeholder="Add details about this goal..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.inputRegular,
              styles.textArea,
              descriptionFocused && styles.inputFocused
            ]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Reminders Toggle */}
        <View style={styles.section}>
          <Pressable 
            onPress={() => setEnableReminders(!enableReminders)}
            style={styles.toggleRow}
          >
            <View style={styles.toggleLabel}>
              <Ionicons 
                name="notifications-outline" 
                size={22} 
                color={colors.text} 
              />
              <Text style={styles.toggleText}>Enable Reminders</Text>
            </View>
            <View style={[
              styles.toggle,
              enableReminders && styles.toggleActive
            ]}>
              <View style={[
                styles.toggleThumb,
                enableReminders && styles.toggleThumbActive
              ]} />
            </View>
          </Pressable>
          <Text style={styles.toggleHint}>
            Get notified before your payment is due
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleCreateGoal}
          disabled={saving}
          style={({ pressed }) => [
            styles.createButton,
            saving && styles.createButtonDisabled,
            pressed && !saving && styles.createButtonPressed
          ]}
        >
          <Text style={styles.createButtonText}>
            {saving ? "Creating Goal..." : "Create Goal"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionalBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  helperTextTop: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  inputLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  inputRegular: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}05`,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 4,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  paymentAmountCard: {
    backgroundColor: `${colors.secondary}08`,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: `${colors.secondary}20`,
    padding: 20,
    gap: 12,
  },
  paymentAmountCardFocused: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}12`,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  paymentAmountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentCurrencySymbol: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.secondary,
  },
  paymentAmountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    paddingVertical: 4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  frequencyOptionActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  frequencyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  frequencyTextActive: {
    color: colors.primary,
  },
  calculationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: `${colors.primary}10`,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: `${colors.secondary}10`,
  },
  calculationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.secondary,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
});
