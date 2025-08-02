import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, CssBaseline, useScrollTrigger, Slide, Fab, Fade } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

// Scroll to top component
function ScrollTop({ children }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Fade>
  );
}

const MainLayoutContent = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const { currentTheme } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { notifications } = useNotification();
  const location = useLocation();

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  const handleDrawerToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [isMobile, mobileOpen, sidebarCollapsed]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle sidebar with Ctrl+\ or Cmd+\
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        handleDrawerToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDrawerToggle]);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <Box 
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarCollapsed ? 73 : 240}px)` },
          ml: { md: `${sidebarCollapsed ? '73px' : '240px'}` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Scroll to top anchor */}
        <div id="back-to-top-anchor" />
        
        {/* Navbar */}
        <Navbar 
          onMenuClick={handleDrawerToggle} 
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
        
        {/* Main Content Area */}
        <Box 
          component={motion.div}
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.2 }}
          sx={{
            p: { xs: 2, md: 3 },
            pt: { xs: 8, sm: 9 },
            maxWidth: '1600px',
            mx: 'auto',
            width: '100%',
          }}
        >
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </Box>
        
        {/* Scroll to Top Button */}
        <ScrollTop>
          <Fab 
            size="medium" 
            aria-label="scroll back to top"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              boxShadow: 3,
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </ScrollTop>
        
        {/* Notification Center */}
        <NotificationCenter />
      </Box>
    </Box>
  );
};

const MainLayout = () => (
  <NotificationProvider>
    <MainLayoutContent />
  </NotificationProvider>
);

export default MainLayout;
