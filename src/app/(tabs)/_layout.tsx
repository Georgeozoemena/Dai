import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { View, Text, Image } from "react-native";

import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth/authStore";

const SECONDARY = colors.secondary;
const INACTIVE = colors.textMuted;

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  focused,
  size,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  size: number;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}) {
  return (
    <Ionicons
      name={focused ? activeIcon : inactiveIcon}
      size={size}
      color={focused ? SECONDARY : INACTIVE}
    />
  );
}

function ProfileAvatar({ focused, size }: { focused: boolean; size: number }) {
  const user = useAuthStore((state) => state.user);
  
  // Get the first letter of email or name
  const initial = (user?.email?.[0] || user?.name?.[0] || "U").toUpperCase();
  
  const avatarSize = size + 2; // Slightly larger than standard icon
  const fontSize = size * 0.5; // Half the size for the text
  
  // If user has an avatar URL (from Google), show the image
  if (user?.avatar) {
    return (
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          overflow: "hidden",
          borderWidth: focused ? 2 : 0,
          borderColor: SECONDARY,
        }}
      >
        <Image
          source={{ uri: user.avatar }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      </View>
    );
  }
  
  // Fallback to initial letter
  return (
    <View
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        backgroundColor: focused ? SECONDARY : INACTIVE,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: fontSize,
          fontWeight: "600",
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: SECONDARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              focused={focused}
              size={size}
              activeIcon="apps"
              inactiveIcon="apps-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon
              focused={focused}
              size={size}
              activeIcon="wallet"
              inactiveIcon="wallet-outline"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon
              focused={focused}
              size={size}
              activeIcon="list"
              inactiveIcon="list-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon
              focused={focused}
              size={size}
              activeIcon="pie-chart"
              inactiveIcon="pie-chart-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <ProfileAvatar focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
