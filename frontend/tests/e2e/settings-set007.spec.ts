import { test, expect } from '@playwright/test';

// E2E-SET-007: アカウント削除確認ダイアログ - 削除ボタン → ダイアログ表示
test('E2E-SET-007: アカウント削除確認ダイアログ', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{type: string, text: string}> = [];
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text()
    };
    consoleLogs.push(logEntry);
    // エラーやwarningは即座にコンソールに出力
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    }
  });

  // ページエラーをキャッチ
  page.on('pageerror', (error) => {
    console.log('[PAGE ERROR]:', error.message);
    console.log('[STACK]:', error.stack);
  });

  // ネットワークログを収集
  const networkLogs: Array<{url: string, status: number, method: string}> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method()
    });
  });

  await test.step('ログイン実行（リトライ機構付き）', async () => {
    // ログインページへ移動
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を確実に待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // ログインフォームの表示確認
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));
    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // ログイン情報を入力（CLAUDE.mdのテスト認証情報）
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンをクリック（リトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    // ネットワークエラー対策: リトライ機構
    let loginSuccess = false;
    for (let retry = 0; retry < 3; retry++) {
      try {
        await loginButton.click();
        await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
        loginSuccess = true;
        console.log(`[DEBUG] ログイン成功（${retry + 1}回目の試行）`);
        break;
      } catch (error) {
        if (retry < 2) {
          console.log(`[RETRY] ログイン失敗（${retry + 1}/3回目）、2秒後にリトライします`);
          await page.waitForTimeout(2000);
          // ページをリロードしてログインフォームを再表示
          await page.goto('http://localhost:3347/login', { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
          await emailField.first().fill('test@promptmanagement.local');
          await passwordField.first().fill('TestPass123!');
          const retryButton = page.getByRole('button', { name: 'ログイン' });
          await expect(retryButton).toBeVisible({ timeout: 10000 });
        } else {
          throw error;
        }
      }
    }

    expect(loginSuccess).toBe(true);
  });

  await test.step('設定ページ（/settings）へ移動', async () => {
    // 設定ページへ移動
    await page.goto('http://localhost:3347/settings', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // ページがsettingsであることを確認
    await page.waitForURL('**/settings', { timeout: 10000 });
    expect(page.url()).toContain('/settings');
    console.log('[DEBUG] 設定ページへ移動完了');
  });

  await test.step('統計情報の読み込み完了を待つ', async () => {
    // 統計データの読み込み完了を待つ（CircularProgressが非表示になるまで）
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 }).catch(() => {
      console.log('[DEBUG] CircularProgressが見つからない（すでにロード完了）');
    });
    console.log('[DEBUG] 統計情報の読み込み完了');
  });

  await test.step('アカウント削除ボタンの存在確認', async () => {
    // アカウント削除ボタンを探す（error色のcontainedボタン）
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] アカウント削除ボタンを確認');
  });

  await test.step('アカウント削除ボタンクリック → 確認ダイアログ表示', async () => {
    // アカウント削除ボタンをクリック
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/i });
    await deleteButton.click();
    console.log('[DEBUG] アカウント削除ボタンをクリック');

    // ダイアログが表示されるまで待つ
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 確認ダイアログが表示された');
  });

  await test.step('ダイアログのタイトルとメッセージを確認', async () => {
    // ダイアログタイトル「アカウント削除の確認」を確認
    const dialogTitle = page.getByText('アカウント削除の確認');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ダイアログタイトルを確認');

    // メッセージ「この操作は取り消せません。本当にアカウントを削除しますか？」を確認
    const message1 = page.getByText(/この操作は取り消せません/);
    await expect(message1).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 警告メッセージを確認');

    // メッセージ「「削除」と入力して確認してください。」を確認
    const message2 = page.getByText(/「削除」と入力して確認してください/);
    await expect(message2).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 確認指示メッセージを確認');
  });

  await test.step('確認用テキストフィールドとボタンの存在確認', async () => {
    // 確認用テキストフィールドを確認
    const confirmField = page.locator('input[placeholder="削除"]');
    await expect(confirmField).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 確認用テキストフィールドを確認');

    // キャンセルボタンを確認
    const cancelButton = page.getByRole('button', { name: 'キャンセル' });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] キャンセルボタンを確認');

    // 削除ボタンを確認（error色、disabled状態）
    const deleteDialogButton = page.getByRole('button', { name: '削除' }).last();
    await expect(deleteDialogButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 削除ボタンを確認');

    // 初期状態では削除ボタンがdisabledであることを確認
    const isDisabled = await deleteDialogButton.isDisabled();
    expect(isDisabled).toBe(true);
    console.log('[DEBUG] 削除ボタンが初期状態でdisabledであることを確認');
  });

  await test.step('ダイアログを閉じる（キャンセル）', async () => {
    // キャンセルボタンをクリック
    const cancelButton = page.getByRole('button', { name: 'キャンセル' });
    await cancelButton.click();
    console.log('[DEBUG] キャンセルボタンをクリック');

    // ダイアログが閉じるまで待つ
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ダイアログが閉じた');
  });

  // テスト終了時にログを出力（失敗時のデバッグ用）
  test.info().attach('console-logs', {
    body: JSON.stringify(consoleLogs, null, 2),
    contentType: 'application/json',
  });

  test.info().attach('network-logs', {
    body: JSON.stringify(networkLogs, null, 2),
    contentType: 'application/json',
  });
});
