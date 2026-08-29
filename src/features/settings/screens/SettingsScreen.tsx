import { router } from "expo-router";

import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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
];

export function SettingsScreen() {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          Settings
        </Text>

        <Text
          style={{
            marginTop: 6,
            color: "#666",
          }}
        >
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
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 16,
              padding: 18,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  marginTop: 4,
                  color: "#666",
                }}
              >
                {item.description}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 22,
                color: "#999",
              }}
            >
              ›
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#999" }}>
          Dai V1
        </Text>
      </View>
    </ScrollView>
  );
}
