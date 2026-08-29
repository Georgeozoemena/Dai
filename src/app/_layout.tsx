import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="bootstrap/index"
        options={{
          headerShown: false,
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
        name="pin-setup"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="pin-lock"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="budget"
        options={{
          title: "Build Budget",
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

      <Stack.Screen
        name="create-goal"
        options={{
          title: "Create Savings Goal",
        }}
      />

      <Stack.Screen
        name="savings-goals"
        options={{
          title: "Savings Goals",
        }}
      />

      <Stack.Screen
        name="goal/[id]"
        options={{
          title: "Savings Goal",
        }}
      />

      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Stack>
  );
}
