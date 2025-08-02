import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  IconButton, 
  Tooltip, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon, 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const QuestionList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // State for questions and loading
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    type: ''
  });
  
  // Categories for filter
  const [categories, setCategories] = useState([]);
  const [difficulties] = useState(['Easy', 'Medium', 'Hard']);
  const [questionTypes] = useState(['Multiple Choice', 'True/False', 'Short Answer', 'Essay']);
  
  // Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        search: filters.search || undefined,
        category: filters.category || undefined,
        difficulty: filters.difficulty || undefined,
        type: filters.type || undefined
      };
      
      const response = await questionAPI.getQuestions(params);
      
      setQuestions(response.data.questions);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
      
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please try again.');
      showNotification('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await questionAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showNotification('Failed to load categories', 'error');
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch questions when filters or pagination changes
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.pageSize]);
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      page: 0, // Reset to first page
      pageSize: parseInt(event.target.value, 10)
    }));
  };
  
  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 0
    }));
  };
  
  // Handle search
  const handleSearch = (event) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value
    }));
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchQuestions();
    fetchCategories();
  };
  
  // Handle delete question
  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionAPI.deleteQuestion(id);
        showNotification('Question deleted successfully', 'success');
        fetchQuestions(); // Refresh the list
      } catch (err) {
        console.error('Error deleting question:', err);
        showNotification('Failed to delete question', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h1">Questions</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/questions/create')}
          disabled={loading}
        >
          Add Question
        </Button>
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search questions..."
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, flexGrow: 1 }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category}
            onChange={handleFilterChange('category')}
            label="Category"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={filters.difficulty}
            onChange={handleFilterChange('difficulty')}
            label="Difficulty"
          >
            <MenuItem value="">
              <em>All Difficulties</em>
            </MenuItem>
            {difficulties.map((difficulty) => (
              <MenuItem key={difficulty} value={difficulty}>
                {difficulty}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Question Type</InputLabel>
          <Select
            value={filters.type}
            onChange={handleFilterChange('type')}
            label="Question Type"
          >
            <MenuItem value="">
              <em>All Types</em>
            </MenuItem>
            {questionTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading questions...</Typography>
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No questions found. Try adjusting your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow 
                    key={question.id} 
                    hover 
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{question.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={question.category} 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            category: question.category
                          }));
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={question.difficulty} 
                        size="small"
                        sx={{
                          backgroundColor: 
                            question.difficulty === 'Easy' ? theme.palette.success.light :
                            question.difficulty === 'Medium' ? theme.palette.warning.light :
                            theme.palette.error.light,
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>{question.type}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/questions/${question.id}`)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/questions/edit/${question.id}`)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && questions.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default QuestionList;
