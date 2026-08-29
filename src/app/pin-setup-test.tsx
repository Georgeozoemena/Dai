import { router } from "expo-router";
import { PinSetupScreen } from "../features/auth/screens/PinSetupScreen";
import { hasPin } from "../features/auth/services/pinService";

export default function PinSetupTestRoute() {
  return (
    <PinSetupScreen
      onComplete={async () => {
        console.log("PIN SETUP COMPLETE");
        
        const exists = await hasPin();
        console.log("HAS PIN:", exists);
        
        alert("PIN created successfully! Check console.");
        router.replace("/(tabs)");
      }}
    />
  );
}
