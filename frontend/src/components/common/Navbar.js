import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Tooltip,
  Badge,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import SearchBar from './SearchBar';

const Navbar = ({ onMenuClick, sidebarCollapsed, isMobile }) => {
  const theme = useTheme();
  const { currentUser, logout } = useAuth();
  const { currentTheme, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for user menu and notifications
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [notifications] = useState([
    { id: 1, text: 'New question added to your category', time: '2 hours ago', read: false },
    { id: 2, text: 'Your question was upvoted', time: '5 hours ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const open = Boolean(anchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  // Auto-close notifications when route changes
  useEffect(() => {
    handleNotificationsClose();
  }, [location]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return '';
    const { firstName = '', lastName = '' } = currentUser;
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarCollapsed ? 73 : 240}px)` },
        ml: { md: `${sidebarCollapsed ? 73 : 240}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar disableGutters sx={{ px: 2 }}>
        {/* Menu Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{
            mr: 2,
            color: 'text.primary',
            display: { md: 'flex' },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* App Title */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontWeight: 700,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, #90caf9, #64b5f6)' 
              : 'linear-gradient(45deg, #1976d2, #2196f3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Question Bank
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
        
        {/* Search Bar - Only show on medium screens and up */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, maxWidth: 500, ml: 2 }}>
            <SearchBar />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton 
              onClick={toggleTheme} 
              color="inherit"
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              {currentTheme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
                alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
                src={currentUser?.avatar}
              >
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={notificationsOpen}
        onClose={handleNotificationsClose}
        onClick={handleNotificationsClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 360,
            maxWidth: '100%',
            mt: 1,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight="medium">Notifications</Typography>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                dense
                sx={{
                  borderLeft: `3px solid ${!notification.read ? theme.palette.primary.main : 'transparent'}`,
                  bgcolor: !notification.read ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.primary">
                    {notification.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            View All Notifications
          </Typography>
        </Box>
      </Menu>
      
      {/* User Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 240,
            overflow: 'visible',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {currentUser?.firstName} {currentUser?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUser?.email}
          </Typography>
        </Box>
        
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
