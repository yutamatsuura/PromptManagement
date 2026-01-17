import type { ThemeOptions } from '@mui/material/styles';

/**
 * ブルーハイコントラストテーマのカラーパレット
 * - 濃紺背景 + 白テキスト + 明るい水色アクセント
 * - クリアな視認性と落ち着いた雰囲気
 */
export const palette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: {
    main: '#00d4ff',      // 明るい水色（メインアクセント）
    light: '#5dffff',     // より明るい水色
    dark: '#0099cc',      // やや暗い水色
    contrastText: '#001f3f', // 濃紺（テキスト用）
  },
  secondary: {
    main: '#0099cc',      // やや暗い水色（セカンダリ）
    light: '#00d4ff',     // 明るい水色
    dark: '#006b99',      // さらに暗い水色
    contrastText: '#ffffff', // 白（テキスト用）
  },
  error: {
    main: '#ff6b6b',      // 柔らかい赤（エラー）
    light: '#ff9999',     // 明るい赤
    dark: '#cc5555',      // 暗い赤
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ffa500',      // オレンジ（警告）
    light: '#ffcc66',     // 明るいオレンジ
    dark: '#cc8400',      // 暗いオレンジ
    contrastText: '#ffffff',
  },
  info: {
    main: '#00d4ff',      // 水色（情報）
    light: '#5dffff',     // 明るい水色
    dark: '#0099cc',      // やや暗い水色
    contrastText: '#001f3f',
  },
  success: {
    main: '#4caf50',      // 緑（成功）
    light: '#80e27e',     // 明るい緑
    dark: '#357a38',      // 暗い緑
    contrastText: '#ffffff',
  },
  background: {
    default: '#001f3f',   // 濃紺（メイン背景）
    paper: '#002855',     // やや明るい濃紺（カード/パネル背景）
  },
  text: {
    primary: '#ffffff',   // 白（メインテキスト）
    secondary: 'rgba(255, 255, 255, 0.7)', // 半透明白（サブテキスト）
    disabled: 'rgba(255, 255, 255, 0.3)',  // さらに薄い白（無効状態）
  },
  divider: 'rgba(255, 255, 255, 0.12)',    // 薄い白（区切り線）
  action: {
    active: '#00d4ff',                      // 水色（アクティブ状態）
    hover: 'rgba(0, 212, 255, 0.08)',       // 薄い水色（ホバー）
    selected: 'rgba(0, 212, 255, 0.16)',    // 少し濃い水色（選択状態）
    disabled: 'rgba(255, 255, 255, 0.3)',   // 薄い白（無効状態）
    disabledBackground: 'rgba(255, 255, 255, 0.12)', // さらに薄い白（無効背景）
  },
};
