import { useState, useEffect, useCallback } from "react";
import { Text, View, Pressable, ScrollView, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { colors } from "../../../theme";
import { useAccountStore } from "../../../store/account/accountStore";
import { useNotificationStore } from "../../../store/notification/notificationStore";
import * as notificationService from "../services/notificationService";
import type { Notification } from "../../../types/notification";

export function NotificationsScreen() {
  const { currentAccountId } = useAccountStore();
  const { setUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!currentAccountId) return;

    try {
      setLoading(true);
      const allNotifications = await notificationService.getNotifications(currentAccountId);
      setNotifications(allNotifications);

      // Update unread count
      const unreadCount = allNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [currentAccountId])
  );

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentAccountId || notifications.length === 0) return;

    try {
      await notificationService.markAllAsRead(currentAccountId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete this notification?");
      if (!confirmed) return;
    } else {
      Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await performDelete(notificationId);
          },
        },
      ]);
      return;
    }

    await performDelete(notificationId);
  };

  const performDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (!currentAccountId || notifications.length === 0) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete all notifications?");
      if (!confirmed) return;
    } else {
      Alert.alert("Clear All Notifications", "Are you sure you want to delete all notifications?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await performClearAll();
          },
        },
      ]);
      return;
    }

    await performClearAll();
  };

  const performClearAll = async () => {
    if (!currentAccountId) return;

    try {
      await notificationService.deleteAllNotifications(currentAccountId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on action type
    if (notification.actionType && notification.actionId) {
      switch (notification.actionType) {
        case "budget":
          router.push("/budget-dashboard");
          break;
        case "goal":
          router.push(`/goal/${notification.actionId}`);
          break;
        case "transaction":
          router.push(`/transaction/${notification.actionId}`);
          break;
        case "account":
          router.push("/(tabs)");
          break;
      }
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "budget_exceeded":
        return "alert-circle";
      case "budget_warning":
        return "warning";
      case "budget_reached":
        return "checkmark-circle";
      case "goal_milestone":
        return "trophy";
      case "goal_achieved":
        return "star";
      case "low_balance":
        return "wallet";
      case "large_expense":
        return "card";
      case "reminder":
        return "time";
      case "system":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "budget_exceeded":
        return "#FF4444";
      case "budget_warning":
        return "#FF9F66";
      case "budget_reached":
      case "goal_achieved":
        return "#4CAF50";
      case "goal_milestone":
        return "#2196F3";
      case "low_balance":
        return "#FF9F66";
      case "large_expense":
        return "#9C27B0";
      case "reminder":
        return "#607D8B";
      case "system":
        return "#1a1a1a";
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
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

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#999" }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (notifications.length === 0) {
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

        {/* Empty State */}
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

            {/* Main bell-shaped ghost */}
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
              {/* Eyes */}
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
            No Notifications
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
            You're all caught up! Notifications about your budgets, goals, and transactions will appear here.
          </Text>
        </View>
      </View>
    );
  }

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
          backgroundColor: "#FEFDFB",
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

        <Pressable
          onPress={handleClearAll}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#999" />
        </Pressable>
      </View>

      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Pressable
            onPress={handleMarkAllAsRead}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: "#F5F5F5",
              borderRadius: 20,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: colors.primary,
              }}
            >
              Mark all as read ({unreadCount})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#FEFDFB" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((notification, index) => {
          const iconName = getNotificationIcon(notification.type);
          const iconColor = getNotificationColor(notification.type);

          return (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              style={{
                backgroundColor: notification.isRead ? "#FFF" : "#F9F9F9",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: notification.isRead ? "#E8E5E0" : colors.primary + "30",
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: iconColor + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name={iconName as any} size={22} color={iconColor} />
              </View>

              {/* Content */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1a1a1a",
                      flex: 1,
                    }}
                  >
                    {notification.title}
                  </Text>
                  {!notification.isRead && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                        marginLeft: 8,
                      }}
                    />
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    color: "#666",
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                >
                  {notification.message}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {formatDate(notification.createdAt)}
                </Text>
              </View>

              {/* Delete button */}
              <Pressable
                onPress={() => handleDeleteNotification(notification.id)}
                style={{
                  padding: 8,
                  marginTop: -4,
                }}
              >
                <Ionicons name="close" size={18} color="#999" />
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
