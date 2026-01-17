/**
 * SettingsPage
 * 設定ページ
 */

import { Typography, Paper } from '@mui/material';
import { MainLayout } from '../layouts/MainLayout';

export function SettingsPage() {
  return (
    <MainLayout>
      <Typography variant="h4" gutterBottom>
        設定
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          統計情報、データエクスポート/インポート、ログアウト、アカウント削除機能はPhase 4で実装されます。
        </Typography>
      </Paper>
    </MainLayout>
  );
}
