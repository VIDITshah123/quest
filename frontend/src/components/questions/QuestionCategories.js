import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  DialogContentText, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { questionAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const QuestionCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await questionAPI.getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
        showNotification('Failed to load categories', 'error');
      } finally {
        setIsLoading(false);
      }
      // API call to fetch categories
    };

    fetchCategories();
  }, []);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.category_name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSaveCategory = async () => {
    try {
      setIsSubmitting(true);
      
      if (editingCategory) {
        // Update existing category
        const response = await questionAPI.updateCategory(editingCategory.category_id, { 
          category_name: categoryName 
        });
        setCategories(categories.map(cat => 
          cat.category_id === editingCategory.category_id ? { ...response.data, question_count: editingCategory.question_count } : cat
        ));
        showNotification('Category updated successfully', 'success');
      } else {
        // Add new category
        const response = await questionAPI.createCategory({ 
          category_name: categoryName,
          category_description: '' // Add empty description as required by the backend
        });
        setCategories([...categories, { ...response.data, question_count: 0 }]);
        showNotification('Category created successfully', 'success');
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save category';
      showNotification(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsSubmitting(true);
      await questionAPI.deleteCategory(categoryToDelete.category_id);
      
      // Remove the category from the list
      setCategories(categories.filter(cat => cat.category_id !== categoryToDelete.category_id));
      handleCloseDeleteConfirm();
      showNotification('Category deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete category';
      showNotification(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingCategory(null);
    setCategoryName('');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (category) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" component="h1">Question Categories</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          disabled={isLoading}
        >
          Add Category
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 2, mb: 3, position: 'relative', minHeight: 200 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="subtitle1" color="textSecondary">
              No categories found. Create your first category to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.category_id} hover>
                    <TableCell>{category.category_name}</TableCell>
                    <TableCell>{category.question_count || 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenEditDialog(category)}
                          disabled={isSubmitting}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          onClick={() => handleOpenDeleteConfirm(category)}
                          disabled={isSubmitting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Category Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              if (error) setError('');
            }}
            sx={{ mt: 1 }}
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCategory}
            variant="contained"
            color="primary"
            disabled={isSubmitting || !categoryName.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={handleCloseDeleteConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCategory} 
            color="error" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionCategories;
