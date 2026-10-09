import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerForPushNotifications, setBadgeCount } from '../services/pushNotificationService';
import { useNotificationStore } from '../../../store/notification/notificationStore';

/**
 * Hook to manage push notifications
 * - Requests permissions
 * - Handles notification taps
 * - Updates badge count
 */
export function usePushNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    // Skip push notification setup on web
    if (Platform.OS === 'web') {
      return;
    }

    // Register for push notifications
    registerForPushNotifications().then(token => {
      if (token) {
        console.log('Push notification token obtained:', token);
        // TODO: Send token to your backend to enable remote push notifications
      }
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // The notification will be displayed automatically due to setNotificationHandler config
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification action type
      if (data.actionType && data.actionId) {
        switch (data.actionType) {
          case 'budget':
            router.push('/budget-dashboard');
            break;
          case 'goal':
            router.push(`/goal/${data.actionId}`);
            break;
          case 'transaction':
            router.push(`/transaction/${data.actionId}`);
            break;
          case 'account':
            router.push('/(tabs)/accounts');
            break;
          default:
            router.push('/notifications');
        }
      } else {
        // Default: go to notifications screen
        router.push('/notifications');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Update badge count when unread count changes
  useEffect(() => {
    // Skip badge count on web
    if (Platform.OS === 'web') {
      return;
    }

    setBadgeCount(unreadCount).catch(error => {
      console.error('Failed to update badge count:', error);
    });
  }, [unreadCount]);
}
