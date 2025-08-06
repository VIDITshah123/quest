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
  Divider,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ReportProblem as ReportProblemIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
  EmojiEvents as LeaderboardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { questionAPI } from '../../services/api';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingReview: 0,
    invalidated: 0,
    reviewedByMe: 0
  });
  const [invalidateDialog, setInvalidateDialog] = useState({
    open: false,
    questionId: null,
    reason: '',
    severity: 'low'
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch questions data
      const questionsResponse = await questionAPI.getQuestions({
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeStats: true
      });
      
      // Calculate stats
      const pendingReview = questionsResponse.data.questions.filter(
        q => q.status === 'pending_review'
      ).length;
      
      const invalidated = questionsResponse.data.questions.filter(
        q => q.status === 'invalidated'
      ).length;
      
      const reviewedByMe = questionsResponse.data.questions.filter(
        q => q.reviewed_by === currentUser.user_id
      ).length;
      
      setStats({
        totalQuestions: questionsResponse.data.total || 0,
        pendingReview,
        invalidated,
        reviewedByMe
      });
      
      setQuestions(questionsResponse.data.questions);
      
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

  const handleOpenInvalidateDialog = (questionId) => {
    setInvalidateDialog({
      open: true,
      questionId,
      reason: '',
      severity: 'low'
    });
  };

  const handleCloseInvalidateDialog = () => {
    setInvalidateDialog({
      open: false,
      questionId: null,
      reason: '',
      severity: 'low'
    });
  };

  const handleInvalidateQuestion = async () => {
    try {
      await questionAPI.invalidateQuestion(invalidateDialog.questionId, {
        reason: invalidateDialog.reason,
        severity: invalidateDialog.severity,
        reviewedBy: currentUser.user_id
      });
      
      // Refresh data after invalidation
      fetchDashboardData();
      handleCloseInvalidateDialog();
    } catch (error) {
      console.error('Error invalidating question:', error);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Reviewer Dashboard
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
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Questions" 
            value={stats.totalQuestions}
            icon={MenuBookIcon}
            color="info"
            onClick={() => navigate('/questions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReview}
            icon={VisibilityIcon}
            color="warning"
            onClick={() => navigate('/questions?status=pending_review')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Invalidated" 
            value={stats.invalidated}
            icon={ReportProblemIcon}
            color="error"
            onClick={() => navigate('/questions?status=invalidated')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Reviewed By Me" 
            value={stats.reviewedByMe}
            icon={LeaderboardIcon}
            color="success"
          />
        </Grid>
      </Grid>
      
      {/* Questions Table */}
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
              ) : questions.length > 0 ? (
                questions.map((question) => (
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
                        <ThumbUpIcon 
                          fontSize="small" 
                          color={question.user_vote === 'up' ? 'primary' : 'action'} 
                          sx={{ mr: 0.5, cursor: 'pointer' }}
                          onClick={() => handleVote(question.id, 'up')}
                        />
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {question.upvotes || 0}
                        </Typography>
                        <ThumbDownIcon 
                          fontSize="small" 
                          color={question.user_vote === 'down' ? 'error' : 'action'} 
                          sx={{ mr: 0.5, cursor: 'pointer' }}
                          onClick={() => handleVote(question.id, 'down')}
                        />
                        <Typography variant="body2">
                          {question.downvotes || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <Tooltip title="View">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/questions/${question.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Report Issue">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenInvalidateDialog(question.id)}
                          >
                            <ReportProblemIcon fontSize="small" />
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

      {/* Invalidate Question Dialog */}
      <Dialog 
        open={invalidateDialog.open} 
        onClose={handleCloseInvalidateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Question Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="severity-label">Severity</InputLabel>
              <Select
                labelId="severity-label"
                value={invalidateDialog.severity}
                label="Severity"
                onChange={(e) => setInvalidateDialog(prev => ({
                  ...prev,
                  severity: e.target.value
                }))}
              >
                <MenuItem value="low">Low - Minor issue</MenuItem>
                <MenuItem value="medium">Medium - Needs attention</MenuItem>
                <MenuItem value="high">High - Critical issue</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Reason for reporting"
              multiline
              rows={4}
              fullWidth
              value={invalidateDialog.reason}
              onChange={(e) => setInvalidateDialog(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              placeholder="Please provide details about why this question is being reported..."
              variant="outlined"
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvalidateDialog}>Cancel</Button>
          <Button 
            onClick={handleInvalidateQuestion} 
            color="error"
            variant="contained"
            disabled={!invalidateDialog.reason.trim()}
          >
            Report Question
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReviewerDashboard;
