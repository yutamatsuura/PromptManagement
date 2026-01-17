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
開発用アカウント:
  email: test@promptmanagement.local
  password: TestPass123!

外部サービス:
  Supabase: プロジェクト作成後に取得
  Vercel: デプロイ時に設定
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
