/**
 * PublicLayout
 * 公開ページ用レイアウト（Login/PasswordReset等）
 */

import { type ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Paper } from '@mui/material';

interface PublicLayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
}

export function PublicLayout({ children, maxWidth = 'sm', title }: PublicLayoutProps) {
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PromptManagement
          </Typography>
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
            {title && (
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ mb: 3, textAlign: 'center' }}
              >
                {title}
              </Typography>
            )}
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
