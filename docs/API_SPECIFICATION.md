# API仕様書（P-002: プロンプト一覧・検索ページ）

## 概要

このドキュメントは、P-002（プロンプト一覧・検索ページ）の機能実装に必要なAPIエンドポイントを定義します。
現在はモックサービス（`mockPromptService.ts`）で実装されており、将来的にSupabaseバックエンドへ移行します。

## ベースURL

```
開発環境: http://localhost:3347/api
本番環境: https://[your-domain]/api (Supabase経由)
```

## 認証

全てのエンドポイントは認証が必要です。

- 認証方式: Supabase Auth (JWT Bearer Token)
- ヘッダー: `Authorization: Bearer <token>`

## エンドポイント一覧

### 1. プロンプト一覧取得

**エンドポイント**: `GET /api/prompts`

**説明**: ログインユーザーが所有する全プロンプトを取得します。

**リクエスト**:
```
GET /api/prompts
Authorization: Bearer <token>
```

**レスポンス** (200 OK):
```typescript
Prompt[]

// Prompt型定義
interface Prompt {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string; // ISO 8601形式
  updated_at: string; // ISO 8601形式
}
```

**レスポンス例**:
```json
[
  {
    "id": "1",
    "user_id": "mock-user-1",
    "title": "CODE REVIEW ASSISTANT",
    "description": "コードレビューを効率化するための質問生成プロンプト。",
    "content": "あなたは経験豊富なシニアエンジニアです...",
    "tags": ["AI", "Code", "Review"],
    "is_favorite": true,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
]
```

**ソート順**: `updated_at` の降順（最新更新が先頭）

**エラーレスポンス**:
- 401 Unauthorized: 認証トークンが無効
- 500 Internal Server Error: サーバーエラー

---

### 2. フィルタリングされたプロンプト取得

**エンドポイント**: `GET /api/prompts?filter=...`

**説明**: 検索条件に基づいてプロンプトをフィルタリングして取得します。

**クエリパラメータ**:
```typescript
interface PromptFilter {
  searchQuery?: string;      // テキスト検索（タイトル・説明・本文から検索）
  tags?: string[];           // タグフィルタ（配列）
  tagMode?: 'AND' | 'OR';    // タグ検索モード（デフォルト: 'OR'）
  isFavorite?: boolean;      // お気に入り絞り込み
}
```

**リクエスト例**:
```
GET /api/prompts?searchQuery=code&tags=AI&tags=Code&tagMode=AND&isFavorite=true
Authorization: Bearer <token>
```

**フィルタリングロジック**:
1. お気に入り絞り込み（`isFavorite=true`の場合）
2. タグフィルタ
   - `tagMode=AND`: 全てのタグを含むプロンプトのみ
   - `tagMode=OR`: いずれかのタグを含むプロンプト（デフォルト）
3. テキスト検索（部分一致、大文字小文字を区別しない）
   - `title`から検索
   - `description`から検索
   - `content`から検索

**レスポンス** (200 OK):
```typescript
Prompt[] // 上記と同じPrompt型の配列
```

**ソート順**: `updated_at` の降順

**エラーレスポンス**:
- 400 Bad Request: 不正なクエリパラメータ
- 401 Unauthorized: 認証トークンが無効
- 500 Internal Server Error: サーバーエラー

---

### 3. プロンプト作成

**エンドポイント**: `POST /api/prompts`

**説明**: 新しいプロンプトを作成します。

**リクエストボディ**:
```typescript
interface PromptInput {
  title: string;           // 必須、最大200文字
  description?: string;    // 任意、最大500文字
  content: string;         // 必須
  tags: string[];          // タグ配列
  is_favorite: boolean;    // お気に入りフラグ
}
```

**リクエスト例**:
```json
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "NEW PROMPT",
  "description": "This is a new prompt",
  "content": "Prompt content here...",
  "tags": ["AI", "Test"],
  "is_favorite": false
}
```

**レスポンス** (201 Created):
```typescript
Prompt // 作成されたプロンプト（id、user_id、created_at、updated_atが自動生成される）
```

**レスポンス例**:
```json
{
  "id": "generated-uuid",
  "user_id": "current-user-id",
  "title": "NEW PROMPT",
  "description": "This is a new prompt",
  "content": "Prompt content here...",
  "tags": ["AI", "Test"],
  "is_favorite": false,
  "created_at": "2025-01-17T12:00:00Z",
  "updated_at": "2025-01-17T12:00:00Z"
}
```

**エラーレスポンス**:
- 400 Bad Request: バリデーションエラー（必須項目不足、文字数超過など）
- 401 Unauthorized: 認証トークンが無効
- 500 Internal Server Error: サーバーエラー

---

### 4. プロンプト更新

**エンドポイント**: `PUT /api/prompts/:id`

**説明**: 既存のプロンプトを更新します。

**パスパラメータ**:
- `id`: 更新対象のプロンプトID

**リクエストボディ**:
```typescript
Partial<PromptInput> // PromptInputの一部フィールドのみ更新可能
```

**リクエスト例**:
```json
PUT /api/prompts/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "UPDATED TITLE",
  "is_favorite": true
}
```

**レスポンス** (200 OK):
```typescript
Prompt // 更新されたプロンプト（updated_atが自動更新される）
```

**エラーレスポンス**:
- 400 Bad Request: バリデーションエラー
- 401 Unauthorized: 認証トークンが無効
- 403 Forbidden: 他人のプロンプトへのアクセス
- 404 Not Found: 指定されたIDのプロンプトが存在しない
- 500 Internal Server Error: サーバーエラー

---

### 5. プロンプト削除

**エンドポイント**: `DELETE /api/prompts/:id`

**説明**: 既存のプロンプトを削除します。

**パスパラメータ**:
- `id`: 削除対象のプロンプトID

**リクエスト**:
```
DELETE /api/prompts/1
Authorization: Bearer <token>
```

**レスポンス** (204 No Content):
```
(レスポンスボディなし)
```

**エラーレスポンス**:
- 401 Unauthorized: 認証トークンが無効
- 403 Forbidden: 他人のプロンプトへのアクセス
- 404 Not Found: 指定されたIDのプロンプトが存在しない
- 500 Internal Server Error: サーバーエラー

---

### 6. 全タグ取得

**エンドポイント**: `GET /api/prompts/tags`

**説明**: ログインユーザーが所有するプロンプトで使用されている全てのタグを取得します。

**リクエスト**:
```
GET /api/prompts/tags
Authorization: Bearer <token>
```

**レスポンス** (200 OK):
```typescript
string[] // 重複なしのタグ配列
```

**レスポンス例**:
```json
["AI", "Code", "Writing", "Marketing", "Research"]
```

**エラーレスポンス**:
- 401 Unauthorized: 認証トークンが無効
- 500 Internal Server Error: サーバーエラー

---

## Supabase実装時の注意事項

### Row Level Security (RLS)

`prompts` テーブルには以下のRLSポリシーを適用する必要があります:

```sql
-- SELECT: 自分のプロンプトのみ閲覧可能
CREATE POLICY "Users can view their own prompts"
ON prompts FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: 認証済みユーザーのみ作成可能
CREATE POLICY "Users can create their own prompts"
ON prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分のプロンプトのみ更新可能
CREATE POLICY "Users can update their own prompts"
ON prompts FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: 自分のプロンプトのみ削除可能
CREATE POLICY "Users can delete their own prompts"
ON prompts FOR DELETE
USING (auth.uid() = user_id);
```

### データベーススキーマ

```sql
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
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);
```

### 移行チェックリスト

- [ ] Supabaseプロジェクト作成
- [ ] `prompts`テーブル作成
- [ ] RLSポリシー設定
- [ ] インデックス作成
- [ ] 環境変数設定（.env.local）
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Supabase Client初期化（src/lib/supabase.ts）
- [ ] `mockPromptService.ts` → `promptService.ts`への移行
  - 各メソッドをSupabase APIに置き換え
  - エラーハンドリング追加
- [ ] 型定義の確認（Supabase生成型との整合性）
- [ ] 統合テスト実施
- [ ] モックサービス削除

---

## 関連ファイル

- **モックサービス**: `frontend/src/services/api/mockPromptService.ts`
- **カスタムフック**: `frontend/src/hooks/usePromptList.ts`
- **ページコンポーネント**: `frontend/src/pages/user/PromptListPage.tsx`
- **型定義**: `frontend/src/types/index.ts`

---

**作成日**: 2026-01-17
**バージョン**: 1.0
**対象ページ**: P-002（プロンプト一覧・検索ページ）
