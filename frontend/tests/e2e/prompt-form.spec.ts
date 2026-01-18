import { test, expect } from '@playwright/test';

// E2E-FORM-001: 新規作成ページアクセス - /prompt/new → フォーム表示
test('E2E-FORM-001: 新規作成ページアクセス', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  await test.step('新規作成ページアクセス', async () => {
    // /prompt/new にアクセス
    await page.goto('http://localhost:3347/prompt/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // URLが /prompt/new であることを確認
    expect(page.url()).toBe('http://localhost:3347/prompt/new');
  });

  await test.step('フォーム表示確認', async () => {
    // フォーム要素の表示確認
    // タイトル入力フィールド
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });

    // プロンプト本文入力フィールド
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );
    await expect(contentField.first()).toBeVisible({ timeout: 10000 });

    // タグ入力フィールド
    const tagField = page.locator('input[name="tags"]').or(
      page.locator('input[placeholder*="タグを入力"]')
    );
    await expect(tagField.first()).toBeVisible({ timeout: 10000 });

    // お気に入りスイッチ
    const favoriteSwitch = page.locator('.MuiSwitch-input').or(
      page.getByLabel(/お気に入り/)
    );
    await expect(favoriteSwitch.first()).toBeVisible({ timeout: 10000 });

    // 保存ボタン
    const saveButton = page.getByRole('button', { name: /保存/ });
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    // キャンセルボタン
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
  });
});

// E2E-FORM-002: プロンプト新規作成フロー - 入力 → タグ追加 → お気に入り → 保存 → 一覧遷移
test('E2E-FORM-002: プロンプト新規作成フロー', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 重要: 古い認証セッションをクリアして、確実に新しいセッションを使用
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // ページをリロードして、クリーンな状態でログインフォームを表示
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  await test.step('新規作成ページアクセス', async () => {
    // /prompt/new にアクセス
    await page.goto('http://localhost:3347/prompt/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // URLが /prompt/new であることを確認
    expect(page.url()).toBe('http://localhost:3347/prompt/new');
  });

  // テスト用のユニークなデータを作成
  const timestamp = Date.now();
  const testTitle = `E2Eテスト_${timestamp}`;
  const testDescription = `テスト説明_${timestamp}`;
  const testContent = `テストプロンプト内容_${timestamp}`;
  const testTags = ['テストタグ1', 'テストタグ2'];

  await test.step('タイトル入力', async () => {
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });
    await titleField.first().fill(testTitle);
  });

  await test.step('説明入力', async () => {
    const descriptionField = page.locator('textarea[name="description"]').or(
      page.locator('textarea[placeholder*="説明"]')
    );
    // 説明フィールドは任意項目の可能性があるため、存在する場合のみ入力
    const isDescriptionVisible = await descriptionField.first().isVisible().catch(() => false);
    if (isDescriptionVisible) {
      await descriptionField.first().fill(testDescription);
    }
  });

  await test.step('プロンプト本文入力', async () => {
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );
    await expect(contentField.first()).toBeVisible({ timeout: 10000 });
    await contentField.first().fill(testContent);
  });

  await test.step('タグ追加', async () => {
    // タグ入力フィールドを取得
    const tagField = page.locator('input[name="tags"]').or(
      page.locator('input[placeholder*="タグを入力"]')
    );
    await expect(tagField.first()).toBeVisible({ timeout: 10000 });

    // タグを1つずつ追加
    for (const tag of testTags) {
      await tagField.first().fill(tag);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300); // タグ追加後の処理を待つ
    }
  });

  await test.step('お気に入りON', async () => {
    // お気に入りスイッチをクリック
    const favoriteSwitch = page.locator('.MuiSwitch-input').or(
      page.getByLabel(/お気に入り/)
    );
    await expect(favoriteSwitch.first()).toBeVisible({ timeout: 10000 });
    await favoriteSwitch.first().click();
  });

  await test.step('保存実行', async () => {
    const saveButton = page.getByRole('button', { name: /保存/ });
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await saveButton.click();
  });

  await test.step('一覧ページ遷移確認', async () => {
    // 保存後に一覧ページへリダイレクトされることを確認
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
    expect(page.url()).toBe('http://localhost:3347/');

    // 重要: Reactのステート管理やキャッシュの影響を排除するため、ページをリロード
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  });

  await test.step('作成したプロンプトが一覧に表示されることを確認', async () => {
    // 重要: ページ遷移後にデータ再読み込みが確実に行われるよう、少し待つ
    await page.waitForTimeout(1000);

    // データ読み込み完了を待つ（"Loading..." が表示されない状態を確認）
    // ページ遷移直後は既にloadingがfalseの可能性があるため、存在確認のみ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // テーブルが表示されるまで待つ
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // 重要: テーブル内に少なくとも1行以上のデータ行があることを確認
    // （ヘッダー行を除く）
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });

    // デバッグ: 一覧に表示されている全タイトルを取得
    console.log('[DEBUG] 探しているタイトル:', testTitle);
    const allTitles = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    console.log('[DEBUG] 一覧に表示されているタイトル:', allTitles);
    console.log('[DEBUG] 件数:', allTitles.length);

    // デバッグ: ネットワークログを確認（Supabase APIリクエストのみ）
    const supabaseRequests = networkLogs.filter(log => log.url.includes('supabase.co'));
    console.log('[DEBUG] Supabase APIリクエスト:');
    supabaseRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url} - Status: ${req.status}`);
    });

    // 作成したプロンプトのタイトルが一覧に表示されることを確認
    const createdPrompt = page.getByText(testTitle);
    await expect(createdPrompt).toBeVisible({ timeout: 10000 });
  });
});

// E2E-FORM-003: 編集ページアクセス・データ表示 - 編集ボタン → 既存データ表示
test('E2E-FORM-003: 編集ページアクセス・データ表示', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  let originalTitle = '';
  let originalDescription = '';
  let originalContent = '';
  let originalTags: string[] = [];
  let originalIsFavorite = false;
  let editUrl = '';

  await test.step('一覧ページで最初のプロンプトの編集ボタンをクリック', async () => {
    // 一覧ページでデータ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // テーブルが表示されるまで待つ
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // テーブル内に少なくとも1行以上のデータ行があることを確認
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });

    // デバッグ: 一覧に表示されているデータを取得
    const rowCount = await dataRows.count();
    console.log('[DEBUG] 一覧の行数:', rowCount);

    // 最初の行のデータを取得
    const firstRow = dataRows.first();
    originalTitle = await firstRow.locator('td').nth(1).textContent() || '';
    originalContent = await firstRow.locator('td').nth(2).textContent() || '';

    // タグは一覧ページで Chip として表示されている可能性があるため、個別に取得
    const tagChips = firstRow.locator('td').nth(3).locator('.MuiChip-label');
    const tagCount = await tagChips.count();
    originalTags = [];
    for (let i = 0; i < tagCount; i++) {
      const tagText = await tagChips.nth(i).textContent() || '';
      if (tagText.trim()) {
        originalTags.push(tagText.trim());
      }
    }

    console.log('[DEBUG] 元のタイトル:', originalTitle);
    console.log('[DEBUG] 元のプロンプト:', originalContent);
    console.log('[DEBUG] 元のタグ:', originalTags);

    // 編集ボタンをクリック
    const editButton = firstRow.getByRole('button', { name: /編集/ });
    await expect(editButton).toBeVisible({ timeout: 10000 });

    console.log('[DEBUG] クリック前のURL:', page.url());
    await editButton.click();

    // URLの変化を待つ（waitForURL の前に現在のURLを確認）
    await page.waitForTimeout(2000);
    console.log('[DEBUG] クリック後のURL:', page.url());

    // 編集ページへの遷移を待つ（実際のURL形式: /prompts/edit/:id）
    await page.waitForURL(/\/prompts\/edit\/[a-f0-9-]+/, { timeout: 15000 });

    editUrl = page.url();
    console.log('[DEBUG] 編集ページURL:', editUrl);

    // URLが /prompts/edit/:id の形式であることを確認
    expect(editUrl).toMatch(/\/prompts\/edit\/[a-f0-9-]+/);
  });

  await test.step('編集ページで既存データが表示されることを確認', async () => {
    // ページ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // タイトルフィールドの値を確認
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });
    const displayedTitle = await titleField.first().inputValue();
    console.log('[DEBUG] 表示されているタイトル:', displayedTitle);
    expect(displayedTitle).toBe(originalTitle);

    // プロンプト本文フィールドの値を確認
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );
    await expect(contentField.first()).toBeVisible({ timeout: 10000 });
    const displayedContent = await contentField.first().inputValue();
    console.log('[DEBUG] 表示されているプロンプト本文:', displayedContent);
    expect(displayedContent).toBe(originalContent);

    // タグが表示されていることを確認
    // エラーコンテキストから、タグは button として表示されていることが判明
    if (originalTags.length > 0) {
      for (const tag of originalTags) {
        const tagButton = page.getByRole('button', { name: tag });
        await expect(tagButton).toBeVisible({ timeout: 10000 });
        console.log('[DEBUG] タグが表示されている:', tag);
      }
    }

    // お気に入りスイッチの状態を確認
    const favoriteSwitch = page.locator('.MuiSwitch-input').or(
      page.getByLabel(/お気に入り/)
    );
    await expect(favoriteSwitch.first()).toBeVisible({ timeout: 10000 });

    // 保存ボタンとキャンセルボタンの表示を確認
    const saveButton = page.getByRole('button', { name: /保存/ });
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
  });
});

// E2E-FORM-004: プロンプト編集フロー - タイトル変更 → タグ削除 → 保存 → 変更反映確認
test('E2E-FORM-004: プロンプト編集フロー', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  let originalTitle = '';
  let originalTags: string[] = [];
  const newTitle = `編集済みタイトル_${Date.now()}`;

  await test.step('一覧ページで最初のプロンプトの編集ボタンをクリック', async () => {
    // 一覧ページでデータ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // テーブルが表示されるまで待つ
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // テーブル内に少なくとも1行以上のデータ行があることを確認
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });

    // 最初の行のデータを取得
    const firstRow = dataRows.first();
    originalTitle = await firstRow.locator('td').nth(1).textContent() || '';

    // タグは一覧ページで Chip として表示されている可能性があるため、個別に取得
    const tagChips = firstRow.locator('td').nth(3).locator('.MuiChip-label');
    const tagCount = await tagChips.count();
    originalTags = [];
    for (let i = 0; i < tagCount; i++) {
      const tagText = await tagChips.nth(i).textContent() || '';
      if (tagText.trim()) {
        originalTags.push(tagText.trim());
      }
    }

    console.log('[DEBUG] 元のタイトル:', originalTitle);
    console.log('[DEBUG] 元のタグ:', originalTags);

    // 編集ボタンをクリック
    const editButton = firstRow.getByRole('button', { name: /編集/ });
    await expect(editButton).toBeVisible({ timeout: 10000 });

    await editButton.click();

    // 編集ページへの遷移を待つ（実際のURL形式: /prompts/edit/:id）
    await page.waitForURL(/\/prompts\/edit\/[a-f0-9-]+/, { timeout: 15000 });
  });

  await test.step('タイトルを変更', async () => {
    // ページ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // タイトルフィールドの値を変更
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });

    // タイトルフィールドの値を完全に置き換える
    // Playwrightのfill()は自動的にクリア→入力を行い、Reactのイベントをトリガーする
    await titleField.first().fill('');
    await page.waitForTimeout(300);
    await titleField.first().fill(newTitle);

    // 入力後の値を確認
    const actualValue = await titleField.first().inputValue();
    console.log('[DEBUG] 新しいタイトル:', newTitle);
    console.log('[DEBUG] 実際に入力されたタイトル:', actualValue);

    // タイトルが正しく入力されたことを確認
    expect(actualValue).toBe(newTitle);
  });

  await test.step('タグを削除', async () => {
    // タグが存在する場合、最初のタグを削除
    if (originalTags.length > 0) {
      const tagToDelete = originalTags[0];
      console.log('[DEBUG] 削除するタグ:', tagToDelete);

      // タグボタンを見つける
      const tagButton = page.getByRole('button', { name: tagToDelete });
      await expect(tagButton).toBeVisible({ timeout: 10000 });

      // タグの削除ボタン（Chip内のcloseIcon）をクリック
      // MUI Chipの削除アイコンは .MuiChip-deleteIcon として表示される
      const deleteIcon = tagButton.locator('.MuiChip-deleteIcon').or(
        tagButton.locator('svg[data-testid="CancelIcon"]')
      );

      if (await deleteIcon.count() > 0) {
        await deleteIcon.first().click();
        await page.waitForTimeout(300); // タグ削除アニメーション完了を待つ
      } else {
        // deleteIconがない場合、タグボタン自体をクリックする（実装依存）
        console.log('[WARNING] タグ削除アイコンが見つからないため、タグボタンをクリックします');
        await tagButton.click();
        await page.waitForTimeout(300);
      }
    } else {
      console.log('[INFO] 削除するタグがありません（元データにタグが存在しない）');
    }
  });

  await test.step('保存実行', async () => {
    // 保存前にタイトルフィールドの値を再確認
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    const titleBeforeSave = await titleField.first().inputValue();
    console.log('[DEBUG] 保存前のタイトルフィールドの値:', titleBeforeSave);

    const saveButton = page.getByRole('button', { name: /保存/ });
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await saveButton.click();

    // 保存後に一覧ページへリダイレクトされることを確認
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
    expect(page.url()).toBe('http://localhost:3347/');

    // ページをリロードして最新データを取得
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  });

  await test.step('変更が反映されていることを確認', async () => {
    // データ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // テーブルが表示されるまで待つ
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // デバッグ: 一覧に表示されている全タイトルを取得
    console.log('[DEBUG] 変更後に探しているタイトル:', newTitle);
    const allTitles = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    console.log('[DEBUG] 一覧に表示されているタイトル:', allTitles);

    // 変更したタイトルが一覧に表示されることを確認
    const updatedPrompt = page.getByText(newTitle);
    await expect(updatedPrompt).toBeVisible({ timeout: 10000 });

    // タグが削除されていることを確認（削除したタグが一覧に表示されない）
    if (originalTags.length > 0) {
      const deletedTag = originalTags[0];
      const tagInList = updatedPrompt.locator('..').locator('..').locator('.MuiChip-label', { hasText: deletedTag });

      // タグが削除されている場合、count() は 0 になる
      const deletedTagCount = await tagInList.count();
      console.log(`[DEBUG] 削除したタグ "${deletedTag}" の表示数:`, deletedTagCount);

      // 削除したタグが表示されていないことを確認
      expect(deletedTagCount).toBe(0);
    }
  });
});

// E2E-FORM-005: タグ追加・削除UI操作 - 入力 → Enter → Chip表示 → ×削除
test('E2E-FORM-005: タグ追加・削除UI操作', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  await test.step('新規作成ページアクセス', async () => {
    // /prompt/new にアクセス
    await page.goto('http://localhost:3347/prompt/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // URLが /prompt/new であることを確認
    expect(page.url()).toBe('http://localhost:3347/prompt/new');
  });

  const testTag1 = `TAG1_${Date.now()}`;
  const testTag2 = `TAG2_${Date.now()}`;

  await test.step('タグ入力フィールドでタグを追加 - Tag1', async () => {
    // タグ入力フィールドを取得
    const tagField = page.locator('input[name="tags"]').or(
      page.locator('input[placeholder*="タグを入力してください"]')
    );
    await expect(tagField.first()).toBeVisible({ timeout: 10000 });

    console.log('[DEBUG] Tag1を入力:', testTag1);

    // E2E-FORM-004のベストプラクティス: fill('') → fill(newValue)
    await tagField.first().fill('');
    await page.waitForTimeout(100);
    await tagField.first().fill(testTag1);

    // Enterキーで追加
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300); // タグ追加後の処理を待つ
  });

  await test.step('Chip表示確認 - Tag1', async () => {
    // E2E-FORM-003のベストプラクティス: タグはMUI Chipで表示される
    const tag1Chip = page.locator('.MuiChip-root').filter({ hasText: testTag1.toUpperCase() });
    await expect(tag1Chip).toBeVisible({ timeout: 5000 });

    // Chipのラベルテキストを確認
    const tag1Label = tag1Chip.locator('.MuiChip-label');
    await expect(tag1Label).toBeVisible({ timeout: 5000 });
    const labelText = await tag1Label.textContent();
    console.log('[DEBUG] Tag1 Chipのラベル:', labelText);
    expect(labelText).toBe(testTag1.toUpperCase()); // タグは大文字に変換される
  });

  await test.step('タグ入力フィールドでタグを追加 - Tag2', async () => {
    const tagField = page.locator('input[name="tags"]').or(
      page.locator('input[placeholder*="タグを入力してください"]')
    );

    console.log('[DEBUG] Tag2を入力:', testTag2);

    // fill('') → fill(newValue)
    await tagField.first().fill('');
    await page.waitForTimeout(100);
    await tagField.first().fill(testTag2);

    // Enterキーで追加
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  });

  await test.step('Chip表示確認 - Tag2', async () => {
    // Tag2のChip表示確認
    const tag2Chip = page.locator('.MuiChip-root').filter({ hasText: testTag2.toUpperCase() });
    await expect(tag2Chip).toBeVisible({ timeout: 5000 });

    // Chipのラベルテキストを確認
    const tag2Label = tag2Chip.locator('.MuiChip-label');
    await expect(tag2Label).toBeVisible({ timeout: 5000 });
    const labelText = await tag2Label.textContent();
    console.log('[DEBUG] Tag2 Chipのラベル:', labelText);
    expect(labelText).toBe(testTag2.toUpperCase());
  });

  await test.step('2つのChipが表示されていることを確認', async () => {
    // 全Chipを取得
    const allChips = page.locator('.MuiChip-root');
    const chipCount = await allChips.count();
    console.log('[DEBUG] 表示されているChipの数:', chipCount);
    expect(chipCount).toBe(2);
  });

  await test.step('Tag1のChipを×ボタンで削除', async () => {
    // E2E-FORM-003のベストプラクティス: MUI Chipの削除アイコンは .MuiChip-deleteIcon
    const tag1Chip = page.locator('.MuiChip-root').filter({ hasText: testTag1.toUpperCase() });
    await expect(tag1Chip).toBeVisible({ timeout: 5000 });

    // 削除アイコンをクリック
    const deleteIcon = tag1Chip.locator('.MuiChip-deleteIcon');
    await expect(deleteIcon).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] Tag1の削除ボタンをクリック');
    await deleteIcon.click();
    await page.waitForTimeout(300); // タグ削除アニメーション完了を待つ
  });

  await test.step('Tag1のChipが削除されたことを確認', async () => {
    // Tag1のChipが存在しないことを確認
    const tag1Chip = page.locator('.MuiChip-root').filter({ hasText: testTag1.toUpperCase() });
    await expect(tag1Chip).not.toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] Tag1のChipが削除されました');
  });

  await test.step('Tag2のChipがまだ表示されていることを確認', async () => {
    // Tag2のChipはまだ表示されている
    const tag2Chip = page.locator('.MuiChip-root').filter({ hasText: testTag2.toUpperCase() });
    await expect(tag2Chip).toBeVisible({ timeout: 5000 });

    // Chipの数を確認
    const allChips = page.locator('.MuiChip-root');
    const chipCount = await allChips.count();
    console.log('[DEBUG] 削除後のChipの数:', chipCount);
    expect(chipCount).toBe(1);
  });
});

// E2E-FORM-006: キャンセル動作 - 入力途中 → キャンセル → 一覧遷移 → 保存なし
test('E2E-FORM-006: キャンセル動作', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  await test.step('新規作成ページアクセス', async () => {
    // /prompt/new にアクセス
    await page.goto('http://localhost:3347/prompt/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // URLが /prompt/new であることを確認
    expect(page.url()).toBe('http://localhost:3347/prompt/new');
  });

  // テスト用のユニークなデータ（保存されないデータ）
  const timestamp = Date.now();
  const testTitle = `キャンセルテスト_${timestamp}`;
  const testContent = `これは保存されません_${timestamp}`;

  await test.step('タイトル入力', async () => {
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });
    await titleField.first().fill(testTitle);

    console.log('[DEBUG] タイトル入力完了:', testTitle);
  });

  await test.step('プロンプト本文入力', async () => {
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );
    await expect(contentField.first()).toBeVisible({ timeout: 10000 });
    await contentField.first().fill(testContent);

    console.log('[DEBUG] プロンプト本文入力完了:', testContent);
  });

  await test.step('キャンセルボタンクリック', async () => {
    // キャンセルボタンをクリック
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });

    console.log('[DEBUG] キャンセルボタンをクリック');
    await cancelButton.click();
  });

  await test.step('一覧ページ遷移確認', async () => {
    // キャンセル後に一覧ページへリダイレクトされることを確認
    await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
    expect(page.url()).toBe('http://localhost:3347/');

    console.log('[DEBUG] 一覧ページへのリダイレクト完了');
  });

  await test.step('データが保存されていないことを確認', async () => {
    // ページ読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // テーブルが表示されるまで待つ
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible({ timeout: 10000 });

    // デバッグ: 一覧に表示されている全タイトルを取得
    console.log('[DEBUG] 探しているタイトル（存在しないはず）:', testTitle);
    const allTitles = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    console.log('[DEBUG] 一覧に表示されているタイトル:', allTitles);

    // キャンセルしたプロンプトのタイトルが一覧に存在しないことを確認
    const cancelledPrompt = page.getByText(testTitle);
    await expect(cancelledPrompt).not.toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] キャンセルしたプロンプトが一覧に存在しないことを確認');
  });
});

// E2E-FORM-007: 文字数カウント表示 - 入力 → リアルタイム更新確認
test('E2E-FORM-007: 文字数カウント表示', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  await test.step('ログイン処理', async () => {
    // ベストプラクティスに基づくログイン処理
    await page.goto('http://localhost:3347/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Reactアプリのレンダリング完了を待つ
    await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

    // フォーム要素を取得
    const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

    await expect(emailField.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

    // 認証情報入力
    await emailField.first().fill('test@promptmanagement.local');
    await passwordField.first().fill('TestPass123!');

    // ログインボタンクリック（ネットワークエラー対策のリトライ機構付き）
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

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

    if (!loginSuccess) {
      throw new Error('ログインに失敗しました（3回試行）');
    }
  });

  await test.step('新規作成ページアクセス', async () => {
    // /prompt/new にアクセス
    await page.goto('http://localhost:3347/prompt/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // URLが /prompt/new であることを確認
    expect(page.url()).toBe('http://localhost:3347/prompt/new');
  });

  await test.step('タイトル文字数カウント - 初期表示確認', async () => {
    // タイトルフィールドを取得
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );
    await expect(titleField.first()).toBeVisible({ timeout: 10000 });

    // 初期状態の文字数カウントを確認（0 / 200）
    const titleCounter = page.getByText('0 / 200', { exact: true });
    await expect(titleCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] タイトル初期カウント: 0 / 200');
  });

  await test.step('タイトル文字数カウント - 入力後のリアルタイム更新', async () => {
    // タイトルフィールドに「テスト」（3文字）を入力
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );

    await titleField.first().fill('テスト');
    await page.waitForTimeout(300); // 状態更新を待つ

    // 文字数カウントが「3 / 200」に更新されることを確認
    const titleCounter = page.getByText('3 / 200', { exact: true });
    await expect(titleCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] タイトル入力後カウント: 3 / 200');
  });

  await test.step('タイトル文字数カウント - 追加入力での更新', async () => {
    // さらに「追加」（2文字）を追加入力
    const titleField = page.locator('input[name="title"]').or(
      page.locator('input[placeholder*="タイトル"]')
    );

    await titleField.first().fill('テスト追加');
    await page.waitForTimeout(300); // 状態更新を待つ

    // 文字数カウントが「5 / 200」に更新されることを確認
    const titleCounter = page.getByText('5 / 200', { exact: true });
    await expect(titleCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] タイトル追加入力後カウント: 5 / 200');
  });

  await test.step('プロンプト本文文字数カウント - 初期表示確認', async () => {
    // プロンプト本文フィールドを取得
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );
    await expect(contentField.first()).toBeVisible({ timeout: 10000 });

    // 初期状態の文字数カウントを確認（0 / 100000）
    const contentCounter = page.getByText('0 / 100000', { exact: true });
    await expect(contentCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] プロンプト本文初期カウント: 0 / 100000');
  });

  await test.step('プロンプト本文文字数カウント - 入力後のリアルタイム更新', async () => {
    // プロンプト本文フィールドに「これはテストです。」（9文字）を入力
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );

    await contentField.first().fill('これはテストです。');
    await page.waitForTimeout(300); // 状態更新を待つ

    // 文字数カウントが「9 / 100000」に更新されることを確認
    const contentCounter = page.getByText('9 / 100000', { exact: true });
    await expect(contentCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] プロンプト本文入力後カウント: 9 / 100000');
  });

  await test.step('プロンプト本文文字数カウント - 追加入力での更新', async () => {
    // さらに改行と「追加行です。」（6文字）を追加入力
    const contentField = page.locator('textarea[name="content"]').or(
      page.locator('textarea[placeholder*="プロンプト本文"]')
    );

    await contentField.first().fill('これはテストです。\n追加行です。');
    await page.waitForTimeout(300); // 状態更新を待つ

    // 文字数カウントが「16 / 100000」に更新されることを確認（改行は1文字）
    const contentCounter = page.getByText('16 / 100000', { exact: true });
    await expect(contentCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] プロンプト本文追加入力後カウント: 16 / 100000');
  });

  await test.step('両方のカウンターが独立して更新されることを確認', async () => {
    // タイトルのカウンターが維持されていることを確認
    const titleCounter = page.getByText('5 / 200', { exact: true });
    await expect(titleCounter).toBeVisible({ timeout: 5000 });

    // プロンプト本文のカウンターが維持されていることを確認
    const contentCounter = page.getByText('16 / 100000', { exact: true });
    await expect(contentCounter).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] 両方のカウンターが独立して正しく表示されています');
  });
});
