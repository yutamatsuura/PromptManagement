/**
 * Header
 * AppBar + ナビゲーションメニュー + ユーザーメニュー
 */

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { text: 'プロンプト一覧', icon: <HomeIcon />, path: '/' },
    { text: '新規作成', icon: <AddIcon />, path: '/prompt/new' },
    { text: '設定', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Box
          onClick={() => navigate('/')}
          sx={{
            mr: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <img
            src="/logo.png"
            alt="Prompt Management"
            style={{
              height: '40px',
              width: 'auto',
            }}
          />
        </Box>

        {/* ナビゲーションメニュー */}
        {user && (
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color: 'white',
                  fontWeight: location.pathname === item.path ? 700 : 400,
                  backgroundColor:
                    location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        )}

        {/* ユーザーメニュー */}
        {user && (
          <>
            <IconButton
              onClick={handleMenuOpen}
              sx={{ color: 'white' }}
              aria-label="user menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>設定</MenuItem>
              <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
