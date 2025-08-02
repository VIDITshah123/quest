import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, Paper, FormControl, 
  InputLabel, Select, MenuItem, FormHelperText, Grid,
  FormControlLabel, Checkbox, Divider, Chip, CircularProgress,
  Alert, Collapse, IconButton
} from '@mui/material';
import { 
  Save as SaveIcon, ArrowBack as ArrowBackIcon, 
  Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { questionAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const QuestionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Multiple Choice',
    category: '',
    difficulty: 'Medium',
    content: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    tags: [],
    isPublic: false
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  
  // Fetch question and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await questionAPI.getCategories();
        setCategories(categoriesResponse.data);
        
        // Fetch question data
        const questionResponse = await questionAPI.getQuestion(id);
        const question = questionResponse.data;
        
        // Transform question data to match form state
        setFormData({
          title: question.title,
          type: question.type,
          category: question.category,
          difficulty: question.difficulty,
          content: question.content,
          options: question.options || ['', '', '', ''],
          correctAnswer: question.correctAnswer || 0,
          explanation: question.explanation || '',
          tags: question.tags || [],
          isPublic: question.isPublic || false
        });
        
      } catch (err) {
        console.error('Error fetching data:', err);
        showNotification('Failed to load question data', 'error');
        navigate('/questions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate, showNotification]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  
  // Add a new option
  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };
  
  // Remove an option
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        // Adjust correctAnswer if needed
        correctAnswer: prev.correctAnswer >= newOptions.length ? 0 : prev.correctAnswer
      }));
    }
  };
  
  // Add a new tag
  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Add a new category
  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        const response = await questionAPI.createCategory({ name: newCategory.trim() });
        const addedCategory = response.data;
        
        // Update categories list
        setCategories(prev => [...prev, addedCategory]);
        
        // Set the new category as selected
        setFormData(prev => ({
          ...prev,
          category: addedCategory.name
        }));
        
        // Reset new category field
        setNewCategory('');
        setShowNewCategoryField(false);
        
        showNotification('Category added successfully', 'success');
      } catch (err) {
        console.error('Error adding category:', err);
        showNotification('Failed to add category', 'error');
      }
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Question content is required';
    }
    
    if (formData.type === 'Multiple Choice' || formData.type === 'True/False') {
      // Check if at least 2 options are provided
      const validOptions = formData.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
      
      // Check if correct answer is selected
      if (formData.correctAnswer === null || formData.correctAnswer === undefined) {
        newErrors.correctAnswer = 'Please select the correct answer';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare question data for API
      const questionData = {
        title: formData.title,
        type: formData.type,
        category: formData.category,
        difficulty: formData.difficulty,
        content: formData.content,
        options: formData.type === 'Multiple Choice' || formData.type === 'True/False' ? formData.options : undefined,
        correctAnswer: formData.type === 'Multiple Choice' || formData.type === 'True/False' ? formData.correctAnswer : undefined,
        explanation: formData.explanation,
        tags: formData.tags,
        isPublic: formData.isPublic
      };
      
      // Call API to update question
      await questionAPI.updateQuestion(id, questionData);
      
      // Show success message and redirect
      showNotification('Question updated successfully', 'success');
      navigate('/questions');
      
    } catch (err) {
      console.error('Error updating question:', err);
      showNotification('Failed to update question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ mr: 1 }}
          disabled={isSubmitting}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">Edit Question</Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Question Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                margin="normal"
                required
                error={!!errors.title}
                helperText={errors.title}
                disabled={isSubmitting}
              />
            </Grid>
            
            {/* Question Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Question Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Question Type"
                  disabled={isSubmitting}
                >
                  <MenuItem value="Multiple Choice">Multiple Choice</MenuItem>
                  <MenuItem value="True/False">True/False</MenuItem>
                  <MenuItem value="Short Answer">Short Answer</MenuItem>
                  <MenuItem value="Essay">Essay</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Category */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                  disabled={isSubmitting}
                  renderValue={(selected) => selected || 'Select a category'}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id || category} value={typeof category === 'string' ? category : category.name}>
                      {typeof category === 'string' ? category : category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
              
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                {!showNewCategoryField ? (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNewCategoryField(true)}
                    disabled={isSubmitting}
                  >
                    Add New Category
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="New category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      fullWidth
                      disabled={isSubmitting}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim() || isSubmitting}
                    >
                      Add
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setShowNewCategoryField(false);
                        setNewCategory('');
                      }}
                      disabled={isSubmitting}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Difficulty */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label="Difficulty"
                  disabled={isSubmitting}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Question Content */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
                required
                error={!!errors.content}
                helperText={errors.content || 'Enter the full question text here'}
                disabled={isSubmitting}
              />
            </Grid>
            
            {/* Options (for Multiple Choice/True-False) */}
            {(formData.type === 'Multiple Choice' || formData.type === 'True/False') && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Options {errors.options && (
                    <Typography component="span" color="error" variant="caption">
                      {errors.options}
                    </Typography>
                  )}
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  {formData.options.map((option, index) => (
                    <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.correctAnswer === index}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                correctAnswer: index
                              }));
                              
                              if (errors.correctAnswer) {
                                setErrors(prev => ({
                                  ...prev,
                                  correctAnswer: null
                                }));
                              }
                            }}
                            color="primary"
                            disabled={isSubmitting}
                          />
                        }
                        label={`Option ${index + 1}`}
                        sx={{ minWidth: 120, mr: 0 }}
                      />
                      <TextField
                        fullWidth
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Enter option ${index + 1} text`}
                        size="small"
                        disabled={isSubmitting}
                      />
                      {formData.options.length > 2 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeOption(index)}
                          disabled={isSubmitting}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  {errors.correctAnswer && (
                    <Typography color="error" variant="caption" display="block" gutterBottom>
                      {errors.correctAnswer}
                    </Typography>
                  )}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addOption}
                    disabled={formData.options.length >= 6 || isSubmitting}
                    size="small"
                  >
                    Add Option
                  </Button>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Select the correct answer by clicking the checkbox next to it
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            {/* Explanation */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Explanation (Optional)"
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
                helperText="Provide an explanation for the correct answer"
                disabled={isSubmitting}
              />
            </Grid>
            
            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tags (Optional)
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                    disabled={isSubmitting}
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={formData.tags.length >= 5 || isSubmitting}
                  sx={{ flexGrow: 1, maxWidth: 300 }}
                />
                <Button
                  size="small"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.length >= 5 || isSubmitting}
                >
                  Add
                </Button>
              </Box>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                {formData.tags.length}/5 tags added. Use tags to make questions easier to find.
              </Typography>
            </Grid>
            
            {/* Visibility */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPublic}
                    onChange={handleChange}
                    name="isPublic"
                    color="primary"
                    disabled={isSubmitting}
                  />
                }
                label="Make this question public"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: -1, ml: 4 }}>
                Public questions can be seen by all users. Uncheck to make it private.
              </Typography>
            </Grid>
            
            {/* Form Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/questions')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Update Question'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Error Alert */}
      <Collapse in={Object.keys(errors).length > 0}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setErrors({})}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          Please fix the errors in the form before submitting.
        </Alert>
      </Collapse>
    </Box>
  );
};

export default QuestionEdit;
