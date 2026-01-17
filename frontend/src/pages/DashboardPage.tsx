/**
 * DashboardPage
 * プロンプト一覧・検索ページ
 */

import { Typography, Paper } from '@mui/material';
import { MainLayout } from '../layouts/MainLayout';

export function DashboardPage() {
  return (
    <MainLayout>
      <Typography variant="h4" gutterBottom>
        プロンプト一覧
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          プロンプト一覧・検索機能はPhase 4で実装されます。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          現在表示しているのは基盤構築完了時の骨格です。
        </Typography>
      </Paper>
    </MainLayout>
  );
}
