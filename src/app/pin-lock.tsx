import { router } from "expo-router";

import { PinLockScreen } from "../features/auth/screens/PinLockScreen";

export default function PinLockRoute() {
  return (
    <PinLockScreen
      onSuccess={() => {
        // After PIN is verified, go straight to dashboard
        // User can create accounts from there when ready
        router.replace("/(tabs)");
      }}
    />
  );
}