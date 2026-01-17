/**
 * Vitest セットアップファイル
 * テスト実行前に一度だけ実行される
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
