/**
 * notificationStore テスト
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificationStore } from '../notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useNotificationStore.getState().clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態では通知が空である', () => {
    const { notifications } = useNotificationStore.getState();
    expect(notifications).toEqual([]);
  });

  it('showNotificationで通知を追加できる', () => {
    const { showNotification } = useNotificationStore.getState();

    showNotification('テストメッセージ', 'success', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toBe('テストメッセージ');
    expect(notifications[0].type).toBe('success');
  });

  it('showSuccessで成功通知を追加できる', () => {
    const { showSuccess } = useNotificationStore.getState();

    showSuccess('成功しました', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('success');
    expect(notifications[0].message).toBe('成功しました');
  });

  it('showErrorでエラー通知を追加できる', () => {
    const { showError } = useNotificationStore.getState();

    showError('エラーが発生しました', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('error');
  });

  it('showWarningで警告通知を追加できる', () => {
    const { showWarning } = useNotificationStore.getState();

    showWarning('警告メッセージ', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('warning');
  });

  it('showInfoで情報通知を追加できる', () => {
    const { showInfo } = useNotificationStore.getState();

    showInfo('情報メッセージ', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('info');
  });

  it('複数の通知を追加できる', () => {
    const { showSuccess, showError } = useNotificationStore.getState();

    showSuccess('成功1', 0);
    showError('エラー1', 0);
    showSuccess('成功2', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(3);
  });

  it('removeNotificationで特定の通知を削除できる', () => {
    const { showSuccess, removeNotification } = useNotificationStore.getState();

    showSuccess('テスト1', 0);
    showSuccess('テスト2', 0);

    const { notifications: beforeRemove } = useNotificationStore.getState();
    const firstId = beforeRemove[0].id;

    removeNotification(firstId);

    const { notifications: afterRemove } = useNotificationStore.getState();
    expect(afterRemove).toHaveLength(1);
    expect(afterRemove[0].message).toBe('テスト2');
  });

  it('clearAllで全ての通知を削除できる', () => {
    const { showSuccess, showError, clearAll } = useNotificationStore.getState();

    showSuccess('成功', 0);
    showError('エラー', 0);

    clearAll();

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toEqual([]);
  });

  it('duration指定で自動削除される', () => {
    const { showNotification } = useNotificationStore.getState();

    showNotification('自動削除テスト', 'info', 1000);

    const { notifications: before } = useNotificationStore.getState();
    expect(before).toHaveLength(1);

    // 1000ms経過
    vi.advanceTimersByTime(1000);

    const { notifications: after } = useNotificationStore.getState();
    expect(after).toHaveLength(0);
  });

  it('duration=0の場合は自動削除されない', () => {
    const { showNotification } = useNotificationStore.getState();

    showNotification('手動削除テスト', 'info', 0);

    // 10000ms経過
    vi.advanceTimersByTime(10000);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
  });

  it('各通知にユニークなIDが付与される', () => {
    const { showSuccess } = useNotificationStore.getState();

    showSuccess('通知1', 0);
    showSuccess('通知2', 0);

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].id).not.toBe(notifications[1].id);
    expect(notifications[0].id).toMatch(/^notification-/);
    expect(notifications[1].id).toMatch(/^notification-/);
  });
});
