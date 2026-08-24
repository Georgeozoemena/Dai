import { router } from "expo-router";

import { OnboardingScreen } from "../features/onboarding/screens/OnboardingScreen";

export default function OnboardingRoute() {
  return (
    <OnboardingScreen
      onComplete={() => {
        router.push("/profile");
      }}
    />
  );
}
