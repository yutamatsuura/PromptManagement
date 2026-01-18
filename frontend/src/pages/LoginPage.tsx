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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { PublicLayout } from '../layouts/PublicLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    // クライアントサイドバリデーション
    let hasError = false;
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      hasError = true;
    }
    if (!password) {
      setPasswordError('パスワードを入力してください');
      hasError = true;
    }

    if (hasError) {
      return;
    }

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

  const handleResetPasswordClick = () => {
    setResetEmail('');
    setResetSuccess(false);
    setResetError('');
    setResetDialogOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    setResetError('');
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'パスワードリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDialogClose = () => {
    setResetDialogOpen(false);
    setResetEmail('');
    setResetSuccess(false);
    setResetError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          error={!!emailError}
          helperText={emailError}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="パスワード"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          error={!!passwordError}
          helperText={passwordError}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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
            <Link
              component="button"
              variant="body2"
              onClick={handleResetPasswordClick}
              type="button"
            >
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

      {/* パスワードリセットダイアログ */}
      <Dialog open={resetDialogOpen} onClose={handleResetDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>パスワードリセット</DialogTitle>
        <DialogContent>
          {resetSuccess ? (
            <Alert severity="success">
              パスワードリセットメールを送信しました。メールをご確認ください。
            </Alert>
          ) : (
            <>
              {resetError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetError}
                </Alert>
              )}
              <Typography variant="body2" sx={{ mb: 2 }}>
                登録されているメールアドレスを入力してください。
                パスワードリセット用のリンクをお送りします。
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                id="reset-email"
                name="email"
                label="メールアドレス"
                type="email"
                fullWidth
                variant="outlined"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={loading}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {resetSuccess ? (
            <Button onClick={handleResetDialogClose}>閉じる</Button>
          ) : (
            <>
              <Button onClick={handleResetDialogClose} disabled={loading}>
                キャンセル
              </Button>
              <Button onClick={handleResetPasswordSubmit} disabled={loading || !resetEmail}>
                送信
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </PublicLayout>
  );
}
