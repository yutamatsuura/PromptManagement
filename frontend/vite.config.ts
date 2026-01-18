import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { PluginOption } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
    // Sentryソースマップアップロード（本番環境のみ）
    ...(process.env.NODE_ENV === 'production' && process.env.VITE_SENTRY_DSN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './dist/**',
            },
            telemetry: false,
          }),
        ]
      : []),
  ],
  server: {
    port: 3347, // CLAUDE.mdのポート設定
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連を分離
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // MUI関連を分離
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Supabase関連を分離
          'supabase-vendor': ['@supabase/supabase-js'],
          // その他のライブラリ
          'utils-vendor': ['zustand'],
        },
      },
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 500,
  },
});
