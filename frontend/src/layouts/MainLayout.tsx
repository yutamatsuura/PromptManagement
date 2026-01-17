/**
 * MainLayout
 * 認証後ページ用レイアウト（Dashboard等）
 * Header + レスポンシブDrawer
 */

import { type ReactNode, useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 240;

export function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Header onMenuClick={handleDrawerToggle} showMenuIcon={isMobile} />

      {/* サイドバー（モバイル用 temporary） */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <Sidebar />
        </Drawer>
      )}

      {/* サイドバー（デスクトップ用 permanent） */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      )}

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Box sx={{ height: 64 }} /> {/* Toolbarの高さ分のスペーサー */}
        {children}
      </Box>
    </Box>
  );
}
