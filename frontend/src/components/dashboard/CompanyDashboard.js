import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  People as PeopleIcon,
  QuestionAnswer as QuestionIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { questionAPI } from '../../services/api';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalEmployees: 0
  });

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // In a real implementation, you would fetch company-specific data here
      // For now, we'll use mock data
      setStats({
        totalQuestions: 124,
        totalEmployees: 42
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary', onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography color="textSecondary" variant="overline">
            {title}
          </Typography>
          <Icon color={color} />
        </Box>
        <Typography variant="h4">
          {isLoading ? <CircularProgress size={24} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Company Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Questions" 
            value={stats.totalQuestions} 
            icon={QuestionIcon}
            color="primary"
            onClick={() => navigate('/questions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Employees" 
            value={stats.totalEmployees}
            icon={PeopleIcon}
            color="secondary"
            onClick={() => navigate('/users')}
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Recent Questions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Recent Questions"
              action={
                <Button 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/questions')}
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Typography color="textSecondary">
                View and manage all questions in the system.
              </Typography>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/questions')}
                >
                  Go to Questions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Employee Management */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Employee Management"
              action={
                <Button 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/users')}
                >
                  Manage
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Manage your employees and their roles.
              </Typography>
              <Box mt={2} display="flex" flexDirection="column" gap={2}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/users/create')}
                >
                  Add New Employee
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/users')}
                >
                  View All Employees
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CompanyDashboard;
