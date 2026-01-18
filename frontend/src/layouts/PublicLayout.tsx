/**
 * PublicLayout
 * 公開ページ用レイアウト（Login/PasswordReset等）
 */

import { type ReactNode } from 'react';
import { Box, AppBar, Toolbar, Container, Paper } from '@mui/material';

interface PublicLayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function PublicLayout({ children, maxWidth = 'sm' }: PublicLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* ヘッダー */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo.png"
              alt="Prompt Management"
              style={{
                height: '40px',
                width: 'auto',
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth={maxWidth}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
