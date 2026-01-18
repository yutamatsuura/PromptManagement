import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from './lib/logger'
import { initSentry } from './lib/sentry'

// Sentry初期化（エラー追跡）
initSentry();

// グローバルエラーハンドリング: 未捕捉のPromise rejection
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise,
  });

  // Sentryへ送信（既に初期化済み）
  // Sentry.captureException()は自動的に呼び出されるため、手動送信は不要
});

// グローバルエラーハンドリング: 未捕捉のJavaScriptエラー
window.addEventListener('error', (event) => {
  logger.error('Global Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });

  // Sentryへ送信（既に初期化済み）
  // Sentry.captureException()は自動的に呼び出されるため、手動送信は不要
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
