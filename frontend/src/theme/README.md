# ブルーハイコントラストテーマ

## 概要

濃紺背景 + 白テキスト + 明るい水色アクセントの、クリアな視認性と落ち着いた雰囲気を持つMUIテーマです。

## デザイン特徴

- **背景色**: 濃紺 (#001f3f) - 落ち着いた雰囲気
- **テキスト色**: 白 (#ffffff) - 高い視認性
- **アクセントカラー**: 明るい水色 (#00d4ff) - クリアで爽やか
- **border-radius**: 4px - わずかな丸みで柔らかさを演出
- **長時間作業に適した配色**

## ファイル構成

```
src/theme/
├── index.ts         # テーマのエントリポイント
├── palette.ts       # カラーパレット定義
├── typography.ts    # タイポグラフィ設定
└── components.ts    # コンポーネント別スタイル
```

## 使用方法

### 基本的な使い方

```tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* グローバルスタイルをリセット */}
      <YourComponent />
    </ThemeProvider>
  );
}
```

### コンポーネントでの使用例

```tsx
import { Box, Typography, Button, Card, CardContent } from '@mui/material';

function ExampleComponent() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1">見出し</Typography>
      <Typography variant="body1">本文テキスト</Typography>

      <Button variant="contained" color="primary">
        メインボタン
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5">カードタイトル</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
```

## カラーパレット

### Primary（メインアクセント）
- `main`: #00d4ff - 明るい水色
- `light`: #5dffff - より明るい水色
- `dark`: #0099cc - やや暗い水色

### Background（背景）
- `default`: #001f3f - 濃紺（メイン背景）
- `paper`: #002855 - やや明るい濃紺（カード/パネル）

### Text（テキスト）
- `primary`: #ffffff - 白（メインテキスト）
- `secondary`: rgba(255, 255, 255, 0.7) - 半透明白（サブテキスト）

## スタイルカスタマイズ

個別のコンポーネントのスタイルをカスタマイズする場合は、`components.ts`を編集してください。

```tsx
// components.ts に追加
MuiButton: {
  styleOverrides: {
    root: {
      // カスタムスタイル
    },
  },
},
```

## TypeScript型定義

このテーマは完全にTypeScriptに対応しており、型安全性が保証されています。

```tsx
import { Theme } from '@mui/material/styles';

// テーマオブジェクトは Theme 型
const theme: Theme = createTheme({...});
```

## ベストプラクティス

1. **CssBaseline の使用**: 必ず `<ThemeProvider>` 内で `<CssBaseline />` を使用してください
2. **sx プロパティの活用**: インラインスタイルは `sx` プロパティを使用してください
3. **テーマカラーの使用**: カスタムカラーは避け、テーマ定義のカラーを使用してください

```tsx
// ✅ 推奨
<Box sx={{ bgcolor: 'primary.main' }} />

// ❌ 非推奨
<Box sx={{ bgcolor: '#00d4ff' }} />
```

## トラブルシューティング

### 型エラーが発生する場合

```bash
# TypeScript の型チェック
npx tsc --noEmit
```

### テーマが適用されない場合

1. `ThemeProvider` でアプリ全体をラップしているか確認
2. `CssBaseline` を含めているか確認
3. ブラウザのキャッシュをクリア

## 参考リンク

- [MUI v6 公式ドキュメント](https://mui.com/)
- [Theme customization](https://mui.com/material-ui/customization/theming/)
