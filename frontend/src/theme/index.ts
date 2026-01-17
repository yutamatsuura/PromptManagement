import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';

/**
 * ブルーハイコントラストテーマ
 *
 * デザイン特徴:
 * - 濃紺背景 + 白テキスト + 明るい水色アクセント
 * - クリアな視認性と落ち着いた雰囲気
 * - わずかな丸み(border-radius: 4px)で柔らかさを演出
 * - 長時間作業に適した配色
 *
 * 使用方法:
 * ```tsx
 * import { ThemeProvider } from '@mui/material/styles';
 * import theme from './theme';
 *
 * function App() {
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <YourComponent />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
const theme = createTheme({
  palette,
  typography,
  components,
  shape: {
    borderRadius: 4, // グローバルなborder-radius設定
  },
  spacing: 8, // デフォルトのスペーシング単位（8pxベース）
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});

export default theme;
