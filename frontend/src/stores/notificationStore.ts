/**
 * 通知（Snackbar）グローバルストア
 * エラー・成功・警告メッセージの統一管理
 */

import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // ms（デフォルト: 6000）
}

interface NotificationState {
  notifications: Notification[];
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  showNotification: (message, type, duration = 6000) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      message,
      type,
      duration,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // 指定時間後に自動削除
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  showSuccess: (message, duration) => {
    useNotificationStore.getState().showNotification(message, 'success', duration);
  },

  showError: (message, duration) => {
    useNotificationStore.getState().showNotification(message, 'error', duration);
  },

  showWarning: (message, duration) => {
    useNotificationStore.getState().showNotification(message, 'warning', duration);
  },

  showInfo: (message, duration) => {
    useNotificationStore.getState().showNotification(message, 'info', duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));
