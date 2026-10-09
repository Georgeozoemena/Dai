import { getDatabase } from "./database";
import type { Notification } from "../../types/notification";

export const notificationRepository = {
  async createNotification(notification: Notification): Promise<void> {
    const db = await getDatabase();
    await db.add("notifications", notification);
  },

  async getNotificationsByAccountId(accountId: string): Promise<Notification[]> {
    const db = await getDatabase();
    const tx = db.transaction("notifications", "readonly");
    const index = tx.store.index("accountId");
    const notifications = await index.getAll(accountId);

    // Sort by createdAt descending
    return notifications
      .sort((a, b) => {
        const dateA = new Date(a.createdAt as string).getTime();
        const dateB = new Date(b.createdAt as string).getTime();
        return dateB - dateA;
      })
      .map((n) => n as unknown as Notification);
  },

  async getUnreadNotificationsByAccountId(accountId: string): Promise<Notification[]> {
    const db = await getDatabase();
    const tx = db.transaction("notifications", "readonly");
    const index = tx.store.index("accountId");
    const notifications = await index.getAll(accountId);

    // Filter unread and sort by createdAt descending
    return notifications
      .filter((n) => !n.isRead)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt as string).getTime();
        const dateB = new Date(b.createdAt as string).getTime();
        return dateB - dateA;
      })
      .map((n) => n as unknown as Notification);
  },

  async markAsRead(notificationId: string): Promise<void> {
    const db = await getDatabase();
    const notification = await db.get("notifications", notificationId);
    
    if (notification) {
      notification.isRead = true;
      await db.put("notifications", notification);
    }
  },

  async markAllAsRead(accountId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction("notifications", "readwrite");
    const index = tx.store.index("accountId");
    const notifications = await index.getAll(accountId);

    for (const notification of notifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        await tx.store.put(notification);
      }
    }

    await tx.done;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const db = await getDatabase();
    await db.delete("notifications", notificationId);
  },

  async deleteAllNotifications(accountId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction("notifications", "readwrite");
    const index = tx.store.index("accountId");
    const notifications = await index.getAll(accountId);

    for (const notification of notifications) {
      await tx.store.delete(notification.id as string);
    }

    await tx.done;
  },

  async getUnreadCount(accountId: string): Promise<number> {
    const db = await getDatabase();
    const tx = db.transaction("notifications", "readonly");
    const index = tx.store.index("accountId");
    const notifications = await index.getAll(accountId);

    return notifications.filter((n) => !n.isRead).length;
  },
};
