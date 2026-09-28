import { router } from "expo-router";

import { PinSetupScreen } from "../features/auth/screens/PinSetupScreen";

export default function PinSetupRoute() {
  return (
    <PinSetupScreen
      onComplete={() => {
        // After PIN is created, go straight to dashboard
        // User can create accounts from there when ready
        router.replace("/(tabs)");
      }}
    />
  );
}