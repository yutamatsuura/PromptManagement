/**
 * GlobalNotification テスト
 * 注意: UIコンポーネントの詳細なテストは統合テストで実施
 * ここでは基本的なレンダリングのみ検証
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import GlobalNotification from '../GlobalNotification';
import { useNotificationStore } from '../../stores/notificationStore';

describe('GlobalNotification', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearAll();
  });

  it('通知がない場合、何も表示されない', () => {
    const { container } = render(<GlobalNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('コンポーネントがエラーなくレンダリングできる', () => {
    const { container } = render(<GlobalNotification />);
    expect(container).toBeDefined();
  });
});
