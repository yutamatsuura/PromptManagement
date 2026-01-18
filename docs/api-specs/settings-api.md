# 設定ページ API仕様書

生成日: 2026-01-17
収集元: frontend/src/pages/user/SettingsPage.tsx
@MOCK_TO_APIマーク数: 4
@BACKEND_COMPLEXマーク数: 0

## エンドポイント一覧

### 1. 統計情報取得
- **エンドポイント**: `GET /api/statistics`
- **説明**: ユーザーの統計情報を取得
- **Request**: なし
- **Response**: `Statistics`
- **実装箇所**: `SettingsPage.tsx:49` (`loadStatistics()`)

```typescript
// Response型定義
Statistics = {
  total_prompts: number;  // 総プロンプト数
  total_tags: number;     // タグ数
  favorite_count: number; // お気に入り数
}
```

**取得ロジック**:
- ユーザーIDは認証トークンから取得
- プロンプトテーブルから集計クエリ実行
- タグは重複を除外してカウント

---

### 2. データエクスポート
- **エンドポイント**: `GET /api/export`
- **説明**: 全プロンプトデータをJSON形式で取得
- **Request**: なし
- **Response**: `ExportData`
- **実装箇所**: `SettingsPage.tsx:67` (`handleExport()`)

```typescript
// Response型定義
ExportData = {
  version: string;        // フォーマットバージョン（"1.0"）
  exported_at: string;    // エクスポート日時（ISO8601）
  prompts: Prompt[];      // プロンプト配列
}
```

**処理フロー**:
1. 認証トークンからユーザーIDを取得
2. ユーザーの全プロンプトを取得
3. ExportData形式に変換して返却
4. クライアント側でBlobとしてダウンロード

---

### 3. データインポート
- **エンドポイント**: `POST /api/import`
- **説明**: JSONファイルからプロンプトをインポート
- **Request**: `ExportData`
- **Response**: `ImportResult`
- **実装箇所**: `SettingsPage.tsx:108` (`handleImport()`)

```typescript
// Request型定義
ExportData = {
  version: string;
  exported_at: string;
  prompts: Prompt[];
}

// Response型定義
ImportResult = {
  success: boolean;
  imported_count: number;  // インポート成功件数
  failed_count: number;    // インポート失敗件数
  errors?: string[];       // エラーメッセージ配列
}
```

**バリデーション**:
- `version`フィールド必須
- `prompts`が配列であること
- 各プロンプトの必須フィールド検証（title, content）

**処理フロー**:
1. リクエストボディのバリデーション
2. 各プロンプトの形式チェック
3. 既存データと重複チェック（オプション）
4. データベースへ一括挿入
5. インポート結果を返却

---

### 4. アカウント削除
- **エンドポイント**: `DELETE /api/account`
- **説明**: ユーザーアカウントと全データを削除
- **Request**: なし
- **Response**: `void`
- **実装箇所**: `SettingsPage.tsx:196` (`handleDeleteAccount()`)

```typescript
// Response
void (204 No Content)
```

**処理フロー**:
1. 認証トークンからユーザーIDを取得
2. ユーザーの全プロンプトを削除
3. ユーザーアカウントを削除
4. 成功時は204 No Contentを返却

**セキュリティ**:
- この操作は取り消し不可
- クライアント側で「削除」という文字列入力による確認必須
- トランザクション処理でデータ整合性を保証

---

## 認証

### ヘッダー
```yaml
Authorization: Bearer <token>
```

### エラーレスポンス
```typescript
{
  error: {
    code: string;      // エラーコード
    message: string;   // エラーメッセージ
  }
}
```

**想定エラー**:
- `400 Bad Request`: バリデーションエラー（インポートデータ不正）
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: サーバーエラー

---

## 実装優先度

1. **高**: 統計情報取得、データエクスポート
2. **中**: データインポート
3. **低**: アカウント削除（危険な操作のため慎重に実装）

---

## 実装時の注意点

### データエクスポート
- 大量データの場合、ストリーミングレスポンス推奨
- タイムアウト設定を長めに（最大5分）

### データインポート
- ファイルサイズ制限: 最大10MB
- インポート処理は非同期推奨（大量データ対応）
- 既存データとの重複処理方針を決定（上書き/スキップ/エラー）

### アカウント削除
- Supabaseの場合、RLS（Row Level Security）で自動的にプロンプトも削除
- `CASCADE DELETE`の設定確認必須
- ソフトデリート（論理削除）も検討可能

---

## Supabase実装例

### 統計情報取得
```sql
-- RPC関数として実装
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_prompts', COUNT(*),
    'total_tags', COUNT(DISTINCT unnest(tags)),
    'favorite_count', COUNT(*) FILTER (WHERE is_favorite = TRUE)
  ) INTO result
  FROM prompts
  WHERE user_id = user_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### データエクスポート
```typescript
// Supabase Clientでの実装例
const { data, error } = await supabase
  .from('prompts')
  .select('*')
  .order('created_at', { ascending: false });

const exportData: ExportData = {
  version: '1.0',
  exported_at: new Date().toISOString(),
  prompts: data || [],
};
```

### データインポート
```typescript
// バッチ挿入
const { error } = await supabase
  .from('prompts')
  .insert(importData.prompts);
```

### アカウント削除
```typescript
// SupabaseのAuth APIを使用
const { error } = await supabase.auth.admin.deleteUser(userId);
// RLSにより、promptsテーブルのデータも自動削除される
```
