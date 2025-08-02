import React, { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  IconButton,
  Slide,
  Paper,
  Divider,
  Badge,
  Tooltip,
  Fade,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  NotificationsNone as NotificationsNoneIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const notificationIcons = {
  success: <SuccessIcon color="success" />,
  error: <ErrorIcon color="error" />,
  warning: <WarningIcon color="warning" />,
  info: <InfoIcon color="info" />,
  default: <NotificationsNoneIcon color="action" />
};

const NotificationCenter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { notifications, removeNotification, clearAllNotifications } = useNotification();

  // Auto-hide notifications after delay
  useEffect(() => {
    const autoHideTimers = notifications
      .filter(notification => notification.autoHide !== false)
      .map(notification => {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration || 5000);
      });

    return () => {
      autoHideTimers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: theme.spacing(2),
        right: theme.spacing(2),
        zIndex: theme.zIndex.snackbar,
        maxWidth: isMobile ? 'calc(100% - 16px)' : '400px',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          px: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            badgeContent={notifications.length}
            color="primary"
            sx={{ mr: 1 }}
          >
            <NotificationsIcon />
          </Badge>
          <Typography variant="subtitle2" color="textSecondary">
            Notifications
          </Typography>
        </Box>
        {notifications.length > 0 && (
          <Tooltip title="Clear all">
            <IconButton
              size="small"
              onClick={clearAllNotifications}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Paper
        elevation={3}
        sx={{
          maxHeight: '70vh',
          overflowY: 'auto',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <List disablePadding>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <Slide
                direction="left"
                in={true}
                mountOnEnter
                unmountOnExit
                timeout={150}
              >
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: 'transparent',
                        color: `${notification.type || 'primary'}.main`,
                      }}
                    >
                      {notificationIcons[notification.type || 'default']}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        color="textPrimary"
                        sx={{ fontWeight: 500 }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            fontSize: '0.7rem',
                          }}
                        >
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeNotification(notification.id)}
                    sx={{ ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              </Slide>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default NotificationCenter;
