import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";

import { initializeApp } from "../services/appInitializationService";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function startApp() {
      try {
        const result = await initializeApp();

        if (result.status === "onboarding") {
          router.replace("/onboarding");
          return;
        }

        if (result.status === "no-account") {
          router.replace({
            pathname: "/create-account",
            params: {
              profileId: result.profile.id,
            },
          });

          return;
        }

        router.replace("/(tabs)");
      } catch (error) {
        console.error(
          "FAILED TO INITIALIZE APP:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    startApp();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
