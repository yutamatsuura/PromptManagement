import { test, expect } from '@playwright/test';

// E2E-SET-008: アカウント削除キャンセル - キャンセルボタン → ダイアログ閉じる
test('E2E-SET-008: アカウント削除キャンセル', async ({ page }) => {
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

    // ページがsettingsであることを確認（waitForURLはスキップ、URL確認のみ）
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

  await test.step('アカウント削除ボタンをクリック → ダイアログ表示', async () => {
    // アカウント削除ボタンを探す
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] アカウント削除ボタンを確認');

    // アカウント削除ボタンをクリック
    await deleteButton.click();
    console.log('[DEBUG] アカウント削除ボタンをクリック');

    // ダイアログが表示されるまで待つ
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 確認ダイアログが表示された');
  });

  await test.step('キャンセルボタンをクリック → ダイアログが閉じる', async () => {
    // キャンセルボタンを確認
    const cancelButton = page.getByRole('button', { name: 'キャンセル' });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] キャンセルボタンを確認');

    // キャンセルボタンをクリック
    await cancelButton.click();
    console.log('[DEBUG] キャンセルボタンをクリック');

    // ダイアログが閉じるまで待つ
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ダイアログが閉じた');
  });

  await test.step('設定ページに残っていることを確認', async () => {
    // URLが /settings のままであることを確認
    expect(page.url()).toContain('/settings');
    console.log('[DEBUG] 設定ページ（/settings）に残っている');

    // ページタイトル「設定」が表示されていることを確認
    const pageTitle = page.getByRole('heading', { name: '設定', level: 4 });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ページタイトル「設定」が表示されている');
  });

  await test.step('統計情報が変更されていないことを確認', async () => {
    // 統計情報セクションが引き続き表示されていることを確認
    const statisticsTitle = page.getByRole('heading', { name: '統計情報', level: 6 });
    await expect(statisticsTitle).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 統計情報セクションが表示されている');

    // 統計カード3つが表示されていることを確認
    const totalPromptsCard = page.getByText('総プロンプト数');
    await expect(totalPromptsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 総プロンプト数カードが表示されている');

    const totalTagsCard = page.getByText('タグ数');
    await expect(totalTagsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] タグ数カードが表示されている');

    const favoriteCountCard = page.getByText('お気に入り数');
    await expect(favoriteCountCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] お気に入り数カードが表示されている');
  });

  await test.step('アカウント削除ボタンが引き続き表示されていることを確認（削除されていない）', async () => {
    // アカウント削除ボタンが引き続き表示されていることを確認
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] アカウント削除ボタンが引き続き表示されている（アカウントは削除されていない）');
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
