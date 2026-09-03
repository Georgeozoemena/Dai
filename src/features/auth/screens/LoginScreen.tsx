import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { useGoogleAuth } from "../hooks/useGoogleAuth";

export function LoginScreen() {
  const { request, promptAsync } = useGoogleAuth();

  const handleGoogleLogin = () => {
    promptAsync();
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 40,
          fontWeight: "800",
          marginBottom: 12,
        }}
      >
        Dai
      </Text>

      <Text
        style={{
          fontSize: 18,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        Your money. Clearer.
      </Text>

      <Pressable
        disabled={!request}
        onPress={handleGoogleLogin}
        style={{
          width: "100%",
          paddingVertical: 18,
          borderRadius: 14,
          borderWidth: 1,
          alignItems: "center",
        }}
      >
        {!request ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            Continue with Google
          </Text>
        )}
      </Pressable>
    </View>
  );
}
