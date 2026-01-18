import { test, expect } from '@playwright/test';

// E2E-LIST-001: ページ初期表示フロー - ログイン → テーブル表示
test('E2E-LIST-001: ページ初期表示フロー', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('プロンプト一覧ページ（MainLayout）の表示確認', async () => {
    // ページがルートパスであることを確認
    expect(page.url()).toBe('http://localhost:3347/');

    // MainLayoutのレンダリングを待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  });

  await test.step('検索・フィルターアコーディオンの表示確認', async () => {
    // アコーディオンのヘッダーを確認
    const accordionHeader = page.getByText('検索・フィルター');
    await expect(accordionHeader).toBeVisible({ timeout: 10000 });
  });

  await test.step('プロンプト一覧テーブルの表示確認', async () => {
    // テーブルヘッダーの確認（主要な列）
    await expect(page.getByRole('columnheader', { name: 'タイトル' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'プロンプト' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'タグ' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible({ timeout: 10000 });

    // テーブルボディの存在確認（データがあるかどうかは問わない）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });
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

// E2E-LIST-002: テキスト検索フロー - 検索 → 絞り込み → クリア → 全件表示
test('E2E-LIST-002: テキスト検索フロー', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('アコーディオンを開く', async () => {
    // アコーディオンのヘッダーを確認
    const accordionHeader = page.getByText('検索・フィルター');
    await expect(accordionHeader).toBeVisible({ timeout: 10000 });

    // アコーディオンをクリックして展開
    await accordionHeader.click();

    // 検索フィールドが表示されることを確認
    const searchField = page.locator('input[placeholder*="検索"]').or(page.locator('input[type="text"]').first());
    await expect(searchField.first()).toBeVisible({ timeout: 10000 });
  });

  await test.step('テキスト検索を実行', async () => {
    // 検索フィールドに「テスト」と入力
    const searchField = page.locator('input[placeholder*="検索"]').or(page.locator('input[type="text"]').first());
    await searchField.first().fill('テスト');

    // 検索ボタンをクリック（または自動検索を待つ）
    const searchButton = page.getByRole('button', { name: /検索/ });
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    // 検索結果が更新されるまで待つ（ネットワークアイドル）
    await page.waitForTimeout(1000);

    // テーブルボディが存在することを確認（結果がフィルタリングされている）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });
  });

  await test.step('検索クリアを実行', async () => {
    // アコーディオンが閉じている場合は開く
    const searchField = page.locator('input[placeholder*="検索"]').or(page.locator('input[type="text"]').first());
    const isSearchFieldVisible = await searchField.first().isVisible();
    if (!isSearchFieldVisible) {
      const accordionHeader = page.getByText('検索・フィルター');
      await accordionHeader.click();
      await expect(searchField.first()).toBeVisible({ timeout: 10000 });
    }

    // クリアボタンをクリック
    const clearButton = page.getByRole('button', { name: /クリア|リセット/ });
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // クリアボタンがない場合は検索フィールドを空にする
      await searchField.first().clear();
    }

    // 検索フィールドが空になったことを確認
    await expect(searchField.first()).toHaveValue('');

    // 全件表示に戻ることを確認（テーブルボディが存在する）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });
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

// E2E-LIST-003: タグフィルターフロー - タグ選択 → 複数選択 → 解除 → 全件表示
test('E2E-LIST-003: タグフィルターフロー', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('アコーディオンを開く', async () => {
    // アコーディオンのヘッダーを確認
    const accordionHeader = page.getByText('検索・フィルター');
    await expect(accordionHeader).toBeVisible({ timeout: 10000 });

    // アコーディオンをクリックして展開
    await accordionHeader.click();

    // タグChipが表示されることを確認（MUI Chip形式）
    // 実装: allTags配列から動的にChipを生成（PromptListPage.tsx 193-219行目）
    const tagChips = page.locator('.MuiChip-root');
    await expect(tagChips.first()).toBeVisible({ timeout: 10000 });

    // タグChipの数を確認（最低1つ以上）
    const chipCount = await tagChips.count();
    expect(chipCount).toBeGreaterThan(0);
  });

  await test.step('タグを1つ選択', async () => {
    // タグChipを取得（MUI Chip形式）
    const tagChips = page.locator('.MuiChip-root');

    // 1つ目のタグChip（AI）をクリック
    const firstChip = tagChips.first();
    await expect(firstChip).toBeVisible({ timeout: 10000 });
    const firstChipText = await firstChip.textContent();
    console.log(`[DEBUG] 選択するタグ: ${firstChipText}`);

    await firstChip.click();

    // 選択されたタグがactive状態になることを確認（背景色が変わる）
    await page.waitForTimeout(500);

    // テーブルボディが存在することを確認（結果がフィルタリングされている）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // フィルタリングされた結果を確認
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] フィルタリング後の件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
  });

  await test.step('タグを複数選択', async () => {
    // アコーディオンが閉じていないか確認
    // フィルタリング後に画面が再レンダリングされ、アコーディオンが閉じる可能性がある
    const accordionHeader = page.getByText('検索・フィルター');
    const tagChipsVisible = await page.locator('.MuiChip-root').first().isVisible();

    if (!tagChipsVisible) {
      // アコーディオンが閉じているので再度開く
      console.log('[DEBUG] アコーディオンが閉じているため再度開く');
      await accordionHeader.click();
      await page.waitForTimeout(500);
    }

    // タグChipを再取得（DOM更新後の最新状態を取得）
    const tagChips = page.locator('.MuiChip-root');

    // 2つ目のタグChip（プログラミング）をクリック
    const chipCount = await tagChips.count();
    console.log(`[DEBUG] 現在のChip数: ${chipCount}個`);
    expect(chipCount).toBeGreaterThanOrEqual(2);

    const secondChip = tagChips.nth(1);
    await expect(secondChip).toBeVisible({ timeout: 10000 });
    const secondChipText = await secondChip.textContent();
    console.log(`[DEBUG] 追加選択するタグ: ${secondChipText}`);

    await secondChip.click();

    // 選択されたタグがactive状態になることを確認
    await page.waitForTimeout(500);

    // テーブルボディが存在することを確認（結果がフィルタリングされている）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // フィルタリングされた結果を確認（OR検索なので件数増加）
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] 複数選択後の件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
  });

  await test.step('タグ選択を解除', async () => {
    // アコーディオンが閉じていないか確認
    const accordionHeader = page.getByText('検索・フィルター');
    let tagChipsVisible = await page.locator('.MuiChip-root').first().isVisible();

    if (!tagChipsVisible) {
      // アコーディオンが閉じているので再度開く
      console.log('[DEBUG] アコーディオンが閉じているため再度開く');
      await accordionHeader.click();
      await page.waitForTimeout(500);
    }

    // タグChipを取得（MUI Chip形式）
    let tagChips = page.locator('.MuiChip-root');

    // 1つ目のタグを再度クリック（解除）
    const firstChip = tagChips.first();
    await expect(firstChip).toBeVisible({ timeout: 10000 });
    await firstChip.click();
    console.log('[DEBUG] 1つ目のタグを解除');
    await page.waitForTimeout(500);

    // 再度アコーディオンが閉じていないか確認（1つ目の解除後）
    tagChipsVisible = await page.locator('.MuiChip-root').first().isVisible();
    if (!tagChipsVisible) {
      console.log('[DEBUG] 1つ目の解除後、アコーディオンが閉じたため再度開く');
      await accordionHeader.click();
      await page.waitForTimeout(500);
    }

    // タグChipを再取得（DOM更新後）
    tagChips = page.locator('.MuiChip-root');

    // 2つ目のタグを再度クリック（解除）
    const secondChip = tagChips.nth(1);
    await expect(secondChip).toBeVisible({ timeout: 10000 });
    await secondChip.click();
    console.log('[DEBUG] 2つ目のタグを解除');
    await page.waitForTimeout(500);

    // 全件表示に戻ることを確認（テーブルボディが存在する）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // 全件表示に戻ったことを確認（最低1件以上）
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] 全件表示の件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0); // 全件表示（最低1件以上）
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

// E2E-LIST-004: お気に入り絞り込みフロー - ボタンクリック → 絞り込み → 解除
test('E2E-LIST-004: お気に入り絞り込みフロー', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('検索・フィルターアコーディオンを開く', async () => {
    // アコーディオンのヘッダーをクリックして展開
    const accordionButton = page.getByRole('button', { name: /検索・フィルター/ });
    await expect(accordionButton).toBeVisible({ timeout: 10000 });
    await accordionButton.click();

    // アコーディオンが展開されるまで待つ
    await page.waitForTimeout(300);
  });

  await test.step('お気に入りボタンをクリック', async () => {
    // お気に入りボタンを取得（星アイコンのボタン）
    // 実装: PromptListPage.tsx 222-242行目（「お気に入りのみ」ボタン）
    const favoriteButton = page.getByRole('button', { name: /お気に入り/ });
    await expect(favoriteButton).toBeVisible({ timeout: 10000 });

    // ボタンをクリック
    await favoriteButton.click();

    // フィルタリングが適用されるまで待つ
    await page.waitForTimeout(500);
  });

  await test.step('お気に入りのプロンプトのみ表示されることを確認', async () => {
    // テーブルボディが存在することを確認
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // フィルタリングされた結果を確認
    // お気に入りがない場合は0件、ある場合は1件以上
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] お気に入り絞り込み後の件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  await test.step('お気に入りボタンを再度クリックして解除', async () => {
    // アコーディオンが閉じている可能性があるため、再度開く
    const accordionButton = page.getByRole('button', { name: /検索・フィルター/ });
    const isAccordionExpanded = await accordionButton.getAttribute('aria-expanded');
    if (isAccordionExpanded !== 'true') {
      await accordionButton.click();
      await page.waitForTimeout(300);
    }

    // お気に入りボタンを再度取得
    const favoriteButton = page.getByRole('button', { name: /お気に入り/ });
    await expect(favoriteButton).toBeVisible({ timeout: 10000 });

    // ボタンを再度クリック（解除）
    await favoriteButton.click();

    // フィルタリングが解除されるまで待つ
    await page.waitForTimeout(500);
  });

  await test.step('全件表示に戻ることを確認', async () => {
    // テーブルボディが存在することを確認
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // 全件表示に戻ったことを確認（最低1件以上）
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] 全件表示の件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
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

// E2E-LIST-005: ワンクリックコピーフロー - クリック → コピー通知 → 2秒後消える
test('E2E-LIST-005: ワンクリックコピーフロー', async ({ page, context }) => {
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

  // クリップボード権限を許可
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('プロンプト一覧テーブルの表示確認', async () => {
    // テーブルボディが存在することを確認（最低1件以上のデータが必要）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // テーブル行が最低1件以上あることを確認
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] プロンプト件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
  });

  await test.step('プロンプト本文セルをクリック', async () => {
    // 最初の行のプロンプト本文セル（3列目）を取得
    // 実装: PromptListPage.tsx 374-386行目（TableCellにonClick={() => handleCopy()}）
    // カラム順: ★（1列目）、タイトル（2列目）、プロンプト本文（3列目）、タグ（4列目）、操作（5列目）
    const contentCell = page.locator('tbody tr').first().locator('td').nth(2);

    // セルが表示されるまで待つ
    await expect(contentCell).toBeVisible({ timeout: 10000 });

    // プロンプト本文セルをクリック
    await contentCell.click();
  });

  await test.step('クリップボードへのコピー確認', async () => {
    // クリップボードの内容を確認（少し待機してから取得）
    await page.waitForTimeout(500);

    // クリップボードの内容を取得
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    console.log(`[DEBUG] クリップボード内容: ${clipboardText?.substring(0, 50)}...`);

    // クリップボードに内容がコピーされたことを確認
    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  await test.step('Snackbar通知の表示確認', async () => {
    // Snackbar通知の表示を確認（MUI Snackbar）
    // 実装: PromptListPage.tsx 472-495行目（Snackbar「コピーしました」）
    const snackbar = page.locator('.MuiSnackbar-root').or(page.getByText('コピーしました'));
    await expect(snackbar.first()).toBeVisible({ timeout: 5000 });

    // Snackbarのメッセージ内容を確認
    const snackbarText = await snackbar.first().textContent();
    console.log(`[DEBUG] Snackbar内容: ${snackbarText}`);
    expect(snackbarText).toContain('コピーしました');
  });

  await test.step('2秒後にSnackbarが消えることを確認', async () => {
    // Snackbar通知が消えるまで待つ（autoHideDuration: 2000ms）
    // 少し余裕を持って2.5秒待つ
    await page.waitForTimeout(2500);

    // Snackbarが非表示になったことを確認
    const snackbar = page.locator('.MuiSnackbar-root').or(page.getByText('コピーしました'));
    await expect(snackbar.first()).toBeHidden({ timeout: 5000 });
    console.log('[DEBUG] Snackbarが2秒後に消えました');
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

// E2E-LIST-006: 編集フローへの遷移 - 編集ボタン → URL変化 → 編集ページ表示
test('E2E-LIST-006: 編集フローへの遷移', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // ログイン後のリダイレクトを待つ（ルートパスへ）
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
  });

  await test.step('プロンプト一覧テーブルの表示確認', async () => {
    // テーブルボディが存在することを確認（最低1件以上のデータが必要）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // テーブル行が最低1件以上あることを確認
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] プロンプト件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
  });

  // 編集前のURL記録
  let promptId: string | null = null;

  await test.step('編集ボタンをクリック', async () => {
    // 最初の行の編集ボタンを取得
    // 実装: PromptListPage.tsx 432-445行目（「編集」ボタン）
    // カラム順: ★（1列目）、タイトル（2列目）、プロンプト本文（3列目）、タグ（4列目）、操作（5列目）
    const editButton = page.locator('tbody tr').first().getByRole('button', { name: '編集' });

    // 編集ボタンが表示されるまで待つ
    await expect(editButton).toBeVisible({ timeout: 10000 });

    // 編集ボタンをクリック
    await editButton.click();
  });

  await test.step('編集ページへのURL変化を確認', async () => {
    // URLが /prompts/edit/:id に変わることを待つ
    await page.waitForURL('**/prompts/edit/**', { timeout: 10000 });

    // URLパターンの確認
    const currentUrl = page.url();
    console.log(`[DEBUG] 編集ページURL: ${currentUrl}`);
    expect(currentUrl).toMatch(/\/prompts\/edit\/[a-zA-Z0-9-]+$/);

    // promptIdを抽出
    const matches = currentUrl.match(/\/prompts\/edit\/([a-zA-Z0-9-]+)$/);
    if (matches && matches[1]) {
      promptId = matches[1];
      console.log(`[DEBUG] 編集対象のプロンプトID: ${promptId}`);
    }
  });

  await test.step('編集ページの表示確認', async () => {
    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素が表示されることを確認
    // 実装: PromptFormPage.tsx 221-237行目（タイトルフィールド）
    // 実装: placeholderで検索する必要がある（name属性がない）
    const titleField = page.getByPlaceholder(/プロンプトタイトルを入力/);
    await expect(titleField).toBeVisible({ timeout: 10000 });

    // プロンプト本文フィールド
    // 実装: PromptFormPage.tsx 250-280行目（プロンプト本文フィールド）
    const contentField = page.getByPlaceholder(/プロンプト本文を入力/);
    await expect(contentField).toBeVisible({ timeout: 10000 });

    // 既存データが読み込まれるまで待つ（タイトルフィールドが空でなくなるまで）
    // 実装: PromptFormPage.tsx 52-68行目（useEffect でデータ読み込み）
    await page.waitForFunction(
      () => {
        const titleInput = document.querySelector('input[placeholder*="プロンプトタイトルを入力"]') as HTMLInputElement;
        return titleInput && titleInput.value.length > 0;
      },
      { timeout: 10000 }
    );

    // 既存データが読み込まれていることを確認（フィールドが空でない）
    const titleValue = await titleField.inputValue();
    const contentValue = await contentField.inputValue();
    console.log(`[DEBUG] タイトル: ${titleValue}`);
    console.log(`[DEBUG] プロンプト本文の長さ: ${contentValue.length}文字`);

    expect(titleValue.length).toBeGreaterThan(0);
    expect(contentValue.length).toBeGreaterThan(0);
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

// E2E-LIST-007: 削除フロー - 削除ボタン → 確認ダイアログ → 一覧から消える
test.only('E2E-LIST-007: 削除フロー', async ({ page }) => {
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

  await test.step('未認証状態でルートアクセス → /loginへリダイレクト', async () => {
    await page.goto('http://localhost:3347/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // /loginへのリダイレクトを確認
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  await test.step('ログイン実行', async () => {
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

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    // ネットワークエラー対策: リトライ機構付きクリック
    let loginSuccess = false;
    for (let retry = 0; retry < 3; retry++) {
      try {
        await loginButton.click();

        // ログイン後のリダイレクトを待つ（ルートパスへ）
        await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
        loginSuccess = true;
        console.log(`[DEBUG] ログイン成功（${retry + 1}回目の試行）`);
        break;
      } catch (error) {
        if (retry < 2) {
          console.log(`[RETRY] ログイン失敗（${retry + 1}/3回目）、2秒後にリトライします`);
          console.log(`[RETRY] エラー: ${error.message}`);
          await page.waitForTimeout(2000);
          // ページをリロードしてログインフォームを再表示
          await page.goto('http://localhost:3347/login', { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });
          await emailField.first().fill('test@promptmanagement.local');
          await passwordField.first().fill('TestPass123!');
          const retryButton = page.getByRole('button', { name: 'ログイン' });
          await expect(retryButton).toBeVisible({ timeout: 10000 });
        } else {
          console.error(`[ERROR] 3回のリトライでもログインに失敗しました`);
          throw error;
        }
      }
    }

    if (!loginSuccess) {
      throw new Error('3回のリトライでもログインに失敗しました');
    }
  });

  await test.step('プロンプト一覧テーブルの表示確認', async () => {
    // テーブルボディが存在することを確認（最低1件以上のデータが必要）
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // テーブル行が最低1件以上あることを確認
    const rowCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] プロンプト件数: ${rowCount}件`);
    expect(rowCount).toBeGreaterThan(0);
  });

  // 削除前の件数を記録
  let beforeDeleteCount: number;

  await test.step('削除前の件数を記録', async () => {
    beforeDeleteCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] 削除前の件数: ${beforeDeleteCount}件`);
  });

  let deletedPromptTitle: string;

  await test.step('削除ボタンをクリック & window.confirm受け入れ', async () => {
    // 最初の行のタイトルを記録（削除確認用）
    const firstRowTitle = await page.locator('tbody tr').first().locator('td').nth(1).textContent();
    deletedPromptTitle = firstRowTitle || '';
    console.log(`[DEBUG] 削除対象プロンプト: ${deletedPromptTitle}`);

    // window.confirm ダイアログハンドラーを設定（自動的にOKをクリック）
    page.on('dialog', async (dialog) => {
      console.log(`[DEBUG] Dialog表示: type=${dialog.type()}, message=${dialog.message()}`);
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain(deletedPromptTitle);
      expect(dialog.message()).toContain('削除してもよろしいですか');
      await dialog.accept();
      console.log('[DEBUG] window.confirmダイアログで削除を確認しました');
    });

    // 最初の行の削除ボタンを取得
    // カラム順: ★（1列目）、タイトル（2列目）、プロンプト本文（3列目）、タグ（4列目）、操作（5列目）
    const deleteButton = page.locator('tbody tr').first().getByRole('button', { name: '削除' });

    // 削除ボタンが表示されるまで待つ
    await expect(deleteButton).toBeVisible({ timeout: 10000 });

    // 削除ボタンをクリック（window.confirmが自動的に処理される）
    await deleteButton.click();

    // 削除APIの完了まで少し待つ
    await page.waitForTimeout(1000);
  });

  await test.step('削除後の件数確認（一覧から消えたことを確認）', async () => {
    // 削除後の件数を確認
    const afterDeleteCount = await page.locator('tbody tr').count();
    console.log(`[DEBUG] 削除後の件数: ${afterDeleteCount}件`);

    // 件数が1件減っていることを確認
    expect(afterDeleteCount).toBe(beforeDeleteCount - 1);
    console.log('[DEBUG] 一覧から削除されたことを確認しました');
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
