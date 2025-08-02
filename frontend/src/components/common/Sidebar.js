import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Tooltip, 
  Typography, 
  Box, 
  Collapse,
  IconButton,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AssignmentInd as RolesIcon,
  Security as PermissionsIcon,
  ListAlt as ListIcon,
  Assessment as AnalyticsIcon,
  CreditCard as PaymentIcon,
  ToggleOn as ToggleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  MenuBook as QuestionsIcon,
  Category as CategoriesIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  EmojiEvents as LeaderboardIcon,
  Star as StarIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { featureToggleAPI } from '../../services/api';

const drawerWidth = 260;
const collapsedWidth = 72;

const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission, hasRole, currentUser, logout } = useAuth();
  const [featureToggles, setFeatureToggles] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

  // Grouped menu items
  const menuGroups = [
    {
      group: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: <DashboardIcon />,
          permission: null
        },
        {
          name: 'Questions',
          path: '/questions',
          icon: <MenuBookIcon />,
          permission: 'question_view',
          children: [
            { name: 'All Questions', path: '/questions', permission: 'question_view' },
            { name: 'Add New', path: '/questions/create', permission: 'question_create' },
            { name: 'Categories', path: '/questions/categories', permission: 'question_manage_categories' },
          ]
        },
        {
          name: 'Leaderboard',
          path: '/leaderboard',
          icon: <LeaderboardIcon />,
          permission: 'leaderboard_view'
        },
        {
          name: 'Favorites',
          path: '/favorites',
          icon: <StarIcon />,
          permission: 'favorite_view'
        },
      ]
    },
    {
      group: 'Administration',
      items: [
        {
          name: 'Users',
          path: '/users',
          icon: <PeopleIcon />,
          permission: 'user_view',
          children: [
            { name: 'All Users', path: '/users', permission: 'user_view' },
            { name: 'Create User', path: '/users/create', permission: 'user_create' },
            { name: 'Bulk Upload', path: '/users/bulk-upload', permission: 'user_create' },
          ]
        },
        {
          name: 'Roles',
          path: '/roles',
          icon: <RolesIcon />,
          permission: 'role_view',
          children: [
            { name: 'All Roles', path: '/roles', permission: 'role_view' },
            { name: 'Create Role', path: '/roles/create', permission: 'role_create' },
            { name: 'Feature Toggles', path: '/roles/feature-toggles', permission: 'role_manage_features' },
            { name: 'Bulk Upload', path: '/roles/bulk-upload', permission: 'role_create' },
          ]
        },
        {
          name: 'Permissions',
          path: '/permissions',
          icon: <PermissionsIcon />,
          permission: 'permission_view',
          children: [
            { name: 'All Permissions', path: '/permissions', permission: 'permission_view' },
            { name: 'Create Permission', path: '/permissions/create', permission: 'permission_create' }
          ]
        },
        {
          name: 'Activity Logs',
          path: '/logs',
          icon: <ListIcon />,
          permission: 'log_view',
          featureToggle: 'activity_logs'
        },
        {
          name: 'File Upload Settings',
          path: '/admin/file-upload-settings',
          icon: <CloudUploadIcon />,
          permission: 'admin_settings_manage',
          featureToggle: 'file_upload'
        },
        {
          name: 'Analytics',
          path: '/analytics',
          icon: <AnalyticsIcon />,
          permission: 'analytics_view',
          featureToggle: 'analytics'
        }
      ]
    }
  ];

  // Fetch feature toggles when component mounts
  useEffect(() => {
    const fetchFeatureToggles = async () => {
      try {
        const response = await featureToggleAPI.getToggles();
        const togglesMap = {};
        
        response.data.forEach(toggle => {
          const name = toggle.feature_name || toggle.name;
          const isEnabled = toggle.enabled === 1 || toggle.enabled === true;
          togglesMap[name] = isEnabled;
        });
        
        setFeatureToggles(togglesMap);
      } catch (error) {
        console.error('Failed to fetch feature toggles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeatureToggles();
  }, []);

  // Initialize expanded state for collapsible items
  useEffect(() => {
    const initialExpanded = {};
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          // Check if any child path matches current location
          const isActive = item.children.some(child => 
            location.pathname.startsWith(child.path)
          ) || location.pathname === item.path;
          initialExpanded[item.name] = isActive;
        }
      });
    });
    setExpandedItems(initialExpanded);
  }, [location.pathname]);

  const handleToggleExpand = (name) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return null;

  const renderMenuItems = (items, level = 0) => {
    return items
      .filter(item => !item.permission || hasPermission([item.permission]))
      .filter(item => !item.featureToggle || featureToggles[item.featureToggle])
      .map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = location.pathname === item.path || 
          (hasChildren && item.children.some(child => 
            location.pathname.startsWith(child.path)
          ));
        
        const listItem = (
          <ListItem 
            key={item.path} 
            disablePadding 
            sx={{
              display: 'block',
              mb: 0.5,
              '&:hover .MuiListItemButton-root': {
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
              },
            }}
          >
            <Tooltip 
              title={collapsed ? item.name : ''} 
              placement="right"
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive}
                onClick={() => hasChildren && handleToggleExpand(item.name)}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.16),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.32 : 0.24),
                    },
                  },
                  '& .MuiListItemIcon-root': {
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 2,
                    justifyContent: 'center',
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  },
                  '&:hover .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText 
                      primary={item.name} 
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'text.primary' : 'text.secondary',
                      }}
                    />
                    {hasChildren && (
                      expandedItems[item.name] ? <ExpandLess /> : <ExpandMore />
                    )}
                  </>
                )}
              </ListItemButton>
            </Tooltip>

            {hasChildren && !collapsed && (
              <Collapse in={expandedItems[item.name]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <ListItemButton
                        key={child.path}
                        component={RouterLink}
                        to={child.path}
                        selected={isChildActive}
                        sx={{
                          pl: 4,
                          py: 1,
                          mx: 1,
                          borderRadius: 1,
                          '&.Mui-selected': {
                            bgcolor: 'transparent',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                            },
                          },
                        }}
                      >
                        <ListItemText 
                          primary={child.name}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: isChildActive ? 'text.primary' : 'text.secondary',
                            fontWeight: isChildActive ? 500 : 400,
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            )}
          </ListItem>
        );

        return listItem;
      });
  };

  const drawer = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/logo192.png"
              alt="Logo"
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{
                fontWeight: 700,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, #90caf9, #64b5f6)' 
                  : 'linear-gradient(45deg, #1976d2, #2196f3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              QuestionBank
            </Typography>
          </Box>
        )}
        {!collapsed && (
          <IconButton onClick={onToggleCollapse} size="small">
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {/* Scrollable content */}
      <Box 
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? '#555' : '#ccc',
            borderRadius: '4px',
          },
        }}
      >
        {menuGroups.map((group, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            {!collapsed && group.group && (
              <Typography 
                variant="caption" 
                sx={{
                  px: 3,
                  py: 1,
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                {group.group}
              </Typography>
            )}
            <List disablePadding>
              {renderMenuItems(group.items)}
            </List>
            {index < menuGroups.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>

      {/* User profile and actions */}
      <Box 
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Tooltip title={collapsed ? currentUser?.email : ''} placement="right">
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar 
              sx={{
                width: collapsed ? 32 : 36,
                height: collapsed ? 32 : 36,
                mr: collapsed ? 0 : 1.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </Avatar>
            {!collapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography 
                  variant="subtitle2" 
                  noWrap
                  sx={{ fontWeight: 600 }}
                >
                  {currentUser?.firstName} {currentUser?.lastName}
                </Typography>
                <Typography 
                  variant="caption" 
                  noWrap
                  sx={{ 
                    display: 'block',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                  }}
                >
                  {currentUser?.email}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        {!collapsed && (
          <Box sx={{ display: 'flex', mt: 1 }}>
            <Tooltip title="Settings">
              <IconButton 
                size="small" 
                sx={{ ml: 'auto' }}
                onClick={() => navigate('/settings')}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton 
                size="small" 
                onClick={handleLogout}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={!collapsed}
          onClose={onToggleCollapse}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: theme.shadows[8],
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open={!collapsed}
          sx={{
            width: collapsed ? collapsedWidth : drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedWidth : drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
