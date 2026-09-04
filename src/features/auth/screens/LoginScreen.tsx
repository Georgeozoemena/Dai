import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGoogleAuth } from "../hooks/useGoogleAuth";

const GOOGLE_MARK =
  "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

export function LoginScreen() {
  const { isReady, promptAsync } = useGoogleAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, styles.shape1]} />
            <View style={[styles.logoShape, styles.shape2]} />
          </View>
          <View style={styles.logoRow}>
            <View style={[styles.logoShape, styles.shape3]} />
            <View style={[styles.logoShape, styles.shape4]} />
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>Denari</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Google Sign In Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            disabled={!isReady}
            onPress={() => promptAsync()}
            style={({ pressed }) => [
              styles.googleButton,
              !isReady && styles.buttonDisabled,
              pressed && isReady && styles.buttonPressed,
            ]}
          >
            {!isReady ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Image source={{ uri: GOOGLE_MARK }} style={styles.googleMark} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    gap: 12,
    marginBottom: 60,
  },
  logoRow: {
    flexDirection: "row",
    gap: 12,
  },
  logoShape: {
    width: 48,
    height: 48,
    backgroundColor: "#1a1a1a",
  },
  shape1: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 20,
  },
  shape2: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 12,
  },
  shape3: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 24,
  },
  shape4: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 16,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  googleButton: {
    marginTop: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#120E01",
    paddingVertical: 22,
    borderRadius: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  googleMark: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FBCC33",
    letterSpacing: 0.5,
  },
});
