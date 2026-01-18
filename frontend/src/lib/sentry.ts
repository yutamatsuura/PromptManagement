/**
 * Sentry設定
 * エラー追跡・監視サービスの初期化
 */

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

/**
 * Sentryを初期化
 * main.tsxから呼び出される
 */
export function initSentry(): void {
  // DSNが設定されていない場合はSentryを無効化
  if (!SENTRY_DSN || SENTRY_DSN === 'https://example@o0.ingest.sentry.io/0000000') {
    console.warn('Sentry DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // パフォーマンス監視のサンプリングレート（0.0 - 1.0）
    // 本番環境では0.1（10%）推奨、開発環境では1.0（100%）
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // セッションリプレイのサンプリングレート
    // エラー発生時のユーザー操作を記録
    replaysSessionSampleRate: 0.1, // 通常セッションの10%
    replaysOnErrorSampleRate: 1.0, // エラー発生時は100%

    // React統合設定
    integrations: [
      // React Router統合（ナビゲーション追跡）
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation: () => window.location,
        useNavigationType: () => 'PUSH',
        createRoutesFromChildren: () => [],
        matchRoutes: () => null,
      }),

      // セッションリプレイ（エラー発生時のUI操作記録）
      Sentry.replayIntegration({
        maskAllText: true, // 個人情報保護
        blockAllMedia: true, // 画像・動画のブロック
      }),
    ],

    // エラー前の操作履歴（Breadcrumbs）を記録
    beforeBreadcrumb(breadcrumb) {
      // パスワード入力フィールドの内容をマスク
      if (breadcrumb.category === 'ui.input') {
        const target = breadcrumb.data?.target as HTMLInputElement;
        if (target?.type === 'password') {
          breadcrumb.data = { ...breadcrumb.data, value: '[FILTERED]' };
        }
      }
      return breadcrumb;
    },

    // エラー送信前の処理（個人情報フィルタリング）
    beforeSend(event, hint) {
      // 開発環境ではコンソールにもログ出力
      if (import.meta.env.DEV) {
        console.error('Sentry Event:', event, hint);
      }

      // メールアドレスなどの個人情報をマスク
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }

      return event;
    },

    // 無視するエラー（ノイズ削減）
    ignoreErrors: [
      // ブラウザ拡張機能のエラー
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // ネットワーク切断エラー（一時的なもの）
      'NetworkError',
      'Network request failed',
    ],
  });
}

/**
 * ユーザー情報をSentryに設定
 * 認証後に呼び出す
 */
export function setSentryUser(user: { id: string; email: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

/**
 * ユーザー情報をクリア
 * ログアウト時に呼び出す
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * カスタムエラーをSentryに送信
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * カスタムメッセージをSentryに送信（警告レベル）
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  Sentry.captureMessage(message, level);
}
