import { useLocalSearchParams } from "expo-router";

import { EditTransactionScreen } from "../../../features/transactions/screens/EditTransactionScreen";

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <EditTransactionScreen
      transactionId={id}
    />
  );
}
