import { router } from "expo-router";

import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { logoutUser } from "../../auth/services/logoutService";
import { colors, screenStyles } from "../../../theme";

const settingsItems = [
  {
    title: "Profile",
    description: "Manage your personal information",
    route: "/profile",
  },
  {
    title: "Currency",
    description: "Choose your preferred currency",
    route: "/settings/currency",
  },
  {
    title: "Accounts",
    description: "Manage your financial accounts",
    route: "/(tabs)/accounts",
  },
  {
    title: "Export Transactions",
    description: "Download your transaction history as CSV",
    route: "/settings/export",
  },
];

export function SettingsScreen() {
  const handleLogout = async () => {
    console.log("🔴 Logout button pressed");
    
    // For web, use window.confirm; for native use Alert
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Log out?\n\nYou'll need to sign in with Google again to access Dai."
      );
      
      if (!confirmed) {
        console.log("Logout cancelled");
        return;
      }
      
      console.log("🔴 User confirmed logout");
      try {
        await logoutUser();
        console.log("🔴 Navigating to login...");
        router.replace("/login");
      } catch (error) {
        console.error("LOGOUT FAILED:", error);
        window.alert("Logout failed. Please try again.");
      }
    } else {
      Alert.alert(
        "Log out?",
        "You'll need to sign in with Google again to access Dai.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => console.log("Logout cancelled"),
          },
          {
            text: "Log out",
            style: "destructive",
            onPress: async () => {
              console.log("🔴 User confirmed logout");
              try {
                await logoutUser();
                console.log("🔴 Navigating to login...");
                router.replace("/login");
              } catch (error) {
                console.error("LOGOUT FAILED:", error);
                Alert.alert(
                  "Logout Failed",
                  "There was an error logging out. Please try again.",
                );
              }
            },
          },
        ],
      );
    }
  };

  return (
    <ScrollView
      style={screenStyles.root}
      contentContainerStyle={screenStyles.scrollContent}
    >
      <View>
        <Text style={screenStyles.title}>Settings</Text>

        <Text style={screenStyles.subtitle}>
          Manage your Dai preferences.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {settingsItems.map((item) => (
          <Pressable
            key={item.title}
            onPress={() =>
              router.push(item.route as any)
            }
            style={screenStyles.settingsRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={screenStyles.label}>{item.title}</Text>

              <Text
                style={{
                  marginTop: 4,
                  color: colors.textSecondary,
                }}
              >
                {item.description}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 22,
                color: colors.textMuted,
              }}
            >
              ›
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleLogout}
        style={{
          marginTop: 32,
          paddingVertical: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.error,
          alignItems: "center",
          backgroundColor: colors.surface,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.error,
          }}
        >
          Log Out
        </Text>
      </Pressable>

      <View
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.textMuted }}>Dai V1</Text>
      </View>
    </ScrollView>
  );
}
