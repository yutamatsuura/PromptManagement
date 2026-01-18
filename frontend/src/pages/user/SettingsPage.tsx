/**
 * 設定ページ（P-004）
 * HTMLモックアップのMUI変換コメントに厳密に従った実装
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { Statistics, ExportData } from '@/types';
import * as settingsService from '@/services/api/settingsService';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [statistics, setStatistics] = useState<Statistics>({
    total_prompts: 0,
    total_tags: 0,
    favorite_count: 0,
  });
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  /**
   * 統計情報の読み込み（実API統合完了）
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getStatistics();
      setStatistics(data);
      logger.info('Statistics loaded', data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to load statistics', { error: error.message });
      setSnackbar({
        open: true,
        message: '統計情報の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に統計情報を読み込み
  useEffect(() => {
    loadStatistics();
  }, []);

  /**
   * データエクスポート（実API統合完了）
   */
  const handleExport = async () => {
    try {
      const exportData = await settingsService.exportData();

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // ファイル名形式: prompts_export_YYYYMMDD.json (E2E仕様書準拠)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      a.download = `prompts_export_${year}${month}${day}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `${exportData.prompts.length}件のプロンプトをエクスポートしました`,
        severity: 'success',
      });

      logger.info('Data exported', { count: exportData.prompts.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to export data', { error: error.message });
      setSnackbar({
        open: true,
        message: 'エクスポートに失敗しました',
        severity: 'error',
      });
    }
  };

  /**
   * データインポート（実API統合完了）
   */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const data: ExportData = JSON.parse(text);

        // バリデーション
        if (!data.version || !data.prompts || !Array.isArray(data.prompts)) {
          throw new Error('Invalid file format');
        }

        const result = await settingsService.importData(data);

        if (result.success) {
          setSnackbar({
            open: true,
            message: `${result.imported_count}件のプロンプトをインポートしました`,
            severity: 'success',
          });

          // 統計情報を再読み込み
          await loadStatistics();

          logger.info('Data imported', { count: result.imported_count });
        } else {
          throw new Error(
            result.errors?.join(', ') || 'インポートに失敗しました'
          );
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to import data', { error: error.message });
        setSnackbar({
          open: true,
          message: `インポートに失敗しました: ${error.message}`,
          severity: 'error',
        });
      }
    };

    input.click();
  };

  /**
   * ログアウト
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      logger.info('User logged out');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to logout', { error: error.message });
      setSnackbar({
        open: true,
        message: 'ログアウトに失敗しました',
        severity: 'error',
      });
    }
  };

  /**
   * アカウント削除（実API統合完了）
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '削除') {
      setSnackbar({
        open: true,
        message: '「削除」と入力してください',
        severity: 'error',
      });
      return;
    }

    try {
      await settingsService.deleteAccount();

      // アカウント削除後は自動的にサインアウトされる
      navigate('/login');

      logger.info('Account deleted');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete account', { error: error.message });
      setSnackbar({
        open: true,
        message: `アカウント削除に失敗しました: ${error.message}`,
        severity: 'error',
      });
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* ページタイトル */}
        <Box mb={4}>
          <Typography variant="h4">設定</Typography>
        </Box>

        {/* 統計情報セクション */}
        <Paper sx={{ p: 3, mb: 3, border: 3, borderColor: 'white' }}>
          <Typography variant="h6" mb={2}>
            統計情報
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" gap={3} flexWrap="wrap">
            {/* 総プロンプト数 */}
            <Paper
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                border: 2,
                borderColor: 'primary.main',
                textAlign: 'center',
                backgroundColor: '#003A5C',
              }}
            >
              <Typography variant="body2" color="text.secondary" mb={1}>
                総プロンプト数
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {statistics.total_prompts}
              </Typography>
            </Paper>

            {/* タグ数 */}
            <Paper
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                border: 2,
                borderColor: 'primary.main',
                textAlign: 'center',
                backgroundColor: '#003A5C',
              }}
            >
              <Typography variant="body2" color="text.secondary" mb={1}>
                タグ数
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {statistics.total_tags}
              </Typography>
            </Paper>

            {/* お気に入り数 */}
            <Paper
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                border: 2,
                borderColor: 'primary.main',
                textAlign: 'center',
                backgroundColor: '#003A5C',
              }}
            >
              <Typography variant="body2" color="text.secondary" mb={1}>
                お気に入り数
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {statistics.favorite_count}
              </Typography>
            </Paper>
            </Box>
          )}
        </Paper>

        {/* データ管理セクション */}
        <Paper sx={{ p: 3, mb: 3, border: 3, borderColor: 'white' }}>
          <Typography variant="h6" mb={2}>
            データ管理
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={handleExport}
              sx={{
                fontWeight: 700,
                fontFamily:
                  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
              }}
            >
              データをエクスポート (JSON)
            </Button>

            <Button
              variant="outlined"
              onClick={handleImport}
              sx={{
                fontWeight: 700,
                borderWidth: 3,
                fontFamily:
                  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                '&:hover': {
                  borderWidth: 3,
                },
              }}
            >
              データをインポート (JSON)
            </Button>
          </Box>
        </Paper>

        {/* アカウント管理セクション */}
        <Paper sx={{ p: 3, mb: 3, border: 3, borderColor: 'white' }}>
          <Typography variant="h6" mb={2}>
            アカウント管理
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                fontWeight: 700,
                borderWidth: 3,
                fontFamily:
                  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                '&:hover': {
                  borderWidth: 3,
                },
              }}
            >
              ログアウト
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                fontWeight: 700,
                fontFamily:
                  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
              }}
            >
              アカウントを削除
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" mt={2}>
            ※
            アカウント削除は取り消せません。全てのプロンプトデータが完全に削除されます。
          </Typography>
        </Paper>
      </Container>

      {/* アカウント削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle
          sx={{
            fontFamily:
              '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
          }}
        >
          アカウント削除の確認
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            mb={2}
            sx={{
              fontFamily:
                '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
            }}
          >
            この操作は取り消せません。本当にアカウントを削除しますか？
          </Typography>
          <Typography
            variant="body2"
            color="error"
            mb={2}
            sx={{
              fontFamily:
                '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
            }}
          >
            「削除」と入力して確認してください。
          </Typography>
          <TextField
            fullWidth
            label="確認"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="削除"
            sx={{
              '& .MuiInputBase-input': {
                fontFamily:
                  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmText('');
            }}
            sx={{
              fontFamily:
                '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
            }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== '削除'}
            sx={{
              fontFamily:
                '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
            }}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            fontFamily:
              '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default SettingsPage;
