# デバッグセッション履歴

総セッション数: 12回
総所要時間: 2.7時間
平均所要時間: 13分/セッション

---

## #DS-012: E2E-FORM-002（初期フィルタによる新規データ非表示）

**日時**: 2026-01-18 23:05 - 23:17
**所要時間**: 12分
**担当**: デバッグマスター #1
**対象テストID**: E2E-FORM-002
**エスカレーション**: 0回

### 問題
プロンプト新規作成フローで、保存後に一覧ページへリダイレクトされるが、新規作成したプロンプトが一覧に表示されない。

### 調査
1. Supabaseへのデータ保存確認 → 正常に保存されている
2. RLSポリシー確認 → 正常に機能している
3. promptService実装確認 → 正しい実装
4. usePromptListフック確認 → 初期フィルタに `isFavorite: false` 設定を発見
5. ネットワークログ確認 → `is_favorite=eq.false` フィルタが原因と特定

### 対応
1. `frontend/src/hooks/usePromptList.ts` を修正
   - 初期フィルタを `isFavorite: undefined` に変更（全件表示）
   - resetFilter関数も同様に修正
2. E2Eテスト再実行（Pass ✅、14.4秒）

### 結果
Pass ✅

### 学び
- 初期フィルタ状態の重要性：デフォルトで `isFavorite: false` にすると、お気に入りプロンプトが表示されなくなる
- ネットワークログの活用：PlaywrightのネットワークログでAPIリクエストの詳細が分かり、根本原因を特定できた
- デバッグログの活用：画面に表示されているデータを取得し、期待値と比較することで、フィルタ問題を発見できた

---

## #DS-011: E2E-FORM-001（仕様に存在しないフィールドの検証）

**日時**: 2026-01-18 22:45 - 23:00
**所要時間**: 15分
**担当**: デバッグマスター #1
**対象テストID**: E2E-FORM-001
**エスカレーション**: 0回

### 問題
1. テストコードが仕様に存在しない`description`フィールドを検証しようとしていた
2. `favoriteCheckbox`のセレクタが不適切（実装はMUI Switchだが、Checkboxとして検証）

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（`textarea[name="description"]`が見つからない）
2. ページ構造確認（descriptionフィールドは存在しない、title/content/tags/is_favoriteのみ）
3. E2E仕様書確認（descriptionフィールドの記載なし）
4. PromptFormPage.tsx確認（descriptionフィールドの実装なし、favoriteはSwitch）

### 対応
1. descriptionフィールドの検証を削除（仕様書にないフィールド）
2. tagsフィールドの検証を追加（仕様書通り）
3. favoriteCheckboxをfavoriteSwitchに変更し、`.MuiSwitch-input`セレクタに修正
4. contentフィールドのプレースホルダーを「プロンプト本文」に変更
5. E2Eテスト再実行（Pass ✅、27.7秒）

### 結果
Pass ✅

### 学び
- E2E仕様書と実装の整合性を確認することが重要
- テストコードのフィールド検証は仕様書に基づいて作成する
- MUI SwitchとCheckboxはセレクタが異なる（`.MuiSwitch-input` vs `input[type="checkbox"]`）

---

## #DS-010: E2E-LIST-007（ネットワークエラーとwindow.confirm対応）

**日時**: 2026-01-18 22:05 - 22:30
**所要時間**: 25分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LIST-007
**エスカレーション**: 0回

### 問題
1. 間欠的なネットワークエラー（`net::ERR_NETWORK_CHANGED`）によるログイン失敗
2. window.confirmとMUI Dialogの混同（実装はwindow.confirm、テストはMUI Dialog想定）

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（`TimeoutError: page.waitForURL`、`net::ERR_NETWORK_CHANGED`）
2. ネットワークログ確認（Supabase認証API呼び出し失敗）
3. PromptListPage.tsx確認（削除確認にwindow.confirmを使用、MUI Dialogではない）

### 対応
1. ログイン処理にリトライ機構を追加
   - 最大3回までリトライ
   - 失敗時は2秒待機後、ページリロードして再試行
   - 間欠的なネットワークエラーを回避
2. テストコードを修正
   - `page.on('dialog')`でwindow.confirmダイアログを自動受け入れ
   - ダイアログメッセージの検証も追加
3. E2Eテスト再実行（Pass ✅、7.8秒）

### 結果
Pass ✅

### 学び
- 間欠的なネットワークエラーはリトライ機構で回避できる
- window.confirmとMUI Dialogは別物、実装を確認してから対応する
- `page.on('dialog')`でwindow.confirm/alert/promptを処理可能
- ベストプラクティスに「ログインリトライ機構」「window.confirm対応」パターンを追加

---

## #DS-009: E2E-LIST-005（テストセレクタの不一致）

**日時**: 2026-01-18 21:52 - 21:57
**所要時間**: 5分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LIST-005
**エスカレーション**: 0回

### 問題
テストコードが「コピーボタン」（`getByRole('button', { name: /コピー/ })`）を探していたが、実装は「プロンプト本文セルをクリック」する仕様だった。

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（画面に「コピー」ボタンが存在しない）
2. E2E仕様書確認（E2E-LIST-005は「プロンプト本文セルをクリック」と記載）
3. requirements.md確認（「ワンクリックコピー」機能として定義）
4. PromptListPage.tsx確認（TableCellに`onClick={() => handleCopy()}`が実装済み）

### 対応
1. テストコード修正（prompt-list.spec.ts 680-691行目）
   ```typescript
   // 修正前: コピーボタンを探す（存在しない）
   const copyButton = page.locator('tbody tr').first().getByRole('button', { name: /コピー/ })

   // 修正後: プロンプト本文セル（3列目）をクリック
   const contentCell = page.locator('tbody tr').first().locator('td').nth(2);
   await contentCell.click();
   ```
2. E2Eテスト再実行（Pass ✅）

### 結果
Pass ✅

### 学び
- テストコードのコメントだけでなく、E2E仕様書と実装コードの両方を確認する重要性
- セルのインデックスは0始まり（nth(2)が3列目）
- Clipboard APIは実装済みだが、テストのセレクタが間違っていただけだった

---

## #DS-008: E2E-LIST-004（アコーディオン内ボタンの不可視問題）

**日時**: 2026-01-18 21:30 - 21:35
**所要時間**: 5分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LIST-004
**エスカレーション**: 0回

### 問題
お気に入りボタンがMUIアコーディオン内に配置されており、アコーディオンが閉じている状態ではボタンがDOM上に存在しない（`display: none`）。テストコードはアコーディオンを開かずに直接ボタンをクリックしようとして、`element(s) not found`エラーが発生。

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（`expect(locator).toBeVisible() failed`）
2. PromptListPage.tsxのソースコード確認（お気に入りボタンは`Accordion > AccordionDetails`内に配置、`defaultExpanded={false}`）
3. テストコードの構造確認（アコーディオンを開く操作が欠落）

### 対応
1. テストコード修正（`frontend/tests/e2e/prompt-list.spec.ts`）
   - 「お気に入りボタンをクリック」前に「検索・フィルターアコーディオンを開く」ステップを追加
   - `aria-expanded`属性チェックで、閉じていれば再度開く処理を追加
   - `page.waitForTimeout(300)`でアコーディオンアニメーション完了を待機
2. E2Eテスト再実行（2回実行して安定性確認、Pass ✅）

### 結果
Pass ✅

### 学び
- MUIのAccordionは`defaultExpanded={false}`の場合、内部のコンテンツがDOM上に存在しない（`display: none`）
- アコーディオン内のボタンにアクセスする前に、必ずアコーディオンを開く操作が必要
- 後続操作でも`aria-expanded`属性をチェックして、閉じていれば再度開く
- Playwrightの`page.waitForTimeout(300)`でアコーディオンのアニメーション完了を待つと安定する
- ベストプラクティスに「MUIアコーディオン内のボタンクリック」パターンを追加

---

## #DS-007: E2E-LIST-003（テストデータ不足とChip形式の不一致）

**日時**: 2026-01-18 20:55 - 21:20
**所要時間**: 25分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LIST-003
**エスカレーション**: 0回

### 問題
1. テストデータ不足（プロンプト0件 → タグChip0個）
2. テストコードと実装の不一致（Tagify想定 vs Chip実装）
3. アコーディオンの自動クローズ（`defaultExpanded={false}`の影響）

### 調査
1. SCOPE_PROGRESS.mdのエラーログ確認（`[data-testid="tag-filter"]`が見つからない）
2. PromptListPage.tsx確認（Chip形式で実装、allTags配列が空）
3. プロンプトデータ確認（Supabaseに0件）
4. アコーディオン実装確認（`defaultExpanded={false}`で初期は閉じている）

### 対応
1. テストデータ投入スクリプト作成（seed-e2e-data.js）
   - テストアカウントで4件のプロンプトを作成
   - タグ：AI、プログラミング、データベース
2. テストコードをMUI Chip形式に修正
   - セレクタ：`[data-testid="tag-filter"]` → `.MuiChip-root`
   - Tagify形式の操作 → Chip形式の操作
3. アコーディオン再オープン処理を追加
   - フィルタリング後にアコーディオンが閉じる問題に対応
4. E2Eテスト再実行で成功確認

### 結果
✅ E2E-LIST-003 Pass

### 学び
- E2Eテストではテストデータが必須（空データではUIが表示されない）
- テストコードは実装に合わせる（Tagify想定 → Chip実装）
- Accordionの`defaultExpanded={false}`は再レンダリング時に閉じるため、テストでは都度オープン確認が必要
- テストデータ投入スクリプトは再利用可能な形で作成すると効率的

---

## #DS-006: E2E-LIST-002（アコーディオンが閉じている状態で検索フィールド操作）

**日時**: 2026-01-18 20:50 - 20:52
**所要時間**: 2分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LIST-002
**エスカレーション**: 0回

### 問題
アコーディオンが閉じている状態で検索フィールドに`.clear()`を実行しようとして、"element is not visible"エラーが発生

### 調査
1. SCOPE_PROGRESS.mdのエラーログ確認（スクリーンショット: アコーディオンが閉じている）
2. テストコードのレビュー（検索実行後にアコーディオンが閉じている）
3. 根本原因の特定（検索実行後にユーザーがアコーディオンを閉じた、または自動で閉じる実装）

### 対応
1. prompt-list.spec.tsの「検索クリアを実行」ステップに、アコーディオンが閉じている場合は開く処理を追加
2. `.isVisible()`で要素の状態を確認してから操作
3. E2Eテスト再実行で成功確認（9.3秒）

### 結果
✅ E2E-LIST-002 Pass（9.3秒で完了）

### 学び
- アコーディオンUIは状態が変わる可能性があるため、操作前に必ず可視性を確認する
- `.isVisible()`で要素の状態を確認してから操作することで、タイムアウトエラーを防げる
- PlaywrightのテストではUI状態の確認を徹底することが重要

---

## #DS-005: E2E-LOGIN-006（パスワード表示切替未実装）

**日時**: 2026-01-18 20:33 - 20:35
**所要時間**: 2分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-006
**エスカレーション**: 0回

### 問題
パスワードフィールドに目アイコン（表示切替ボタン）が存在しない

### 調査
1. SCOPE_PROGRESS.mdのエラーログ確認（button要素が見つからない）
2. E2E仕様書確認（パスワード表示・非表示切り替え機能）
3. LoginPage.tsx確認（目アイコン未実装）
4. MUI公式パターンをWeb検索で確認

### 対応
1. LoginPage.tsxにパスワード表示切替機能実装
   - IconButton、InputAdornment のインポート追加
   - Visibility、VisibilityOff アイコンのインポート追加
   - showPassword 状態の追加
   - handleTogglePasswordVisibility 関数の追加
   - パスワードフィールドに InputProps.endAdornment 実装
   - aria-label でアクセシビリティ対応
   - type属性を動的に切り替え（text/password）

### 結果
✅ E2E-LOGIN-006 Pass（15.8秒で完了）

### 学び
- MUI TextFieldでパスワード表示切替は InputProps.endAdornment で実装する
- aria-label でアクセシビリティ対応が必須
- type属性を動的に切り替えることで text/password 表示を制御
- 目アイコンは標準的なUI/UXパターンで直感的
- Visibility / VisibilityOff アイコンは MUI標準で提供されている

---

## #DS-004: E2E-LOGIN-005（入力フィールドバリデーション未実装）

**日時**: 2026-01-18 20:25 - 20:30
**所要時間**: 5分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-005
**エスカレーション**: 0回

### 問題
空フィールドでログインボタンをクリックしてもエラーメッセージが表示されない

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（エラーメッセージが見つからない）
2. LoginPage.tsx確認（TextFieldにrequired属性はあるが、エラー表示機能なし）
3. handleSubmit確認（クライアントサイドバリデーションなし）

### 対応
1. フィールドごとのエラーstate追加（emailError, passwordError）
2. handleSubmit内でクライアントサイドバリデーション実装
   ```typescript
   if (!email.trim()) {
     setEmailError('メールアドレスを入力してください');
     setLoading(false);
     return;
   }
   if (!password.trim()) {
     setPasswordError('パスワードを入力してください');
     setLoading(false);
     return;
   }
   ```
3. TextField要素にerror/helperTextプロパティ追加
4. onChange時にエラーをクリアする処理を追加（UX向上）

### 結果
✅ E2E-LOGIN-005 Pass

### 学び
- MUI TextFieldの `required` 属性は、HTML5のネイティブバリデーションを提供するが、カスタムエラーメッセージ表示には不十分
- クライアントサイドバリデーションは、サーバーへの不要なリクエストを防ぎ、UXを向上させる
- TextField の `error` と `helperText` プロパティを使用することで、標準的なエラー表示が可能
- onChange時にエラーをクリアすることで、ユーザーに即座にフィードバックを提供できる

---

## #DS-003: E2E-LOGIN-004（パスワードリセット機能未実装）

**日時**: 2026-01-18 20:14 - 20:25
**所要時間**: 11分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-004
**エスカレーション**: 0回

### 問題
パスワードリセットリンククリック後、送信ボタンが見つからない（モーダルが表示されない）

### 調査
1. SCOPE_PROGRESS.mdのエラーレポート確認（リンク `href="#"` で実装なし）
2. E2E仕様書確認（モーダルでメール入力→送信完了メッセージ表示）
3. LoginPage.tsx確認（リンクが `href="#"` で未実装）
4. AuthContext.tsx、authService.ts確認（バックエンド機能は実装済み）

### 対応
1. LoginPage.tsxにパスワードリセット機能実装
   - 状態管理追加（resetDialogOpen, resetEmail, resetSuccess, resetError）
   - パスワードリセット処理追加（handleResetPasswordSubmit）
   - リンクをボタンに変更（`component="button"`, `onClick`イベント追加）
   - MUI Dialogコンポーネントでモーダル実装
2. テストコード修正（login.spec.ts）
   - リンクロールをボタンロールに変更
   - ダイアログタイトル確認追加
   - ダイアログ内の特定フィールドをIDセレクタ（`#reset-email`）で選択
   - エラーメッセージも検証対象に含める（Supabaseレート制限対応）

### 結果
✅ E2E-LOGIN-004 Pass（8.3秒で完了）

### 学び
- 実装済みのバックエンド機能（AuthContext、authService）がUIに接続されていない場合、E2Eテストは失敗する
- MUI Linkコンポーネントは `component="button"` でボタンとして機能させることができ、`onClick` イベントを受け取れる
- Supabaseのレート制限（429エラー）はE2Eテストで頻繁に発生するため、エラーメッセージも検証対象に含める必要がある
- テストコードでダイアログ内の要素を選択する際は、IDセレクタ（`#reset-email`）を使うと確実
- ロール選択（`getByRole`）は、実装方法（`<Link href="#">` vs `<Link component="button">`）によってロールが変わるため注意が必要

---

## #DS-002: E2E-LOGIN-002（Menuコンポーネント内のログアウトボタン）

**日時**: 2026-01-18 20:00 - 20:15
**所要時間**: 15分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-002

### 問題
ログアウトボタンが見つからない（getByRole('button', { name: /ログアウト|Logout/i }) がタイムアウト）

### 調査
1. error-context.mdに「button "user menu"」が存在することを確認
2. Header.tsxの実装確認 → ログアウトはMenuItemとしてMenuコンポーネント内に実装
3. メニューは初期状態で閉じている（ユーザーメニューアイコンクリックで開く）

### 対応
1. ユーザーメニューアイコン（「user menu」）をクリック
2. メニューが開くのを待機
3. ログアウトメニュー項目（role="menuitem"）を確認するようにテストコード修正

### 結果
✅ E2E-LOGIN-002 Pass（5.1秒で完了）

### 学び
- MUIのMenuコンポーネントはトリガーボタンクリックで開く仕組み
- MenuItemはrole="menuitem"を持つ
- E2EテストではUIの階層構造を理解して正しい操作順序を実装
- error-context.mdのDOM構造スナップショットは問題特定に有用

---

## #DS-001: E2E-LOGIN-001（環境変数・セレクタ・テキスト不一致）

**日時**: 2026-01-18 19:10 - 19:45
**所要時間**: 35分
**担当**: デバッグマスター #1
**対象テストID**: E2E-LOGIN-001

### 問題
1. Playwrightが「ログイン」テキストを見つけられずタイムアウト
2. HTMLレスポンスは返っているがReactアプリがレンダリングされない

### 調査
1. 環境変数の確認 → frontend/.env.localが存在しない（ルートのみ）
2. Viteは実行ディレクトリの.env.localを読み込むため、frontend/に配置必要
3. セレクタ text="ログイン" がタブとボタンの2要素にマッチ
4. パスワードリセットリンクのテキストが仕様書と実装で異なる

### 対応
1. .env.localをfrontend/ディレクトリにコピー
2. Vite開発サーバーを再起動（環境変数再読み込み）
3. セレクタをgetByRole()に変更（strict mode対応）
4. page.goto()にwaitUntil: 'networkidle'と#root待機を追加
5. リンクテキストを実装に合わせて修正

### 結果
✅ E2E-LOGIN-001 Pass（3.9秒で完了）

### 学び
- Viteは実行ディレクトリの.env.localを読み込む（ルートディレクトリではない）
- Playwrightのstrict modeは複数要素マッチでエラー → getByRole()で解決
- page.goto()はwaitUntil: 'networkidle'がないとJS実行前に次へ進む
- 実装と仕様書のテキストが異なる場合は実装に合わせる

---
