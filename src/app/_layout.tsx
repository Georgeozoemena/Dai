import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Dai",
        }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="create-account"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="expense"
        options={{
          title: "Add Expense",
        }}
      />

      <Stack.Screen
        name="income"
        options={{
          title: "Add Income",
        }}
      />

      <Stack.Screen
        name="transaction/[id]"
        options={{
          title: "Transaction",
        }}
      />

      <Stack.Screen
        name="transaction/[id]/edit"
        options={{
          title: "Edit Transaction",
        }}
      />
    </Stack>
  );
}