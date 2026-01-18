/**
 * グローバル通知コンポーネント
 * 画面右下にSnackbarを表示
 */

import { Snackbar, Alert } from '@mui/material';
import { useNotificationStore } from '../stores/notificationStore';

export default function GlobalNotification() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          // 複数通知の場合、縦にずらして表示
          style={{
            bottom: `${20 + index * 70}px`,
          }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%', minWidth: '300px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
