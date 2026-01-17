/**
 * PromptFormPage
 * プロンプト作成・編集ページ
 */

import { Typography, Paper } from '@mui/material';
import { MainLayout } from '../layouts/MainLayout';

export function PromptFormPage() {
  return (
    <MainLayout>
      <Typography variant="h4" gutterBottom>
        プロンプト作成
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          プロンプト作成・編集機能はPhase 4で実装されます。
        </Typography>
      </Paper>
    </MainLayout>
  );
}
