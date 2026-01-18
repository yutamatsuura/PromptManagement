# デプロイメントガイド

## 📋 概要

このドキュメントは、PromptManagementアプリケーションをVercelにデプロイする手順を記載しています。

---

## 🚀 Vercel デプロイ設定

### プロジェクト情報

- **プロジェクト名**: `myprompt-management`
- **本番URL**: https://myprompt-management.vercel.app
- **フレームワーク**: Vite (React 19 + TypeScript)
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist`

### 環境変数（本番環境）

以下の環境変数がVercelに設定されています：

```bash
VITE_SUPABASE_URL=https://hfhwiqpilzrjhjlbkqdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SENTRY_DSN=https://af14f320fa14158168786a4f81c671a2@o4510729958588416.ingest.us.sentry.io/4510729966583808
VITE_SENTRY_ENVIRONMENT=production
```

---

## 🔧 ローカル設定ファイル

### 1. `.vercel/project.json`

プロジェクトIDとプロジェクト名を管理：

```json
{
  "projectId": "prj_7IEY4wBDLhmOGXajEuS7cGyvSG9q",
  "orgId": "team_LAyd7W2TSTXeBqRkUeMBjhlb",
  "projectName": "myprompt-management"
}
```

### 2. `vercel.json`

Vercelビルド設定とセキュリティヘッダー：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**重要な設定**:
- `rewrites`: SPAルーティング対応（すべてのルートを`/index.html`にリダイレクト）
- `headers`: セキュリティヘッダー（XSS保護、フレーム埋め込み防止）

### 3. `package.json`

```json
{
  "name": "myprompt-management",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

---

## 📦 デプロイ手順

### 方法1: Vercel CLI（推奨）

```bash
# 1. frontendディレクトリに移動
cd frontend

# 2. ローカルビルドテスト
npm run build

# 3. 本番デプロイ
vercel --prod
```

### 方法2: Git Push（自動デプロイ）

```bash
# 1. 変更をコミット
git add .
git commit -m "デプロイメッセージ"

# 2. GitHubにプッシュ
git push origin main

# → Vercelが自動的に検知してデプロイ開始
```

---

## ✅ デプロイ確認チェックリスト

デプロイ後、以下を確認してください：

### 1. アプリケーション動作確認

- [ ] https://myprompt-management.vercel.app にアクセス
- [ ] ログインページが表示される
- [ ] ログインできる（matsuura.yuta@gmail.com / ia0110299）
- [ ] プロンプト一覧が表示される
- [ ] プロンプトの作成・編集・削除が動作する
- [ ] 検索・フィルター機能が動作する
- [ ] タグ選択機能が動作する

### 2. 技術的確認

```bash
# HTTPステータス確認
curl -I https://myprompt-management.vercel.app

# 期待される結果: HTTP/2 200

# セキュリティヘッダー確認
curl -I https://myprompt-management.vercel.app | grep -E "X-Content-Type-Options|X-Frame-Options|X-XSS-Protection"

# 期待される結果:
# x-content-type-options: nosniff
# x-frame-options: DENY
# x-xss-protection: 1; mode=block
```

### 3. Sentry エラー追跡

- [ ] https://sentry.io にログイン
- [ ] プロジェクト「promptmanagement-frontend」を開く
- [ ] エラーが発生した場合、Sentryに記録されている

---

## 🔄 ロールバック手順

問題が発生した場合、以前のデプロイメントにロールバックできます：

```bash
# 1. デプロイメント履歴確認
vercel ls

# 2. 特定のデプロイメントをプロモート
vercel promote <deployment-url>
```

または、Vercel Web UI:
1. https://vercel.com/yutamatsuuras-projects/myprompt-management にアクセス
2. 「Deployments」タブを開く
3. ロールバックしたいデプロイメントの「...」→「Promote to Production」

---

## 🐛 トラブルシューティング

### ビルドエラー

```bash
# TypeScriptエラー
npm run type-check

# Lintエラー
npm run lint
```

### 環境変数エラー

```bash
# 環境変数確認
vercel env ls

# 環境変数追加
vercel env add VITE_SUPABASE_URL production
```

### キャッシュクリア

```bash
# Vercelビルドキャッシュをクリアして再デプロイ
vercel --prod --force
```

---

## 📊 パフォーマンス指標

### バンドルサイズ（最適化済み）

- **react-vendor**: 47.57 kB (gzip: 16.94 kB)
- **supabase-vendor**: 170.40 kB (gzip: 44.44 kB)
- **mui-vendor**: 285.44 kB (gzip: 86.64 kB)
- **index**: 483.52 kB (gzip: 154.94 kB)

**合計gzipサイズ**: ~303 kB（初回ロード）

### ビルド時間

- **ローカル**: ~30-40秒
- **Vercel**: ~25-35秒（キャッシュあり）

---

## 🔐 セキュリティ

### HTTPS

- ✅ すべてのトラフィックが自動的にHTTPSにリダイレクト
- ✅ Vercel提供のSSL証明書（自動更新）

### セキュリティヘッダー

- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`

### 環境変数

- ✅ すべての機密情報（API キー、DSN）は環境変数で管理
- ✅ `.env.local` はgitignoreに追加済み

---

## 📝 更新履歴

- **2026-01-18**: プロジェクト名を`frontend`→`myprompt-management`に変更
- **2026-01-18**: `vercel.json`作成、セキュリティヘッダー追加
- **2026-01-18**: 本番アカウント作成（matsuura.yuta@gmail.com）
- **2026-01-18**: デモアカウント情報をログイン画面から削除
- **2026-01-18**: デプロイ設定完了、テストデプロイ成功確認
- **2026-01-18**: ロゴ実装（全ページ対応）
- **2026-01-18**: ローディングスピナー実装（ログイン後・リロード対応）
- **2026-01-18**: プロジェクト完了、本番稼働開始

---

## 🎉 プロジェクト完了

**完了日**: 2026-01-18
**ステータス**: ✅ 本番稼働中
**本番URL**: https://myprompt-management.vercel.app

すべての機能実装完了、E2Eテスト29項目Pass（100%）

---

**最終確認日**: 2026-01-18
**次回レビュー推奨日**: 定期メンテナンス時
