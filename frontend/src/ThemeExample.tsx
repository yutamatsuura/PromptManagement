import { ThemeProvider, CssBaseline, Box, Typography, Button, Card, CardContent } from '@mui/material';
import theme from './theme';

/**
 * ブルーハイコントラストテーマのデモコンポーネント
 * - テーマの動作確認用
 */
function ThemeExample() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography variant="h1">ブルーハイコントラストテーマ</Typography>
        <Typography variant="body1">
          濃紺背景 + 白テキスト + 明るい水色アクセント
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary">
            メインボタン
          </Button>
          <Button variant="outlined" color="primary">
            アウトラインボタン
          </Button>
          <Button variant="text" color="primary">
            テキストボタン
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              カード例
            </Typography>
            <Typography variant="body2">
              わずかな丸み(border-radius: 4px)で柔らかさを演出
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

export default ThemeExample;
