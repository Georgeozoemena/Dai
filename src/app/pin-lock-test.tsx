import { router } from "expo-router";
import { PinLockScreen } from "../features/auth/screens/PinLockScreen";

export default function PinLockTestRoute() {
  return (
    <PinLockScreen
      onSuccess={() => {
        console.log("UNLOCK SUCCESS");
        alert("PIN verified! Unlocking Dai...");
        router.replace("/(tabs)");
      }}
    />
  );
}
