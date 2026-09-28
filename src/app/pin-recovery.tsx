import { useState } from "react";
import { router } from "expo-router";

import { PinRecoveryEmailScreen } from "../features/auth/screens/PinRecoveryEmailScreen";
import { PinRecoveryVerifyScreen } from "../features/auth/screens/PinRecoveryVerifyScreen";
import { PinRecoveryResetScreen } from "../features/auth/screens/PinRecoveryResetScreen";

type RecoveryStep = "email" | "verify" | "reset";

export default function PinRecoveryRoute() {
  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  const handleCancel = () => {
    router.back();
  };

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail);
    setStep("verify");
  };

  const handleVerified = (verifiedUserId: string) => {
    setUserId(verifiedUserId);
    setStep("reset");
  };

  const handleComplete = () => {
    router.replace("/(tabs)");
  };

  if (step === "email") {
    return (
      <PinRecoveryEmailScreen onCodeSent={handleCodeSent} onCancel={handleCancel} />
    );
  }

  if (step === "verify") {
    return (
      <PinRecoveryVerifyScreen
        email={email}
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    );
  }

  return <PinRecoveryResetScreen userId={userId} onComplete={handleComplete} />;
}
