/**
 * Error Boundary
 * Reactコンポーネントのエラーを捕捉し、フォールバックUIを表示
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { logger } from '../lib/logger';
import { captureException } from '../lib/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーが発生したことを示す状態を返す
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラーログを記録
    logger.error('Error Boundary捕捉:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    // 状態を更新（エラー詳細を保存）
    this.setState({
      error,
      errorInfo,
    });

    // Sentryにエラーを送信
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = (): void => {
    // ページをリロード
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom color="error">
                エラーが発生しました
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                予期しないエラーが発生しました。ページをリロードして再試行してください。
              </Typography>
            </Box>

            {/* 開発環境のみエラー詳細を表示 */}
            {import.meta.env.DEV && this.state.error && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'left',
                  overflowX: 'auto',
                }}
              >
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo &&
                    `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={this.handleReload}
              sx={{ mt: 3 }}
            >
              ページをリロード
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
