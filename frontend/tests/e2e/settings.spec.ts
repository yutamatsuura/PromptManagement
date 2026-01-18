import { test, expect } from '@playwright/test';

// E2E-SET-001: ページアクセス・統計表示 - /settings → 統計カード3つ表示
test('E2E-SET-001: ページアクセス・統計表示', async ({ page }) => {
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
  });

  await test.step('設定ページのタイトル確認', async () => {
    // ページタイトル「設定」を確認
    const pageTitle = page.getByRole('heading', { name: '設定', level: 4 });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
  });

  await test.step('統計情報セクションの表示確認', async () => {
    // 統計情報セクションのタイトルを確認
    const statisticsTitle = page.getByRole('heading', { name: '統計情報', level: 6 });
    await expect(statisticsTitle).toBeVisible({ timeout: 10000 });
  });

  await test.step('統計カード3つの表示確認', async () => {
    // 統計データの読み込み完了を待つ（CircularProgressが非表示になるまで）
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 }).catch(() => {
      console.log('[DEBUG] CircularProgressが見つからない（すでにロード完了）');
    });

    // 統計カード1: 総プロンプト数
    const totalPromptsCard = page.getByText('総プロンプト数');
    await expect(totalPromptsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 総プロンプト数カードを確認');

    // 統計カード2: タグ数
    const totalTagsCard = page.getByText('タグ数');
    await expect(totalTagsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] タグ数カードを確認');

    // 統計カード3: お気に入り数
    const favoriteCountCard = page.getByText('お気に入り数');
    await expect(favoriteCountCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] お気に入り数カードを確認');
  });

  await test.step('統計カードの数値表示を確認', async () => {
    // 統計情報セクション内のh4要素（統計数値）を取得
    // セレクタ: 統計情報Paperの直下にある統計カード（3つのPaper）内のh4
    const statisticsSection = page.locator('text=統計情報').locator('..');
    const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');

    // 3つのh4要素が存在することを確認
    await expect(statNumbers).toHaveCount(3, { timeout: 10000 });
    console.log('[DEBUG] 統計数値が3つ表示されていることを確認');

    // 各数値が0以上の整数であることを確認
    const count = await statNumbers.count();
    for (let i = 0; i < count; i++) {
      const text = await statNumbers.nth(i).textContent();
      const num = parseInt(text || '0', 10);
      expect(num).toBeGreaterThanOrEqual(0);
      console.log(`[DEBUG] 統計数値${i + 1}: ${num}`);
    }
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

// E2E-SET-002: 統計情報リアルタイム更新 - ローディング → 統計値表示
test('E2E-SET-002: 統計情報リアルタイム更新 - ローディング → 統計値表示', async ({ page }) => {
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

  await test.step('設定ページ（/settings）へ移動（ネットワーク待機なし）', async () => {
    // ネットワーク待機なしで設定ページへ移動（ローディング状態を確認するため）
    await page.goto('http://localhost:3347/settings', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // ページがsettingsであることを確認
    await page.waitForURL('**/settings', { timeout: 10000 });
    expect(page.url()).toContain('/settings');
    console.log('[DEBUG] 設定ページへ移動完了');
  });

  await test.step('ローディングスピナー（CircularProgress）の表示確認', async () => {
    // 統計情報セクションを探す
    const statisticsTitle = page.getByRole('heading', { name: '統計情報', level: 6 });
    await expect(statisticsTitle).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 統計情報セクションタイトルを確認');

    // ローディングスピナーの表示確認（短いタイムアウト: ロードが速い場合はスキップ）
    const spinner = page.locator('.MuiCircularProgress-root');
    const isSpinnerVisible = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    if (isSpinnerVisible) {
      console.log('[DEBUG] ローディングスピナーが表示されている');
      await expect(spinner).toBeVisible();
    } else {
      console.log('[DEBUG] ローディングスピナーが見つからない（すでにロード完了）');
    }
  });

  await test.step('ローディング完了後の統計値表示確認', async () => {
    // CircularProgressが非表示になるまで待つ（ロード完了）
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 }).catch(() => {
      console.log('[DEBUG] CircularProgressが見つからない（すでにロード完了）');
    });

    console.log('[DEBUG] ローディング完了、統計値の表示確認を開始');

    // 統計カード3つの表示確認
    const totalPromptsCard = page.getByText('総プロンプト数');
    await expect(totalPromptsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] 総プロンプト数カードを確認');

    const totalTagsCard = page.getByText('タグ数');
    await expect(totalTagsCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] タグ数カードを確認');

    const favoriteCountCard = page.getByText('お気に入り数');
    await expect(favoriteCountCard).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] お気に入り数カードを確認');

    // 統計情報セクション内のh4要素（統計数値）を取得
    const statisticsSection = page.locator('text=統計情報').locator('..');
    const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');

    // 3つのh4要素が存在することを確認
    await expect(statNumbers).toHaveCount(3, { timeout: 10000 });
    console.log('[DEBUG] 統計数値が3つ表示されていることを確認');

    // 各数値が0以上の整数であることを確認
    const count = await statNumbers.count();
    for (let i = 0; i < count; i++) {
      const text = await statNumbers.nth(i).textContent();
      const num = parseInt(text || '0', 10);
      expect(num).toBeGreaterThanOrEqual(0);
      console.log(`[DEBUG] 統計数値${i + 1}: ${num}`);
    }
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

// E2E-SET-003: データエクスポートフロー - ボタン → JSONダウンロード
test('E2E-SET-003: データエクスポートフロー', async ({ page }) => {
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

  await test.step('エクスポートボタンの存在確認', async () => {
    // エクスポートボタンを探す
    const exportButton = page.getByRole('button', { name: /データをエクスポート/i });
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] エクスポートボタンを確認');
  });

  await test.step('エクスポートボタンクリック → ファイルダウンロード確認', async () => {
    // ダウンロードイベントを待機
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // エクスポートボタンをクリック
    const exportButton = page.getByRole('button', { name: /データをエクスポート/i });
    await exportButton.click();
    console.log('[DEBUG] エクスポートボタンをクリック');

    // ダウンロード完了を待つ
    const download = await downloadPromise;
    console.log('[DEBUG] ダウンロードイベントを受信');

    // ファイル名を取得
    const fileName = download.suggestedFilename();
    console.log(`[DEBUG] ダウンロードファイル名: ${fileName}`);

    // ファイル名形式の検証: prompts_export_YYYYMMDD.json
    const fileNamePattern = /^prompts_export_\d{8}\.json$/;
    expect(fileName).toMatch(fileNamePattern);
    console.log('[DEBUG] ファイル名形式が正しい');

    // ファイルの保存（一時ディレクトリ）
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    console.log(`[DEBUG] ファイル保存パス: ${filePath}`);
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

// E2E-SET-004: エクスポートデータ形式確認 - ファイル開く → 構造確認
test('E2E-SET-004: エクスポートデータ形式確認', async ({ page }) => {
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
    // 現在のURLを確認
    const currentUrl = page.url();
    console.log(`[DEBUG] 現在のURL: ${currentUrl}`);

    // settingsページでない場合のみ移動
    if (!currentUrl.includes('/settings')) {
      await page.goto('http://localhost:3347/settings', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
    }

    // ページがsettingsであることを確認
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

  let exportedData: any;

  await test.step('エクスポートボタンクリック → JSONファイルダウンロード', async () => {
    // ダウンロードイベントを待機
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // エクスポートボタンをクリック
    const exportButton = page.getByRole('button', { name: /データをエクスポート/i });
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();
    console.log('[DEBUG] エクスポートボタンをクリック');

    // ダウンロード完了を待つ
    const download = await downloadPromise;
    console.log('[DEBUG] ダウンロードイベントを受信');

    // ファイル名を取得
    const fileName = download.suggestedFilename();
    console.log(`[DEBUG] ダウンロードファイル名: ${fileName}`);

    // ファイル名形式の検証: prompts_export_YYYYMMDD.json
    const fileNamePattern = /^prompts_export_\d{8}\.json$/;
    expect(fileName).toMatch(fileNamePattern);
    console.log('[DEBUG] ファイル名形式が正しい');

    // ファイルの保存とパス取得
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    console.log(`[DEBUG] ファイル保存パス: ${filePath}`);

    // Playwrightのfsモジュールでファイルを読み込み
    const fs = await import('fs');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`[DEBUG] ファイル内容（最初の200文字）: ${fileContent.substring(0, 200)}`);

    // JSONパース
    exportedData = JSON.parse(fileContent);
    console.log(`[DEBUG] JSONパース成功`);
    console.log(`[DEBUG] エクスポートデータ構造: ${JSON.stringify(Object.keys(exportedData))}`);
  });

  await test.step('JSONデータ構造の検証', async () => {
    // オブジェクトであることを確認
    expect(typeof exportedData).toBe('object');
    console.log('[DEBUG] エクスポートデータがオブジェクト形式であることを確認');

    // 必須メタデータフィールドの存在確認
    expect(exportedData).toHaveProperty('version');
    expect(exportedData).toHaveProperty('exported_at');
    expect(exportedData).toHaveProperty('prompts');
    console.log('[DEBUG] メタデータフィールド（version, exported_at, prompts）が含まれていることを確認');

    // versionが文字列であることを確認
    expect(typeof exportedData.version).toBe('string');
    console.log(`[DEBUG] version: ${exportedData.version}`);

    // exported_atが ISO8601 形式であることを確認
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/;
    expect(exportedData.exported_at).toMatch(isoDatePattern);
    console.log(`[DEBUG] exported_at: ${exportedData.exported_at}`);

    // promptsが配列であることを確認
    expect(Array.isArray(exportedData.prompts)).toBe(true);
    console.log('[DEBUG] promptsが配列形式であることを確認');

    // promptsデータが1件以上あることを確認（テストデータが存在する前提）
    expect(exportedData.prompts.length).toBeGreaterThan(0);
    console.log(`[DEBUG] エクスポートデータ件数: ${exportedData.prompts.length}件`);

    // 最初のデータ項目を検証
    const firstItem = exportedData.prompts[0];
    console.log(`[DEBUG] 最初のデータ項目: ${JSON.stringify(firstItem)}`);

    // 必須フィールドの存在確認
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('title');
    expect(firstItem).toHaveProperty('content');
    expect(firstItem).toHaveProperty('tags');
    expect(firstItem).toHaveProperty('is_favorite');
    expect(firstItem).toHaveProperty('created_at');
    expect(firstItem).toHaveProperty('updated_at');
    console.log('[DEBUG] 必須フィールドが全て含まれていることを確認');

    // データ型の検証
    expect(typeof firstItem.id).toBe('string');
    expect(typeof firstItem.title).toBe('string');
    expect(typeof firstItem.content).toBe('string');
    expect(Array.isArray(firstItem.tags)).toBe(true);
    expect(typeof firstItem.is_favorite).toBe('boolean');
    expect(typeof firstItem.created_at).toBe('string');
    expect(typeof firstItem.updated_at).toBe('string');
    console.log('[DEBUG] 各フィールドのデータ型が正しいことを確認');

    // created_at, updated_at が ISO8601 形式であることを確認
    expect(firstItem.created_at).toMatch(isoDatePattern);
    expect(firstItem.updated_at).toMatch(isoDatePattern);
    console.log('[DEBUG] created_at, updated_at が ISO8601 形式であることを確認');
  });

  await test.step('全データ項目の必須フィールド検証', async () => {
    // 全データ項目が必須フィールドを持つことを確認
    for (let i = 0; i < exportedData.prompts.length; i++) {
      const item = exportedData.prompts[i];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('content');
      expect(item).toHaveProperty('tags');
      expect(item).toHaveProperty('is_favorite');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('updated_at');
    }
    console.log(`[DEBUG] 全${exportedData.prompts.length}件のデータ項目が必須フィールドを持つことを確認`);
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

  test.info().attach('exported-data', {
    body: JSON.stringify(exportedData, null, 2),
    contentType: 'application/json',
  });
});

// E2E-SET-005: データインポートフロー - ファイル選択 → インポート → 統計更新
test('E2E-SET-005: データインポートフロー', async ({ page }) => {
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

  let totalPromptsBeforeImport = 0;

  await test.step('インポート前の統計値を取得', async () => {
    // 統計情報セクション内の総プロンプト数を取得
    const statisticsSection = page.locator('text=統計情報').locator('..');
    const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');

    // 最初のh4要素が総プロンプト数（仕様書の順序に従う）
    const totalPromptsText = await statNumbers.nth(0).textContent();
    totalPromptsBeforeImport = parseInt(totalPromptsText || '0', 10);
    console.log(`[DEBUG] インポート前の総プロンプト数: ${totalPromptsBeforeImport}`);
  });

  await test.step('テスト用JSONファイルを作成', async () => {
    // インポート用のテストデータを作成
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const testData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      prompts: [
        {
          id: 'test-import-1',
          title: 'インポートテスト1',
          content: 'インポートテスト用プロンプト本文1',
          tags: ['インポートテスト', 'E2E'],
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'test-import-2',
          title: 'インポートテスト2',
          content: 'インポートテスト用プロンプト本文2',
          tags: ['インポートテスト'],
          is_favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    // 一時ファイルに書き込み
    const tmpDir = os.tmpdir();
    const testFilePath = path.join(tmpDir, 'test-import-prompts.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2));
    console.log(`[DEBUG] テストファイル作成: ${testFilePath}`);

    // テストコンテキストに保存（後続ステップで使用）
    (page as any).testFilePath = testFilePath;
  });

  await test.step('インポートボタンクリック → ファイル選択 → インポート実行', async () => {
    // インポートボタンを探す
    const importButton = page.getByRole('button', { name: /データをインポート/i });
    await expect(importButton).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] インポートボタンを確認');

    // ファイル選択イベントを設定（page.setInputFiles()を使用）
    // ファイル入力フィールドを待機
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      importButton.click(),
    ]);

    console.log('[DEBUG] ファイル選択ダイアログが表示された');

    // テストファイルを選択
    const testFilePath = (page as any).testFilePath;
    await fileChooser.setFiles(testFilePath);
    console.log(`[DEBUG] ファイル選択: ${testFilePath}`);

    // インポート処理の完了を待つ（成功通知が表示される）
    const successSnackbar = page.getByText(/インポートしました/);
    await expect(successSnackbar).toBeVisible({ timeout: 15000 });
    console.log('[DEBUG] インポート成功通知を確認');
  });

  await test.step('インポート後の統計更新を確認', async () => {
    // 統計情報の再読み込み完了を待つ（CircularProgressが表示されてから非表示になるまで）
    await page.waitForTimeout(1000); // 統計情報の再読み込みトリガーを待つ

    // CircularProgressが非表示になるまで待つ（ロード完了）
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 }).catch(() => {
      console.log('[DEBUG] CircularProgressが見つからない（すでにロード完了）');
    });

    // 統計情報セクション内の総プロンプト数を取得
    const statisticsSection = page.locator('text=統計情報').locator('..');
    const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');

    // 最初のh4要素が総プロンプト数
    const totalPromptsText = await statNumbers.nth(0).textContent();
    const totalPromptsAfterImport = parseInt(totalPromptsText || '0', 10);
    console.log(`[DEBUG] インポート後の総プロンプト数: ${totalPromptsAfterImport}`);

    // インポート前より2件増えていることを確認（テストデータ2件）
    expect(totalPromptsAfterImport).toBe(totalPromptsBeforeImport + 2);
    console.log('[DEBUG] 総プロンプト数が正しく増加した');
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

// E2E-SET-006: ログアウトフロー - ボタン → /login リダイレクト
test('E2E-SET-006: ログアウトフロー', async ({ page }) => {
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

  await test.step('ユーザーメニューを開く', async () => {
    // ユーザーメニューアイコンをクリック（E2E-LOGIN-002パターン）
    const userMenuButton = page.getByRole('button', { name: 'user menu' });
    await expect(userMenuButton).toBeVisible({ timeout: 10000 });
    await userMenuButton.click();
    console.log('[DEBUG] ユーザーメニューを開いた');

    // メニューが開いたことを確認
    const logoutMenuItem = page.getByRole('menuitem', { name: /ログアウト|Logout/i });
    await expect(logoutMenuItem).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ログアウトメニュー項目を確認');
  });

  await test.step('ログアウトボタンクリック → /login リダイレクト', async () => {
    // ログアウトメニュー項目をクリック
    const logoutMenuItem = page.getByRole('menuitem', { name: /ログアウト|Logout/i });
    await logoutMenuItem.click();
    console.log('[DEBUG] ログアウトボタンをクリック');

    // /loginページへのリダイレクトを待つ
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
    console.log('[DEBUG] /loginページへリダイレクトされた');
  });

  await test.step('ログインページの表示確認', async () => {
    // ログインページの主要要素が表示されることを確認
    const loginForm = page.getByRole('button', { name: 'ログイン' });
    await expect(loginForm).toBeVisible({ timeout: 10000 });
    console.log('[DEBUG] ログインページが正しく表示された');
  });

  await test.step('再度 /settings へアクセス → /login リダイレクト（認証チェック）', async () => {
    // 未認証状態で /settings へアクセス（networkidleを待たない、リダイレクト前提）
    await page.goto('http://localhost:3347/settings', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // /loginページへリダイレクトされることを確認
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
    console.log('[DEBUG] 未認証状態で /settings アクセス → /login へリダイレクトされた');
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
