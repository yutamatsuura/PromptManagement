import type { ThemeOptions } from '@mui/material/styles';

/**
 * ブルーハイコントラストテーマのコンポーネントスタイル設定
 * - わずかな丸み(border-radius: 4px)で柔らかさを演出
 * - クリアな視認性重視
 */
export const components: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        padding: '8px 16px',
        fontWeight: 600,
        transition: 'all 0.2s ease-in-out',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0, 212, 255, 0.3)',
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        backgroundImage: 'none', // MUI v6のデフォルトグラデーションを無効化
      },
      elevation1: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      elevation2: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
      elevation3: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        backgroundImage: 'none',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#00d4ff',
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        color: '#ffffff',
      },
      input: {
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.5)',
          opacity: 1,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
      notchedOutline: {
        borderColor: 'rgba(255, 255, 255, 0.23)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      },
      colorPrimary: {
        backgroundColor: '#002855',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundImage: 'none',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        margin: '2px 8px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(0, 212, 255, 0.16)',
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.24)',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(0, 212, 255, 0.08)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
      filled: {
        backgroundColor: 'rgba(0, 212, 255, 0.16)',
        color: '#00d4ff',
        '&:hover': {
          backgroundColor: 'rgba(0, 212, 255, 0.24)',
        },
      },
      outlined: {
        borderColor: '#00d4ff',
        color: '#00d4ff',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
      standardSuccess: {
        backgroundColor: 'rgba(76, 175, 80, 0.16)',
        color: '#4caf50',
      },
      standardError: {
        backgroundColor: 'rgba(255, 107, 107, 0.16)',
        color: '#ff6b6b',
      },
      standardWarning: {
        backgroundColor: 'rgba(255, 165, 0, 0.16)',
        color: '#ffa500',
      },
      standardInfo: {
        backgroundColor: 'rgba(0, 212, 255, 0.16)',
        color: '#00d4ff',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#002855',
        color: '#ffffff',
        fontSize: '0.75rem',
        borderRadius: 4,
        border: '1px solid rgba(0, 212, 255, 0.5)',
      },
      arrow: {
        color: '#002855',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      },
      head: {
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: '#002855',
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: 'rgba(255, 255, 255, 0.12)',
      },
    },
  },
};
