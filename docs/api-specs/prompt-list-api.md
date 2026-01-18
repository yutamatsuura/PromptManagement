# プロンプト一覧・検索ページ API仕様書

生成日: 2026-01-17
収集元: frontend/src/services/api/mockPromptService.ts
@MOCK_TO_APIマーク数: 6
@BACKEND_COMPLEXマーク数: 0

## エンドポイント一覧

### 1. プロンプト一覧取得
- **エンドポイント**: `GET /api/prompts`
- **説明**: ユーザーの全プロンプトを取得（更新日時降順）
- **Request**: なし
- **Response**: `Prompt[]`
- **実装箇所**: `mockPromptService.ts:78` (`getList()`)

```typescript
// Response型定義
Prompt[] = [
  {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
    created_at: string; // ISO8601
    updated_at: string; // ISO8601
  }
]
```

---

### 2. フィルタリングされたプロンプト取得
- **エンドポイント**: `GET /api/prompts?filter=...`
- **説明**: フィルタ条件に基づいてプロンプトを取得
- **Request**: クエリパラメータ `filter` (JSON文字列)
- **Response**: `Prompt[]`
- **実装箇所**: `mockPromptService.ts:101` (`getFilteredList()`)

```typescript
// Request型定義（クエリパラメータ）
PromptFilter = {
  searchQuery?: string;      // テキスト検索クエリ
  tags?: string[];           // タグフィルタ
  tagMode?: 'AND' | 'OR';    // タグ検索モード
  isFavorite?: boolean;      // お気に入り絞り込み
}

// Response型定義
Prompt[]
```

**フィルタロジック**:
1. `isFavorite: true` → `is_favorite`フィールドがtrueのものだけ
2. `tags` + `tagMode: 'AND'` → 全てのタグを含むプロンプト
3. `tags` + `tagMode: 'OR'` → いずれかのタグを含むプロンプト
4. `searchQuery` → タイトル、説明、本文のいずれかにマッチ（大文字小文字無視）

---

### 3. プロンプト作成
- **エンドポイント**: `POST /api/prompts`
- **説明**: 新規プロンプトを作成
- **Request**: `PromptInput`
- **Response**: `Prompt`
- **実装箇所**: `mockPromptService.ts:157` (`create()`)

```typescript
// Request型定義
PromptInput = {
  title: string;             // 必須、最大200文字
  description?: string;      // 任意、最大500文字
  content: string;           // 必須、最大10000文字
  tags: string[];            // 配列、最大10個
  is_favorite: boolean;      // デフォルト: false
}

// Response型定義
Prompt
```

**バリデーション**:
- `title`: 1文字以上200文字以内
- `content`: 1文字以上10000文字以内
- `tags`: 最大10要素、各要素50文字以内

---

### 4. プロンプト更新
- **エンドポイント**: `PUT /api/prompts/:id`
- **説明**: 既存プロンプトを更新
- **Request**: `Partial<PromptInput>`
- **Response**: `Prompt`
- **実装箇所**: `mockPromptService.ts:190` (`update()`)

```typescript
// Request型定義
Partial<PromptInput> = {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  is_favorite?: boolean;
}

// Response型定義
Prompt
```

**更新仕様**:
- `updated_at`は自動更新
- 部分更新対応（渡されたフィールドのみ更新）

---

### 5. プロンプト削除
- **エンドポイント**: `DELETE /api/prompts/:id`
- **説明**: プロンプトを削除
- **Request**: なし（URLパスパラメータのみ）
- **Response**: `void`
- **実装箇所**: `mockPromptService.ts:219` (`delete()`)

```typescript
// Response
void (204 No Content)
```

---

### 6. 全タグ取得
- **エンドポイント**: `GET /api/prompts/tags`
- **説明**: ユーザーが使用している全タグを取得
- **Request**: なし
- **Response**: `string[]`
- **実装箇所**: `mockPromptService.ts:242` (`getAllTags()`)

```typescript
// Response型定義
string[] = ['AI', 'Code', 'Writing', 'Marketing', 'Research']
```

**取得ロジック**:
- 全プロンプトのタグを収集
- 重複を除外したユニークなタグ配列を返す

---

## モックサービス参照
```typescript
// 実装時はこのモックサービスの挙動を参考にする
frontend/src/services/api/mockPromptService.ts
```

## 型定義参照
```typescript
// 全ての型定義は以下のファイルに集約
frontend/src/types/index.ts
```

---

## API統合時の注意点

### 認証
- 全エンドポイントは認証必須
- リクエストヘッダーに `Authorization: Bearer <token>` を含める
- ユーザーIDは認証トークンから取得（リクエストボディに含めない）

### エラーハンドリング
```typescript
// エラーレスポンス共通形式
{
  error: {
    code: string;      // エラーコード
    message: string;   // エラーメッセージ
  }
}
```

**想定エラー**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: プロンプトが見つからない
- `500 Internal Server Error`: サーバーエラー

### ページング（将来拡張）
現在のモック実装ではページングなし（全件取得）。
API実装時は以下のクエリパラメータで対応予定：
- `limit`: 取得件数（デフォルト: 100）
- `offset`: スキップ件数（デフォルト: 0）

---

## 実装優先度

1. **高**: プロンプト一覧取得、フィルタリング、削除
2. **中**: プロンプト作成、更新
3. **低**: 全タグ取得（クライアント側で代替可能）
