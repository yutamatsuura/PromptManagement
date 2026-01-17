/**
 * LoginPage
 * ログイン/新規登録ページ
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Tabs,
  Tab,
} from '@mui/material';
import { PublicLayout } from '../layouts/PublicLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 0) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <Box sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} centered>
          <Tab label="ログイン" />
          <Tab label="新規登録" />
        </Tabs>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="メールアドレス"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="パスワード"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {tab === 0 ? 'ログイン' : '新規登録'}
        </Button>

        {tab === 0 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link href="#" variant="body2">
              パスワードをお忘れですか？
            </Link>
          </Box>
        )}

        {/* デモアカウント情報 */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>デモアカウント</strong>
          </Typography>
          <Typography variant="body2">
            メール: test@promptmanagement.local
            <br />
            パスワード: TestPass123!
          </Typography>
        </Alert>
      </Box>
    </PublicLayout>
  );
}
