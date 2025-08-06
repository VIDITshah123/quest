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
  EmojiEvents as LeaderboardIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
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
      
      // Fetch questions data with filters for reviewer
      const [pendingResponse, invalidatedResponse, reviewedResponse] = await Promise.all([
        questionAPI.getQuestions({
          status: 'pending_review',
          limit: 1, // We only need the count
          includeStats: true
        }),
        questionAPI.getQuestions({
          status: 'invalidated',
          limit: 1, // We only need the count
          includeStats: true
        }),
        questionAPI.getQuestions({
          reviewedBy: currentUser.user_id,
          limit: 1, // We only need the count
          includeStats: true
        })
      ]);

      // Fetch recent questions for the table
      const questionsResponse = await questionAPI.getQuestions({
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeVotes: true
      });
      
      // Set stats from the API responses
      setStats({
        pendingReview: pendingResponse.data.total || 0,
        invalidated: invalidatedResponse.data.total || 0,
        reviewedByMe: reviewedResponse.data.total || 0,
        totalReviewed: reviewedResponse.data.total || 0
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

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary', 
    subtitle = '',
    onClick 
  }) => (
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
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography color="textSecondary" variant="overline" display="block">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary" display="block">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Icon color={color} sx={{ fontSize: 40, opacity: 0.2 }} />
        </Box>
        <Box mt={2}>
          <Typography variant="h4" component="div">
            {isLoading ? <CircularProgress size={24} /> : value}
          </Typography>
        </Box>
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
      
      {/* Reviewer Focused Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReview}
            icon={VisibilityIcon}
            color="warning"
            subtitle="Questions awaiting your review"
            onClick={() => navigate('/questions?status=pending_review')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Marked as Invalid" 
            value={stats.invalidated}
            icon={ReportProblemIcon}
            color="error"
            subtitle="Questions you've invalidated"
            onClick={() => navigate('/questions?status=invalidated&reviewedBy=me')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Reviewed" 
            value={stats.reviewedByMe}
            icon={CheckCircleIcon}
            color="success"
            subtitle="Questions you've reviewed"
            onClick={() => navigate('/questions?reviewedBy=me')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Review Accuracy" 
            value={stats.reviewedByMe > 0 
              ? `${Math.round((1 - (stats.invalidated / stats.reviewedByMe)) * 100)}%` 
              : 'N/A'}
            icon={TrendingUpIcon}
            color="info"
            subtitle="Based on question acceptance"
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
