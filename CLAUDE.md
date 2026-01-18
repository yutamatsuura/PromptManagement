# プロジェクト設定

## 基本設定
```yaml
プロジェクト名: PromptManagement
開始日: 2026-01-17
技術スタック:
  frontend:
    framework: React 18
    language: TypeScript 5
    ui: MUI v6
    state: Zustand
    routing: React Router v6
    build: Vite 5
  backend:
    service: Supabase
    database: PostgreSQL
    auth: Supabase Auth
  libraries:
    - @supabase/supabase-js
    - @yaireo/tagify
```

## 開発環境
```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3347
  # バックエンドポートは不要（Supabaseクラウド利用）

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    - VITE_SUPABASE_URL: Supabaseプロジェクト URL
    - VITE_SUPABASE_ANON_KEY: Supabase匿名キー
```

## テスト認証情報
```yaml
本番用アカウント:
  email: matsuura.yuta@gmail.com
  password: ia0110299

開発用アカウント:
  email: test@promptmanagement.local
  password: TestPass123!

外部サービス:
  Supabase: https://hfhwiqpilzrjhjlbkqdi.supabase.co
  Vercel: https://myprompt-management.vercel.app
```

## コーディング規約

### 命名規則
```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: PromptList.tsx)
  - ユーティリティ: camelCase.ts (例: formatDate.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: API_ENDPOINTS.ts)

変数・関数:
  - 変数: camelCase
  - 関数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - 型/インターフェース: PascalCase
```

### コード品質
```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止
  - エラーハンドリング必須
  - 関数行数: 100行以下（96.7%カバー）
  - ファイル行数: 700行以下（96.9%カバー）
  - 複雑度: 10以下
  - 行長: 120文字

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル
```

## プロジェクト固有ルール

### APIエンドポイント
```yaml
命名規則:
  - Supabaseテーブル名: 複数形（prompts）
  - RPC関数: スネークケース（get_user_stats）
```

### 型定義
```yaml
配置:
  frontend: src/types/index.ts

主要型:
  - Prompt: プロンプトデータ
  - User: ユーザー情報（Supabase Auth）
  - PromptFilter: 検索フィルター条件
```

## Supabase設定

### Row Level Security (RLS)
```yaml
必須ポリシー:
  prompts テーブル:
    - SELECT: 自分のプロンプトのみ閲覧可能
    - INSERT: 認証済みユーザーのみ作成可能
    - UPDATE: 自分のプロンプトのみ更新可能
    - DELETE: 自分のプロンプトのみ削除可能
```

### データベーススキーマ
```sql
-- prompts テーブル
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_is_favorite ON prompts(is_favorite);
```

## 🆕 最新技術情報（知識カットオフ対応）

### Clipboard API
```yaml
注意点:
  - HTTPS環境必須（localhost除く）
  - ユーザージェスチャー（クリック）から数秒以内に実行必要
  - Safari特有の挙動に注意（pointerdown/pointerup推奨）

実装例:
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // フォールバック不要、明示的にエラー表示
    alert('コピーに失敗しました');
  }
```

### Supabase認証
```yaml
セッション管理:
  - JWT自動更新
  - localStorage使用（セッション永続化）
  - onAuthStateChange でリアルタイム監視

パスワードポリシー:
  - 最小8文字（Supabaseデフォルト）
  - 複雑性要件なし（必要に応じてカスタマイズ可能）
```

## 🔄 データベースマイグレーション手順

### マイグレーションの実行
Supabase CLIを使用してデータベーススキーマを管理します。

```bash
# スキーマ変更をリモートデータベースに適用
supabase db push

# マイグレーション履歴の確認
supabase migration list

# 新しいマイグレーションファイルの作成
supabase migration new <migration_name>
```

**重要な注意事項**:
- マイグレーションファイルは `supabase/migrations/` に配置
- ファイル名形式: `YYYYMMDD_description.sql`
- `supabase db push` で自動的にリモートに適用
- ローカル開発では `supabase start` でローカルDBを起動可能

### 環境変数の検証
データベース接続とテーブル作成を検証するには:

```bash
# 接続テストスクリプトを実行
node test-supabase-connection.js
```

このスクリプトは以下を検証します:
- ✅ 環境変数の読み込み
- ✅ Supabaseへの接続
- ✅ promptsテーブルへのアクセス
- ✅ RLSポリシーの動作確認

## 13. E2Eテスト自律実行の絶対原則

**【重要】セッション開始時・compact後の自動判定**

このセクションはE2Eテストオーケストレーターによって自動生成されました。

---

**最初に必ず専門知識を注入してください**

E2Eテスト実行中の場合、以下を実行してから開始してください：

```
inject_knowledge ツールで keyword: "@E2Eテストオーケストレーター"
を実行してから開始してください。（初回必須・compact後も必須）
```

重要：キーワードは "@E2Eテストオーケストレーター"
をそのまま使用してください。変換や推測は不要です。

準備完了です。まず知識注入を実行してから、タスクを開始してください。

---

**E2Eテストオーケストレーター実行中の判定**:
- SCOPE_PROGRESS.mdに「## 📊 E2Eテスト全体進捗」が存在する場合
- または、セッション再開時に前回のメッセージに「E2Eテスト」「オーケストレーター」キーワードがある場合

**セッション開始時・compact後の自動処理**:
1. 上記の判定基準でE2Eテスト実行中と判定
2. inject_knowledge('@E2Eテストオーケストレーター') を必ず実行
3. docs/e2e-best-practices.md の存在確認（なければ初期テンプレート作成）
4. SCOPE_PROGRESS.mdから [ ] テストの続きを自動で特定
5. [x] のテストは絶対にスキップ
6. ユーザー確認不要、完全自律モードで継続
7. ページ選定も自動（未完了ページを上から順に選択）
8. 停止条件：全テスト100%完了のみ

**5回エスカレーション後の処理**:
- チェックリストに [-] マークを付ける
- docs/e2e-test-history/skipped-tests.md に記録
- 次のテストへ自動で進む（停止しない）

**ベストプラクティス自動蓄積**:
- 各テストで成功した方法を docs/e2e-best-practices.md に自動保存
- 後続テストが前のテストの知見を自動活用
- 試行錯誤が減っていく（学習効果）

**重要**:
- この原則はCLAUDE.mdに記載されているため、compact後も自動で適用される
- セッション開始時にこのセクションがない場合、オーケストレーターが自動で追加する
