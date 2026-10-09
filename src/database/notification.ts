import { notificationRepository } from "./repositories/notificationRepository";
import type { Notification } from "../types/notification";

export const createNotification = async (notification: Notification): Promise<void> => {
  return notificationRepository.createNotification(notification);
};

export const getNotificationsByAccountId = async (accountId: string): Promise<Notification[]> => {
  return notificationRepository.getNotificationsByAccountId(accountId);
};

export const getUnreadNotificationsByAccountId = async (accountId: string): Promise<Notification[]> => {
  return notificationRepository.getUnreadNotificationsByAccountId(accountId);
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  return notificationRepository.markAsRead(notificationId);
};

export const markAllNotificationsAsRead = async (accountId: string): Promise<void> => {
  return notificationRepository.markAllAsRead(accountId);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  return notificationRepository.deleteNotification(notificationId);
};

export const deleteAllNotifications = async (accountId: string): Promise<void> => {
  return notificationRepository.deleteAllNotifications(accountId);
};

export const getUnreadNotificationCount = async (accountId: string): Promise<number> => {
  return notificationRepository.getUnreadCount(accountId);
};
