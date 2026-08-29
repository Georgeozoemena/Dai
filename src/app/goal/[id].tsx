import { useLocalSearchParams } from "expo-router";

import { SavingsGoalDetailScreen } from "../../features/savings-goals/screens/SavingsGoalDetailScreen";

export default function SavingsGoalRoute() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return <SavingsGoalDetailScreen goalId={id} />;
}
