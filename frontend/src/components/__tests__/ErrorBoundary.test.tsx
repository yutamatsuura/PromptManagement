/**
 * ErrorBoundary テスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// エラーをスローするコンポーネント
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('テストエラー');
  }
  return <div>正常なコンポーネント</div>;
}

describe('ErrorBoundary', () => {
  // console.errorのモック（エラー表示を抑制）
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('エラーが発生しない場合、子コンポーネントを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument();
  });

  it('エラーが発生した場合、フォールバックUIを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/予期しないエラーが発生しました/)).toBeInTheDocument();
  });

  it('ページをリロードボタンが表示される', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('ページをリロード');
    expect(reloadButton).toBeInTheDocument();
  });
});
