import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { colors } from "../../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const GOOGLE_MARK =
  "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

export function LoginScreen() {
  const { isReady, promptAsync } = useGoogleAuth();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Hero Section with Full-Width Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../../../../assets/old-man.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Gradient overlay to fade to white */}
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.7)", "#FFFFFF"]}
          locations={[0, 0.5, 0.8, 1]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Tagline - Left Aligned */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>
            Track your{"\n"}
            <Text style={styles.taglineHighlight}>finances</Text> in seconds
          </Text>
        </View>

        {/* Spacer to push buttons to bottom */}
        <View style={{ flex: 1, minHeight: 20 }} />

      {/* Bottom Section - Buttons */}
      <View style={styles.bottomSection}>
        {/* Google Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          disabled={!isReady}
          onPress={() => promptAsync()}
          style={({ pressed }) => [
            styles.button,
            styles.googleButton,
            !isReady && styles.buttonDisabled,
            pressed && isReady && styles.buttonPressed,
          ]}
        >
          {!isReady ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Image source={{ uri: GOOGLE_MARK }} style={styles.buttonIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        {/* Apple Button (Disabled/Coming Soon) */}
        <Pressable
          disabled
          style={[styles.button, styles.appleButton, styles.buttonDisabled]}
        >
          <Ionicons name="logo-apple" size={22} color="#000" />
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </Pressable>

        {/* Email Button - Commented out for now */}
        <Pressable
          disabled
          style={[styles.button, styles.emailButton, styles.buttonDisabled]}
        >
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </Pressable>

        {/* Footer text */}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45, // 45% of screen height
    backgroundColor: "#F5F5F5",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%", // Fade starts from bottom 40% of image
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  taglineContainer: {
    width: "100%",
    marginBottom: 40, // Standard mobile spacing before buttons
  },
  taglineText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1a1a1a5d",
    textAlign: "left",
    lineHeight: 40,
  },
  taglineHighlight: {
    fontWeight: "800",
    color: "#121212",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 30,
  },
  googleButton: {
    backgroundColor: "#120E01",
  },
  appleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  emailButton: {
    backgroundColor: "#F5F5F5",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    width: 22,
    height: 22,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
