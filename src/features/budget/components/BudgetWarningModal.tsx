import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radii, screenStyles } from "../../../theme";
import { formatCurrency } from "../../../utils/currency";

import type { BudgetWarning } from "../services/budgetWarningService";

interface BudgetWarningModalProps {
  visible: boolean;
  warnings: BudgetWarning[];
  currencyCode: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function getLevelLabel(level: BudgetWarning["level"]) {
  switch (level) {
    case "approaching":
      return "Approaching limit";
    case "will_exceed":
      return "Will go over budget";
    case "already_exceeded":
      return "Already over budget";
  }
}

function getLevelColor(level: BudgetWarning["level"]) {
  return level === "approaching" ? colors.warning : colors.error;
}

function buildWarningMessage(
  warning: BudgetWarning,
  format: (value: number) => string,
): string {
  switch (warning.level) {
    case "approaching":
      return `This expense takes you to ${format(warning.projectedSpent)} of your ${format(warning.limit)} ${warning.category} budget.`;

    case "will_exceed":
      return `You've spent ${format(warning.spent)} of your ${format(warning.limit)} ${warning.category} budget. Adding ${format(warning.proposedAmount)} will put you ${format(warning.overBy)} over budget.`;

    case "already_exceeded":
      return `Your ${warning.category} budget is already ${format(warning.currentOverBy)} over its monthly limit. Adding this expense will increase that to ${format(warning.overBy)}.`;
  }
}

/**
 * Advisory modal shown when a proposed expense approaches or exceeds an
 * active budget. Purely informational — "Add Anyway" always permits the
 * expense, because Dai informs users rather than restricting them.
 */
export function BudgetWarningModal({
  visible,
  warnings,
  currencyCode,
  onCancel,
  onConfirm,
}: BudgetWarningModalProps) {
  const format = (value: number) => formatCurrency(value, currencyCode);

  const heading = warnings.some(
    (warning) => warning.level !== "approaching",
  )
    ? "This puts you over budget"
    : "You're getting close to your limit";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "flex-end",
        }}
      >
        <View style={screenStyles.modalSheet}>
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={screenStyles.sectionTitle}>{heading}</Text>

            <Text
              style={{
                marginTop: 6,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Dai won't stop you — you're in control of your money.
            </Text>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 24 }}
            contentContainerStyle={{ paddingTop: 16, gap: 12 }}
          >
            {warnings.map((warning, index) => {
              const levelColor = getLevelColor(warning.level);

              return (
                <View
                  key={`${warning.category}-${warning.month}-${index}`}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: radii.lg,
                    padding: 16,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {warning.category}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: levelColor,
                      }}
                    >
                      {getLevelLabel(warning.level)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.textSecondary,
                      lineHeight: 20,
                    }}
                  >
                    {buildWarningMessage(warning, format)}
                  </Text>

                  <View
                    style={{
                      height: 8,
                      backgroundColor: colors.border,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(warning.projectedPercent, 100)}%`,
                        height: "100%",
                        backgroundColor: levelColor,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={{ paddingHorizontal: 24, marginTop: 16, gap: 10 }}>
            <Pressable onPress={onConfirm} style={screenStyles.primaryButton}>
              <Text style={screenStyles.primaryButtonText}>Add Anyway</Text>
            </Pressable>

            <TouchableOpacity
              onPress={onCancel}
              style={screenStyles.outlineButton}
            >
              <Text style={screenStyles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
