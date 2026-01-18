# PromptManagement

AI時代のプロンプト管理を効率化する、個人向けプロンプト管理システム

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tests](https://img.shields.io/badge/E2E%20tests-29%2F29%20pass-brightgreen)

## 🌟 主な機能

### プロンプト管理
- ✅ プロンプトの作成・編集・削除
- ✅ ワンクリックコピー機能
- ✅ お気に入り設定
- ✅ タグ管理（最大10個、既存タグから選択可能）

### 検索・フィルタリング
- 🔍 テキスト検索（タイトル・説明・本文）
- 🏷️ タグフィルター（複数選択可能）
- ⭐ お気に入り絞り込み
- ⚡ デバウンス処理による高速検索

### データ管理
- 📊 統計情報表示（総数・タグ数・お気に入り数）
- 💾 データエクスポート/インポート（JSON形式）
- 🔐 安全なアカウント管理

## 🚀 本番環境

**URL**: https://myprompt-management.vercel.app

### ログイン情報
- **メールアドレス**: matsuura.yuta@gmail.com
- **パスワード**: ia0110299

## 🛠️ 技術スタック

### フロントエンド
- **React 19** - 最新のReactフレームワーク
- **TypeScript 5** - 型安全な開発
- **Material-UI v7** - モダンなUIコンポーネント
- **Vite 5** - 高速ビルドツール
- **React Router v6** - クライアントサイドルーティング
- **Zustand** - 軽量な状態管理

### バックエンド
- **Supabase** - Backend as a Service
- **PostgreSQL** - リレーショナルデータベース
- **Row Level Security** - データベースレベルのアクセス制御

### インフラ・デプロイ
- **Vercel** - 本番環境ホスティング
- **Sentry** - エラー追跡
- **GitHub** - ソースコード管理

## 📁 プロジェクト構成

```
PromptManagement/
├── frontend/                 # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/      # 共通コンポーネント
│   │   ├── contexts/        # Reactコンテキスト
│   │   ├── hooks/           # カスタムフック
│   │   ├── layouts/         # レイアウトコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # API・認証サービス
│   │   ├── stores/          # 状態管理
│   │   └── types/           # TypeScript型定義
│   ├── tests/               # テストコード
│   │   ├── e2e/             # E2Eテスト（Playwright）
│   │   ├── integration/     # 統合テスト
│   │   └── utils/           # テストユーティリティ
│   └── public/              # 静的ファイル
├── supabase/                # Supabaseスキーマ
│   └── migrations/          # DBマイグレーション
├── docs/                    # ドキュメント
│   ├── API_SPECIFICATION.md
│   ├── DEPLOYMENT.md
│   ├── SCOPE_PROGRESS.md
│   └── PROJECT_COMPLETION.md
└── CLAUDE.md                # プロジェクト設定
```

## 🏃‍♂️ ローカル開発

### 前提条件
- Node.js 18以上
- npm 9以上

### セットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/yourusername/PromptManagement.git
cd PromptManagement
```

2. **依存関係のインストール**
```bash
cd frontend
npm install
```

3. **環境変数の設定**
```bash
# .env.localファイルを作成
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **開発サーバーの起動**
```bash
npm run dev
```

アプリケーションは http://localhost:3347 で起動します。

### ビルド
```bash
npm run build
```

### テスト実行
```bash
# E2Eテスト
npm run test:e2e

# E2Eテスト（UIモード）
npm run test:e2e:ui
```

## 📊 品質指標

### テストカバレッジ
- ✅ **E2Eテスト**: 29/29項目 Pass (100%)
- ✅ **ユニットテスト**: 主要コンポーネント実装済み
- ✅ **統合テスト**: 全API実装済み

### パフォーマンス
- 📦 **バンドルサイズ（gzip）**: ~303KB
- ⚡ **ビルド時間**: ~20-30秒
- 🚀 **初回ロード**: 最適化済み

### セキュリティ
- 🔒 HTTPS強制
- 🛡️ セキュリティヘッダー設定
- 🔐 環境変数による機密情報管理
- 👮 Row Level Security (RLS)
- 🎫 JWT認証

## 📚 ドキュメント

- [API仕様書](docs/API_SPECIFICATION.md)
- [デプロイメントガイド](docs/DEPLOYMENT.md)
- [E2Eテスト進捗状況](docs/SCOPE_PROGRESS.md)
- [プロジェクト完了報告書](docs/PROJECT_COMPLETION.md)
- [プロジェクト設定](CLAUDE.md)

## 🎨 デザイン

- **テーマ**: ダークテーマ統一
- **カラー**: プライマリー #00E5FF（シアン）
- **フォント**: Noto Sans JP（日本語）

## 🔄 デプロイフロー

### 自動デプロイ
```bash
# mainブランチへのプッシュで自動デプロイ
git push origin main
```

### 手動デプロイ
```bash
cd frontend
npm run build
vercel --prod
```

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 ライセンス

このプロジェクトは個人利用を目的としています。

## 👤 開発者

**Claude Code**

## 🎉 プロジェクト完了

**完了日**: 2026-01-18
**ステータス**: ✅ 本番稼働中

すべての要件を満たし、高品質なプロダクトとして本番環境で稼働しています。

---

**最終更新**: 2026-01-18
