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
  CircularProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Category as CategoryIcon,
  Leaderboard as LeaderboardIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { questionAPI } from '../../services/api';

const QuestionWriterDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    myQuestions: 0,
    pendingReview: 0,
    invalidated: 0,
    myScore: 0
  });
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState({
    questions: [],
    employees: []
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch questions data
      const questionsResponse = await questionAPI.getQuestions({
        page: 1,
        limit: 5,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      // Fetch user's questions
      const myQuestionsResponse = await questionAPI.getQuestions({
        userId: currentUser.user_id,
        limit: 1
      });
      
      // Fetch leaderboards
      const [questionsLeaderboard, employeesLeaderboard] = await Promise.all([
        questionAPI.getLeaderboard('questions'),
        questionAPI.getLeaderboard('employees')
      ]);
      
      // Calculate stats
      const invalidatedQuestions = questionsResponse.data.questions.filter(
        q => q.status === 'invalidated'
      );
      
      setStats({
        totalQuestions: questionsResponse.data.total || 0,
        myQuestions: myQuestionsResponse.data.total || 0,
        pendingReview: questionsResponse.data.questions.filter(
          q => q.status === 'pending_review' && q.user_id === currentUser.user_id
        ).length,
        invalidated: invalidatedQuestions.length,
        myScore: currentUser.score || 0
      });
      
      setRecentQuestions(questionsResponse.data.questions);
      setLeaderboard({
        questions: questionsLeaderboard.data.slice(0, 5),
        employees: employeesLeaderboard.data.slice(0, 5)
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVote = async (questionId, voteType) => {
    try {
      await questionAPI.voteOnQuestion(questionId, { vote: voteType });
      fetchDashboardData(); // Refresh data after voting
    } catch (error) {
      console.error('Error voting:', error);
    }
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

  const ActionCard = ({ title, description, icon: Icon, buttonText, onClick, color = 'primary' }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Icon color={color} sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          variant="contained" 
          color={color} 
          fullWidth 
          onClick={onClick}
          startIcon={<Icon />}
        >
          {buttonText}
        </Button>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Question Writer Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Total Questions" 
            value={stats.totalQuestions}
            icon={VisibilityIcon}
            color="info"
            onClick={() => navigate('/questions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="My Questions" 
            value={stats.myQuestions}
            icon={EditIcon}
            color="primary"
            onClick={() => navigate('/questions?myQuestions=true')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReview}
            icon={CategoryIcon}
            color="warning"
            onClick={() => navigate('/questions?status=pending_review')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Invalidated" 
            value={stats.invalidated}
            icon={ThumbDownIcon}
            color="error"
            onClick={() => navigate('/questions?status=invalidated')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="My Score" 
            value={stats.myScore}
            icon={LeaderboardIcon}
            color="success"
            onClick={() => navigate('/leaderboard')}
          />
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <ActionCard
            title="Add New Question"
            description="Create a new question with single or multiple correct answers"
            icon={AddIcon}
            buttonText="Create Question"
            onClick={() => navigate('/questions/create')}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ActionCard
            title="Manage Categories"
            description="View and manage question categories and subcategories"
            icon={CategoryIcon}
            buttonText="View Categories"
            onClick={() => navigate('/questions/categories')}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ActionCard
            title="View Leaderboard"
            description="See top questions and employees by score"
            icon={LeaderboardIcon}
            buttonText="View Leaderboard"
            onClick={() => navigate('/leaderboard')}
            color="success"
          />
        </Grid>
      </Grid>
      
      {/* Recent Questions */}
      <Grid container spacing={3}>
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
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : recentQuestions.length > 0 ? (
                    recentQuestions.map((question) => (
                      <TableRow key={question.id} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {question.question_text}
                          </Typography>
                          {question.status === 'invalidated' && question.invalidation_reason && (
                            <Typography variant="caption" color="error">
                              Reason: {question.invalidation_reason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={question.category?.name || 'Uncategorized'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={question.status || 'draft'}
                            color={
                              question.status === 'approved' ? 'success' : 
                              question.status === 'pending_review' ? 'warning' :
                              question.status === 'invalidated' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <ThumbUpIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {question.upvotes || 0}
                            </Typography>
                            <ThumbDownIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">
                              {question.downvotes || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => navigate(`/questions/${question.id}`)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {question.user_id === currentUser.user_id && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => navigate(`/questions/edit/${question.id}`)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error">
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Upvote">
                              <IconButton 
                                size="small" 
                                color={question.user_vote === 'up' ? 'primary' : 'default'}
                                onClick={() => handleVote(question.id, 'up')}
                              >
                                <ThumbUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Downvote">
                              <IconButton 
                                size="small" 
                                color={question.user_vote === 'down' ? 'error' : 'default'}
                                onClick={() => handleVote(question.id, 'down')}
                              >
                                <ThumbDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No questions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        
        {/* Leaderboards */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Card>
                <CardHeader 
                  title="Top Questions"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => navigate('/leaderboard?type=questions')}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {leaderboard.questions.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {item.title || 'Untitled Question'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              size="small" 
                              label={`${item.score} pts`} 
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
            
            <Grid item>
              <Card>
                <CardHeader 
                  title="Top Employees"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => navigate('/leaderboard?type=employees')}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {leaderboard.employees.map((item, index) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {item.name || `User ${item.id}`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              size="small" 
                              label={`${item.score} pts`} 
                              color="secondary"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QuestionWriterDashboard;
