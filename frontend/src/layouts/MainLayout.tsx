/**
 * MainLayout
 * 認証後ページ用レイアウト
 * Header + メインコンテンツ（サイドバーなし）
 */

import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
        }}
      >
        <Box sx={{ height: 64 }} /> {/* Toolbarの高さ分のスペーサー */}
        {children}
      </Box>
    </Box>
  );
}
