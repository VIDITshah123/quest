import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Tab, Box } from '@mui/material';

const AttendanceNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentPath} 
        onChange={handleTabChange}
        aria-label="attendance navigation"
      >
        <Tab label="Student View" value="/attendance/student" />
        <Tab label="Teacher View" value="/attendance/teacher" />
      </Tabs>
    </Box>
  );
};

export default AttendanceNav;
