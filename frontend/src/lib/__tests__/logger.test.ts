/**
 * logger テスト
 * 注意: Viteテスト環境では常にdevelopmentモードで実行されるため、
 * 本番環境のテストは省略し、基本的な動作のみ検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('warnメッセージをコンソールに出力する', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('警告メッセージ');

    expect(consoleSpy).toHaveBeenCalledWith('[WARN]', '警告メッセージ');
  });

  it('errorメッセージをコンソールに出力する', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('エラーメッセージ', { detail: 'error' });

    expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'エラーメッセージ', { detail: 'error' });
  });

  it('複数の引数を渡せる', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('エラー', 'arg1', 'arg2', { key: 'value' });

    expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'エラー', 'arg1', 'arg2', { key: 'value' });
  });
});
