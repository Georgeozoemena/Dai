import { router } from "expo-router";

import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { logoutUser } from "../../auth/services/logoutService";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/auth/authStore";

const settingsItems = [
  {
    title: "Profile",
    description: "Manage your personal information",
    icon: "person-outline" as const,
    route: "/auth/bio",
  },
  {
    title: "Linked Accounts",
    description: "Manage sign-in methods and providers",
    icon: "link-outline" as const,
    route: "/auth/linked-accounts",
  },
  {
    title: "Accounts",
    description: "Manage your financial accounts",
    icon: "wallet-outline" as const,
    route: "/(tabs)/accounts",
  },
  {
    title: "Dai Coach",
    description: "Insights and advice about your spending",
    icon: "bulb-outline" as const,
    route: "/coach",
  },
  {
    title: "Budget Report",
    description: "Export a PDF report of your monthly budget",
    icon: "document-text-outline" as const,
    route: "/budget-report",
  },
  {
    title: "Export Transactions",
    description: "Download your transaction history as CSV",
    icon: "download-outline" as const,
    route: "/settings/export",
  },
  {
    title: "Manage notifications",
    description: "Control your notification preferences",
    icon: "notifications-outline" as const,
    route: "/notifications",
  },
];

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  
  const handleLogout = async () => {
    console.log("Logout button pressed");
    
    // For web, use window.confirm; for native use Alert
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Log out?\n\nYou'll need to sign in again to access Dai."
      );
      
      if (!confirmed) {
        console.log("Logout cancelled");
        return;
      }
      
      console.log("User confirmed logout");
      try {
        await logoutUser();
        console.log("Navigating to auth...");
        router.replace("/auth");
      } catch (error) {
        console.error("LOGOUT FAILED:", error);
        window.alert("Logout failed. Please try again.");
      }
    } else {
      Alert.alert(
        "Log out?",
        "You'll need to sign in again to access Dai.",
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
              console.log("User confirmed logout");
              try {
                await logoutUser();
                console.log("Navigating to auth...");
                router.replace("/auth");
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
      // style={{ flex: 1, backgroundColor: "#FEFDFB" }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
    >
        {/* User Profile Card */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.secondary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 80, height: 80 }}
              />
            ) : (
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: 4,
            }}
          >
            {user?.name || "User"}
          </Text>

          {/* Email */}
          <Text
            style={{
              fontSize: 14,
              color: "#999",
            }}
          >
            {user?.email || ""}
          </Text>
        </View>

        {/* Settings Menu Items */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: index === settingsItems.length - 1 ? 0 : 1,
                borderBottomColor: "#f5f5f5",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name={item.icon} size={20} color="#1a1a1a" />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1a1a1a",
                    fontWeight: "500",
                    marginBottom: 2,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#999",
                  }}
                >
                  {item.description}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </Pressable>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          style={{
            marginTop: 24,
            backgroundColor: "#fff",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#f5f5f5",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#ff3b30",
            }}
          >
            Log out
          </Text>
        </Pressable>

        {/* Version */}
        <View
          style={{
            marginTop: 32,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, color: "#ccc" }}>Dai V1</Text>
        </View>
    </ScrollView>
  );
}
