# デプロイメントガイド

**プロジェクト名**: PromptManagement
**技術スタック**: React 19 + Supabase + Vite
**推奨ホスティング**: Vercel / Netlify

---

## 📋 目次

1. [前提条件](#前提条件)
2. [環境変数の設定](#環境変数の設定)
3. [Vercelへのデプロイ](#vercelへのデプロイ)
4. [Netlifyへのデプロイ](#netlifyへのデプロイ)
5. [デプロイ後の確認](#デプロイ後の確認)
6. [トラブルシューティング](#トラブルシューティング)
7. [ロールバック手順](#ロールバック手順)

---

## 前提条件

### 必須アカウント

- ✅ GitHubアカウント（リポジトリ連携）
- ✅ Supabaseプロジェクト（バックエンド）
- ✅ Vercel または Netlifyアカウント（ホスティング）
- ✅ Sentryアカウント（エラー追跡、オプション）

### ローカル環境での動作確認

デプロイ前に必ずローカル環境でテストしてください。

```bash
# 1. 依存関係のインストール
npm install

# 2. 型チェック
npm run type-check

# 3. ビルドテスト
npm run build

# 4. ビルドプレビュー
npm run preview
```

---

## 環境変数の設定

### 必須環境変数

以下の環境変数をデプロイ先（Vercel/Netlify）に設定してください。

| 変数名 | 説明 | 例 |
|--------|------|---|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名キー（公開OK） | `eyJhbGciOiJIUzI1NiIsInR...` |
| `VITE_SENTRY_DSN` | Sentry DSN（オプション） | `https://xxx@o0.ingest.sentry.io/xxx` |
| `VITE_SENTRY_ENVIRONMENT` | Sentry環境名 | `production` |

### 環境変数の取得方法

#### Supabase

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. `Settings` → `API` に移動
4. `Project URL`と`anon public`キーをコピー

#### Sentry

1. [Sentryダッシュボード](https://sentry.io)にログイン
2. プロジェクトを選択
3. `Settings` → `Client Keys (DSN)` に移動
4. DSN（公開キー）をコピー

---

## Vercelへのデプロイ

### 方法1: Vercel CLI（推奨）

```bash
# 1. Vercel CLIをインストール
npm install -g vercel

# 2. ログイン
vercel login

# 3. プロジェクトをリンク（初回のみ）
vercel link

# 4. 環境変数を設定（初回のみ）
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SENTRY_DSN production
vercel env add VITE_SENTRY_ENVIRONMENT production

# 5. デプロイ（本番環境）
vercel --prod

# プレビューデプロイ（ステージング）
vercel
```

### 方法2: Vercel Dashboard（GUI）

1. [Vercelダッシュボード](https://vercel.com/dashboard)にログイン
2. `Add New` → `Project` をクリック
3. GitHubリポジトリをインポート
4. `Framework Preset`: `Vite` を選択
5. `Root Directory`: `frontend` を設定
6. `Build Command`: `npm run build`
7. `Output Directory`: `dist`
8. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN` (オプション)
   - `VITE_SENTRY_ENVIRONMENT` = `production`
9. `Deploy` ボタンをクリック

### Vercel設定ファイル（vercel.json）

プロジェクトルートに以下のファイルを作成すると、デプロイ設定が自動化されます。

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
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
          "value": "SAMEORIGIN"
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

---

## Netlifyへのデプロイ

### 方法1: Netlify CLI

```bash
# 1. Netlify CLIをインストール
npm install -g netlify-cli

# 2. ログイン
netlify login

# 3. プロジェクトを初期化（初回のみ）
netlify init

# 4. 環境変数を設定（初回のみ）
netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR..."
netlify env:set VITE_SENTRY_DSN "https://xxx@o0.ingest.sentry.io/xxx"
netlify env:set VITE_SENTRY_ENVIRONMENT "production"

# 5. デプロイ
netlify deploy --prod
```

### 方法2: Netlify Dashboard

1. [Netlifyダッシュボード](https://app.netlify.com)にログイン
2. `Add new site` → `Import an existing project`
3. GitHubリポジトリを選択
4. ビルド設定:
   - `Base directory`: `frontend`
   - `Build command`: `npm run build`
   - `Publish directory`: `frontend/dist`
5. 環境変数を設定（上記と同じ）
6. `Deploy site` をクリック

### Netlify設定ファイル（netlify.toml）

プロジェクトルートに以下のファイルを作成します。

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## デプロイ後の確認

### 1. サイトの動作確認

- ✅ ログインページが表示される
- ✅ ログイン機能が動作する
- ✅ プロンプト一覧・作成・編集・削除が動作する
- ✅ 設定ページが動作する

### 2. エラー監視の確認

- ✅ Sentryダッシュボードでイベントが記録されている
- ✅ ソースマップが正しくアップロードされている（エラーの行番号が正確）

### 3. パフォーマンス確認

```bash
# Lighthouse CI（オプション）
npm install -g @lhci/cli
lhci autorun --url=https://your-site.vercel.app
```

目標スコア:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

---

## トラブルシューティング

### ビルドエラー

#### エラー: `Module not found`

**原因**: 依存関係のインストール漏れ

**解決策**:
```bash
# package-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### エラー: `TypeScript compilation failed`

**原因**: 型エラー

**解決策**:
```bash
# 型チェックで詳細確認
npm run type-check
```

### デプロイ後のエラー

#### エラー: `Supabaseに接続できない`

**原因**: 環境変数の設定漏れ

**確認手順**:
1. Vercel/Netlifyダッシュボードで環境変数を確認
2. `VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が正しく設定されているか
3. 環境変数を更新した場合は再デプロイ必要

#### エラー: `Sentryにエラーが送信されない`

**原因**: Sentry DSNの設定漏れまたは誤り

**確認手順**:
1. `.env.local`のDSNが正しいか確認
2. Sentryダッシュボードで`Client Keys (DSN)`を再確認
3. 環境変数`VITE_SENTRY_DSN`を正しく設定

### SPA Routingエラー（404）

**症状**: `/prompts/edit/123`などのURLで直接アクセスすると404エラー

**原因**: サーバーサイドでのSPAルーティング設定漏れ

**解決策**:

#### Vercel
`vercel.json`の`rewrites`設定を確認（上記参照）

#### Netlify
`netlify.toml`の`redirects`設定を確認（上記参照）

---

## ロールバック手順

### Vercel

#### 方法1: Dashboard

1. Vercelダッシュボードを開く
2. `Deployments`タブに移動
3. ロールバック先のデプロイを選択
4. `⋯`メニュー → `Promote to Production`

#### 方法2: CLI

```bash
# 過去のデプロイ一覧を表示
vercel ls

# 特定のデプロイをプロモート
vercel promote [deployment-url]
```

### Netlify

#### Dashboard

1. Netlifyダッシュボードを開く
2. `Deploys`タブに移動
3. ロールバック先のデプロイを選択
4. `Publish deploy`ボタンをクリック

---

## CI/CD自動化（推奨）

### GitHub Actions設定例

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install
        working-directory: ./frontend

      - name: Type check
        run: npm run type-check
        working-directory: ./frontend

      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          VITE_SENTRY_ENVIRONMENT: production

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## セキュリティチェックリスト

デプロイ前に以下を確認してください。

- ✅ `.env.local`ファイルが`.gitignore`に含まれている
- ✅ Supabase RLSポリシーが正しく設定されている
- ✅ 環境変数がVercel/Netlifyで正しく設定されている
- ✅ CORS設定が適切（Supabaseダッシュボードで確認）
- ✅ Sentryでエラー通知が動作している

---

## 参考リンク

- [Viteデプロイガイド](https://vitejs.dev/guide/static-deploy.html)
- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Netlify公式ドキュメント](https://docs.netlify.com)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Sentry公式ドキュメント](https://docs.sentry.io)

---

**最終更新**: 2026-01-18
**バージョン**: 1.0.0
