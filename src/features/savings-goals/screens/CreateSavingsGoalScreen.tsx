import { useState } from "react";

import { router } from "expo-router";

import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAccountStore } from "../../../store/account/accountStore";

import {
  createSavingsGoal,
} from "../services/savingsGoalService";
import { screenStyles } from "../../../theme";

export function CreateSavingsGoalScreen() {
  const currentAccountId = useAccountStore(
    (state) => state.currentAccountId,
  );

  const [name, setName] = useState("");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [saving, setSaving] =
    useState(false);

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

    const numericTarget =
      Number(targetAmount);

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

      const now = new Date().toISOString();

      const goal = {
        id: `${Date.now()}`,
        accountId: currentAccountId,
        name: name.trim(),
        targetAmount: numericTarget,
        currentAmount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await createSavingsGoal(goal);

      Alert.alert(
        "Goal Created 🎉",
        `"${goal.name}" has been created successfully.`,
        [
          {
            text: "View Goals",
            onPress: () => router.back(),
          },
        ],
      );
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

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Create Savings Goal</Text>

        <Text style={screenStyles.subtitle}>
          Start saving towards something
          important to you.
        </Text>
      </View>

      {/* Goal Name */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>What are you saving for?</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. New Laptop"
          style={screenStyles.input}
        />
      </View>

      {/* Target Amount */}

      <View style={{ gap: 8 }}>
        <Text style={screenStyles.label}>Target Amount</Text>

        <TextInput
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
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
          {saving
            ? "Creating..."
            : "Create Goal"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
