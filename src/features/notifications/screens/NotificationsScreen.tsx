import { Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { colors } from "../../../theme";

export function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FEFDFB" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#1a1a1a",
          }}
        >
          Notifications
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Centered Empty State Content */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
          paddingBottom: 80,
        }}
      >
        {/* Bell Ghost Illustration */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          {/* Left decorative element */}
          <View
            style={{
              position: "absolute",
              left: -60,
              top: 30,
            }}
          >
            <View
              style={{
                width: 40,
                height: 60,
                backgroundColor: "#E8E5E0",
                borderRadius: 20,
              }}
            />
          </View>

          {/* Right decorative element */}
          <View
            style={{
              position: "absolute",
              right: -60,
              top: 30,
            }}
          >
            <View
              style={{
                width: 40,
                height: 60,
                backgroundColor: "#E8E5E0",
                borderRadius: 20,
              }}
            />
          </View>

          {/* Main bell-shaped ghost with orange color */}
          <View
            style={{
              width: 140,
              height: 140,
              backgroundColor: "#FF9F66",
              borderRadius: 70,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Eyes - sad/sleepy */}
            <View
              style={{
                flexDirection: "row",
                gap: 24,
                marginTop: 20,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 4,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 2,
                }}
              />
              <View
                style={{
                  width: 20,
                  height: 4,
                  backgroundColor: "#1a1a1a",
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Small dot mouth */}
            <View
              style={{
                width: 8,
                height: 8,
                backgroundColor: "#1a1a1a",
                borderRadius: 4,
                marginTop: 20,
              }}
            />

            {/* Wave bottom */}
            <View
              style={{
                position: "absolute",
                bottom: -1,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 20,
                  backgroundColor: "#FF9F66",
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              />
              <View
                style={{
                  width: 28,
                  height: 20,
                  backgroundColor: "#FF9F66",
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              />
              <View
                style={{
                  width: 28,
                  height: 20,
                  backgroundColor: "#FF9F66",
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              />
              <View
                style={{
                  width: 28,
                  height: 20,
                  backgroundColor: "#FF9F66",
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "600",
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: 12,
            letterSpacing: -0.3,
          }}
        >
          Coming Soon
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#999999",
            textAlign: "center",
            lineHeight: 22,
            maxWidth: 280,
          }}
        >
          Real-time notifications will be available in an upcoming update. Stay tuned!
        </Text>
      </View>
    </View>
  );
}
