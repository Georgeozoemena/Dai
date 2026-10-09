import * as SQLite from "expo-sqlite";
import type { Notification } from "../../types/notification";

const db = SQLite.openDatabaseSync("denari.db");

export const notificationRepository = {
  async createNotification(notification: Notification): Promise<void> {
    await db.runAsync(
      `INSERT INTO notifications (
        id, account_id, type, title, message, is_read, action_type, action_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.accountId,
        notification.type,
        notification.title,
        notification.message,
        notification.isRead ? 1 : 0,
        notification.actionType ?? null,
        notification.actionId ?? null,
        notification.createdAt,
      ]
    );
  },

  async getNotificationsByAccountId(accountId: string): Promise<Notification[]> {
    const rows = await db.getAllAsync<{
      id: string;
      account_id: string;
      type: string;
      title: string;
      message: string;
      is_read: number;
      action_type: string | null;
      action_id: string | null;
      created_at: string;
    }>(
      "SELECT * FROM notifications WHERE account_id = ? ORDER BY created_at DESC",
      [accountId]
    );

    return rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      type: row.type as Notification["type"],
      title: row.title,
      message: row.message,
      isRead: row.is_read === 1,
      actionType: row.action_type as Notification["actionType"],
      actionId: row.action_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async getUnreadNotificationsByAccountId(accountId: string): Promise<Notification[]> {
    const rows = await db.getAllAsync<{
      id: string;
      account_id: string;
      type: string;
      title: string;
      message: string;
      is_read: number;
      action_type: string | null;
      action_id: string | null;
      created_at: string;
    }>(
      "SELECT * FROM notifications WHERE account_id = ? AND is_read = 0 ORDER BY created_at DESC",
      [accountId]
    );

    return rows.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      type: row.type as Notification["type"],
      title: row.title,
      message: row.message,
      isRead: row.is_read === 1,
      actionType: row.action_type as Notification["actionType"],
      actionId: row.action_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async markAsRead(notificationId: string): Promise<void> {
    await db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [notificationId]
    );
  },

  async markAllAsRead(accountId: string): Promise<void> {
    await db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE account_id = ?",
      [accountId]
    );
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await db.runAsync("DELETE FROM notifications WHERE id = ?", [notificationId]);
  },

  async deleteAllNotifications(accountId: string): Promise<void> {
    await db.runAsync("DELETE FROM notifications WHERE account_id = ?", [accountId]);
  },

  async getUnreadCount(accountId: string): Promise<number> {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM notifications WHERE account_id = ? AND is_read = 0",
      [accountId]
    );

    return result?.count ?? 0;
  },
};
