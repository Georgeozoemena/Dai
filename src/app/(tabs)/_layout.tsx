import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { colors } from "../../theme";

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
              activeIcon="home"
              inactiveIcon="home-outline"
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
        name="weekly"
        options={{
          title: "Weekly",
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon
              focused={focused}
              size={size}
              activeIcon="calendar"
              inactiveIcon="calendar-outline"
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
    </Tabs>
  );
}
