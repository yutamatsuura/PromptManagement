# E2Eテストベストプラクティス

**プロジェクト名**: PromptManagement
**作成日時**: 2026-01-18
**目的**: E2Eテストで成功したパターンを蓄積し、後続テストの試行錯誤を削減

---

## サーバー起動

### 成功パターン
**パターン1: E2Eモード環境変数設定とサーバー再起動**
- テストID: E2E-LIST-001
- 実施日: 2026-01-18

```bash
# 1. E2Eモード有効化（Sentry無効化）
if grep -q "VITE_E2E_MODE" .env.local; then
  sed -i '' 's/VITE_E2E_MODE=.*/VITE_E2E_MODE=true/' .env.local
else
  echo "VITE_E2E_MODE=true" >> .env.local
fi

# 2. 既存サーバーを停止
lsof -ti :3347 | xargs kill -9 && sleep 2

# 3. フロントエンドを再起動（環境変数を読み込む）
cd frontend && npm run dev > /dev/null 2>&1 & sleep 3

# 4. 起動確認
lsof -i :3347 | grep -v PID
```

**重要**: 環境変数変更時はサーバー再起動が必須（ホットリロードでは反映されない）

### 失敗パターンと解決策
（まだありません）

---

## ページアクセス

### 成功パターン
**パターン1: ProtectedRoute経由の認証必須ページアクセス**
- テストID: E2E-LIST-001
- 実施日: 2026-01-18
- 対象: プロンプト一覧ページ（/）

```typescript
// 1. 未認証状態でルートアクセス
await page.goto('http://localhost:3347/', {
  waitUntil: 'networkidle',
  timeout: 30000,
});

// 2. /loginへのリダイレクトを待つ
await page.waitForURL('**/login', { timeout: 10000 });
expect(page.url()).toContain('/login');
```

**重要**: ProtectedRouteで保護されたページは、未認証時に自動的に /login へリダイレクトされる

### 失敗パターンと解決策
（まだありません）

---

## 認証処理

### 成功パターン
**パターン1: Supabase認証フロー（テストアカウント）**
- テストID: E2E-LIST-001
- 実施日: 2026-01-18
- 認証情報: CLAUDE.mdのテスト認証情報

```typescript
// 1. Reactアプリのレンダリング完了を待つ
await page.waitForSelector('#root', { state: 'attached', timeout: 10000 });

// 2. フォーム要素を取得（or()で複数候補対応）
const emailField = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
const passwordField = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));

// 3. 表示確認
await expect(emailField.first()).toBeVisible({ timeout: 10000 });
await expect(passwordField.first()).toBeVisible({ timeout: 10000 });

// 4. 認証情報入力（CLAUDE.md参照）
await emailField.first().fill('test@promptmanagement.local');
await passwordField.first().fill('TestPass123!');

// 5. ログインボタンクリック
const loginButton = page.getByRole('button', { name: 'ログイン' });
await loginButton.click();

// 6. ログイン後のリダイレクトを待つ
await page.waitForURL('http://localhost:3347/', { timeout: 15000 });
```

**重要**: Supabase認証は非同期処理のため、waitForURL()で確実にリダイレクト完了を待つ

**パターン2: ネットワークエラー対策のリトライ機構** - Pass日時: 2026-01-18 22:30
- テストID: E2E-LIST-007
- 問題: net::ERR_NETWORK_CHANGEDによる間欠的なログイン失敗
- 成功パターン:

```typescript
// ネットワークエラー対策: リトライ機構付きログイン
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
```

**重要なポイント**:
- net::ERR_NETWORK_CHANGEDはPlaywright/Chromiumで間欠的に発生する既知の問題
- 最大3回までリトライすることで、間欠的なネットワークエラーを回避
- 失敗時は2秒待機してページをリロード（ネットワーク状態をリセット）

**失敗したパターン（参考）**:
- ❌ リトライなしでログイン → 間欠的に失敗
- ❌ waitForTimeoutのみ（ページリロードなし） → 改善せず

### 失敗パターンと解決策

**失敗: window.confirmとMUI Dialogの混同**
- テストID: E2E-LIST-007
- 問題: 実装がwindow.confirmを使っているのに、テストコードでMUI Dialog `[role="dialog"]` を探していた

```typescript
// ❌ これは失敗する（実装がwindow.confirmを使っている場合）
const dialog = page.locator('[role="dialog"]');
await expect(dialog).toBeVisible({ timeout: 5000 });

// ✅ window.confirmの場合はpage.on('dialog')で処理
page.on('dialog', async (dialog) => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('削除してもよろしいですか');
  await dialog.accept();
});

await deleteButton.click();
```

**重要**: テスト仕様書と実装コードの整合性を確認すること

---

## UI操作

### 成功パターン
**パターン1: MUIテーブルの要素確認**
- テストID: E2E-LIST-001
- 実施日: 2026-01-18
- 対象: プロンプト一覧テーブル

```typescript
// 1. アコーディオンヘッダー確認（getByText）
const accordionHeader = page.getByText('検索・フィルター');
await expect(accordionHeader).toBeVisible({ timeout: 10000 });

// 2. テーブルヘッダー確認（getByRole('columnheader')）
await expect(page.getByRole('columnheader', { name: 'タイトル' })).toBeVisible({ timeout: 10000 });
await expect(page.getByRole('columnheader', { name: 'プロンプト' })).toBeVisible({ timeout: 10000 });
await expect(page.getByRole('columnheader', { name: 'タグ' })).toBeVisible({ timeout: 10000 });
await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible({ timeout: 10000 });

// 3. テーブルボディの存在確認
const tableBody = page.locator('tbody');
await expect(tableBody).toBeVisible({ timeout: 10000 });
```

**重要**: MUIコンポーネントはrole属性が自動付与されるため、getByRole()が推奨

**パターン2: MUIアコーディオン内のボタンクリック**
- テストID: E2E-LIST-004
- 実施日: 2026-01-18 21:35
- 対象: お気に入り絞り込みボタン（アコーディオン内）

```typescript
// 1. アコーディオンヘッダーをクリックして展開
const accordionButton = page.getByRole('button', { name: /検索・フィルター/ });
await expect(accordionButton).toBeVisible({ timeout: 10000 });
await accordionButton.click();

// 2. アコーディオンが展開されるまで待つ
await page.waitForTimeout(300);

// 3. アコーディオン内のボタンをクリック
const favoriteButton = page.getByRole('button', { name: /お気に入り/ });
await expect(favoriteButton).toBeVisible({ timeout: 10000 });
await favoriteButton.click();

// ----

// 後続操作で再度アコーディオン内のボタンにアクセスする場合:
// アコーディオンが閉じている可能性があるため、再度開く
const accordionButton = page.getByRole('button', { name: /検索・フィルター/ });
const isAccordionExpanded = await accordionButton.getAttribute('aria-expanded');
if (isAccordionExpanded !== 'true') {
  await accordionButton.click();
  await page.waitForTimeout(300);
}
```

**重要**:
- MUIのAccordionは`defaultExpanded={false}`の場合、初期状態が閉じている
- アコーディオン内のボタンは、閉じている状態ではDOM上に存在しない（`display: none`）
- 必ずアコーディオンを開いてから、内部のボタンをクリックする
- 後続操作でも`aria-expanded`属性をチェックして、必要なら再度開く

### 失敗パターンと解決策

**失敗: アコーディオンを開かずにボタンクリック**
```typescript
// ❌ これは失敗する（ボタンが見つからない）
const favoriteButton = page.getByRole('button', { name: /お気に入り/ });
await favoriteButton.click();
```

**解決策**: 必ずアコーディオンを開いてからボタンにアクセスする

---

## 文字数カウント表示

### 成功パターン
**パターン1: リアルタイム文字数カウント検証**
- テストID: E2E-FORM-007
- 実施日: 2026-01-18
- 対象: プロンプト作成・編集ページの文字数カウント表示

```typescript
// 1. 初期表示確認（0文字）
const titleCounter = page.getByText('0 / 200', { exact: true });
await expect(titleCounter).toBeVisible({ timeout: 5000 });

// 2. 入力後の文字数カウント更新確認
const titleField = page.locator('input[name="title"]').or(
  page.locator('input[placeholder*="タイトル"]')
);
await titleField.first().fill('テスト');
await page.waitForTimeout(300); // 状態更新を待つ

// 3. 更新後の文字数カウント確認（3文字）
const titleCounterUpdated = page.getByText('3 / 200', { exact: true });
await expect(titleCounterUpdated).toBeVisible({ timeout: 5000 });

// 4. 追加入力での文字数カウント更新確認
await titleField.first().fill('テスト追加');
await page.waitForTimeout(300);

const titleCounterFinal = page.getByText('5 / 200', { exact: true });
await expect(titleCounterFinal).toBeVisible({ timeout: 5000 });
```

**重要**:
- 文字数カウントはReactのstate変化でリアルタイム更新される
- `exact: true`オプションで厳密な文字列マッチングを行う（「0 / 200」と「10 / 200」を区別）
- 入力後に`waitForTimeout(300)`で状態更新を待つ（Reactの再レンダリング完了を保証）
- タイトルフィールド（0 / 200）とプロンプト本文フィールド（0 / 100000）は独立して更新される

### 失敗パターンと解決策
（まだありません）

---

## 統計情報表示

### 成功パターン
**パターン1: MUI統計カードの数値表示確認**
- テストID: E2E-SET-001
- 実施日: 2026-01-18
- 対象: 設定ページの統計情報セクション

```typescript
// 1. ページ移動と統計情報セクション確認
await page.goto('http://localhost:3347/settings', {
  waitUntil: 'networkidle',
  timeout: 30000,
});

// 2. 統計情報セクションのタイトル確認
const statisticsTitle = page.getByRole('heading', { name: '統計情報', level: 6 });
await expect(statisticsTitle).toBeVisible({ timeout: 10000 });

// 3. 統計データの読み込み完了を待つ（CircularProgressが非表示になるまで）
await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 }).catch(() => {
  console.log('[DEBUG] CircularProgressが見つからない（すでにロード完了）');
});

// 4. 統計カード3つの表示確認
const totalPromptsCard = page.getByText('総プロンプト数');
await expect(totalPromptsCard).toBeVisible({ timeout: 10000 });

const totalTagsCard = page.getByText('タグ数');
await expect(totalTagsCard).toBeVisible({ timeout: 10000 });

const favoriteCountCard = page.getByText('お気に入り数');
await expect(favoriteCountCard).toBeVisible({ timeout: 10000 });

// 5. 統計情報セクション内のh4要素（統計数値）を取得
const statisticsSection = page.locator('text=統計情報').locator('..');
const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');

// 6. 3つのh4要素が存在することを確認
await expect(statNumbers).toHaveCount(3, { timeout: 10000 });

// 7. 各数値が0以上の整数であることを確認
const count = await statNumbers.count();
for (let i = 0; i < count; i++) {
  const text = await statNumbers.nth(i).textContent();
  const num = parseInt(text || '0', 10);
  expect(num).toBeGreaterThanOrEqual(0);
}
```

**重要**:
- 統計データ読み込み中は`CircularProgress`が表示される（ロード完了後は非表示）
- ページタイトル「設定」もh4要素のため、`page.locator('h4')` で全体を取得すると4つになる
- 統計情報セクション内のh4のみを取得するため、`locator('text=統計情報').locator('..')` で親要素を取得してから子要素を検索
- 統計カードは3つ: 「総プロンプト数」「タグ数」「お気に入り数」

### 失敗パターンと解決策

**失敗: ページタイトルのh4も含めて取得**
- テストID: E2E-SET-001
- 問題: `page.locator('h4.MuiTypography-h4')` で全体を取得すると、設定ページタイトル「設定」も含まれて4つになる

```typescript
// ❌ これは失敗する（ページタイトル「設定」も含まれる）
const statNumbers = page.locator('h4.MuiTypography-h4');
await expect(statNumbers).toHaveCount(3, { timeout: 10000 });
// Error: Expected: 3, Received: 4

// ✅ 統計情報セクション内のh4のみを取得
const statisticsSection = page.locator('text=統計情報').locator('..');
const statNumbers = statisticsSection.locator('h4.MuiTypography-h4');
await expect(statNumbers).toHaveCount(3, { timeout: 10000 });
```

**解決策**: 親要素（統計情報セクション）を特定してから、その子要素のh4を検索する

---

## ファイルダウンロードとJSON検証

### 成功パターン
**パターン1: ダウンロードファイルの内容読み込みとJSON構造検証**
- テストID: E2E-SET-004
- 実施日: 2026-01-18
- 対象: 設定ページのデータエクスポート機能

```typescript
// 1. ダウンロードイベントを待機
const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

// 2. ダウンロードボタンをクリック
const exportButton = page.getByRole('button', { name: /データをエクスポート/i });
await exportButton.click();

// 3. ダウンロード完了を待つ
const download = await downloadPromise;

// 4. ファイル名形式の検証
const fileName = download.suggestedFilename();
const fileNamePattern = /^prompts_export_\d{8}\.json$/;
expect(fileName).toMatch(fileNamePattern);

// 5. ファイルの保存とパス取得
const filePath = await download.path();
expect(filePath).toBeTruthy();

// 6. fsモジュールでファイルを読み込み
const fs = await import('fs');
const fileContent = fs.readFileSync(filePath, 'utf-8');

// 7. JSONパース
const exportedData = JSON.parse(fileContent);

// 8. JSON構造の検証（ネストされたオブジェクト形式）
expect(typeof exportedData).toBe('object');
expect(exportedData).toHaveProperty('version');
expect(exportedData).toHaveProperty('exported_at');
expect(exportedData).toHaveProperty('prompts');

// 9. promptsが配列であることを確認
expect(Array.isArray(exportedData.prompts)).toBe(true);
expect(exportedData.prompts.length).toBeGreaterThan(0);

// 10. データ項目の必須フィールド検証
const firstItem = exportedData.prompts[0];
expect(firstItem).toHaveProperty('id');
expect(firstItem).toHaveProperty('title');
expect(firstItem).toHaveProperty('content');
expect(firstItem).toHaveProperty('tags');
expect(firstItem).toHaveProperty('is_favorite');
expect(firstItem).toHaveProperty('created_at');
expect(firstItem).toHaveProperty('updated_at');

// 11. データ型の検証
expect(typeof firstItem.id).toBe('string');
expect(typeof firstItem.title).toBe('string');
expect(typeof firstItem.content).toBe('string');
expect(Array.isArray(firstItem.tags)).toBe(true);
expect(typeof firstItem.is_favorite).toBe('boolean');
expect(typeof firstItem.created_at).toBe('string');
expect(typeof firstItem.updated_at).toBe('string');

// 12. ISO8601形式の日付検証
const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/;
expect(firstItem.created_at).toMatch(isoDatePattern);
expect(firstItem.updated_at).toMatch(isoDatePattern);
```

**重要**:
- ダウンロードファイルの内容は`download.path()`で取得したパスから`fs.readFileSync()`で読み込む
- `require('fs')`ではなく`await import('fs')`を使用（ESモジュール対応）
- エクスポートデータ構造が`{ version, exported_at, prompts: [] }`のネストされた形式であることを確認
- `prompts`配列内の各項目に必須フィールドが含まれることを検証
- ISO8601形式の日付パターンは`+00:00`のタイムゾーン付きにも対応

### 失敗パターンと解決策
（まだありません）

---

**注意**: このファイルはE2Eテスト実行中に自動更新されます。
