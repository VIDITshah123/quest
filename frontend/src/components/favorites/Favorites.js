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
  TablePagination,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Button
} from '@mui/material';
import { 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Category as CategoryIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Generate mock data
        const mockFavorites = Array.from({ length: 15 }, (_, i) => ({
          id: `fav-${i + 1}`,
          questionId: `q-${1000 + i}`,
          title: `Sample Question ${i + 1}`,
          type: ['Multiple Choice', 'True/False', 'Short Answer', 'Essay'][Math.floor(Math.random() * 4)],
          category: ['Mathematics', 'Science', 'History', 'Geography', 'English'][Math.floor(Math.random() * 5)],
          difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
          addedDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => 
            ['Algebra', 'Calculus', 'Biology', 'Chemistry', 'World War', 'Geometry', 'Grammar'][Math.floor(Math.random() * 7)]
          )
        }));
        
        setFavorites(mockFavorites);
        setIsLoading(false);
      }, 800);
    };

    fetchFavorites();
  }, []); // Add dependencies if needed

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = favorites.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleDeleteSelected = () => {
    // TODO: Implement delete API call
    console.log('Deleting favorites:', selected);
    // Filter out selected favorites
    setFavorites(favorites.filter(fav => !selected.includes(fav.id)));
    setSelected([]);
  };

  const handleToggleFavorite = (id, event) => {
    event.stopPropagation();
    // TODO: Implement toggle favorite API call
    console.log('Toggling favorite for:', id);
    // For now, just remove from the local state
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  const filteredFavorites = favorites.filter(fav => {
    const matchesSearch = fav.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fav.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fav.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'recent' && new Date(fav.addedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                         fav.category.toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredFavorites.length) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="primary" />
            My Favorites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredFavorites.length} saved questions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              size="small"
            >
              Remove ({selected.length})
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search favorites..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, flexGrow: 1 }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter by"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All Favorites</MenuItem>
            <MenuItem value="recent">Added This Week</MenuItem>
            <Divider />
            <MenuItem value="Mathematics">Mathematics</MenuItem>
            <MenuItem value="Science">Science</MenuItem>
            <MenuItem value="History">History</MenuItem>
            <MenuItem value="Geography">Geography</MenuItem>
            <MenuItem value="English">English</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredFavorites.length}
                    checked={filteredFavorites.length > 0 && selected.length === filteredFavorites.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all favorites' }}
                  />
                </TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography>Loading your favorites...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredFavorites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <StarBorderIcon color="disabled" sx={{ fontSize: 48, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary">
                        No favorites found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || filter !== 'all' 
                          ? 'Try adjusting your search or filter criteria' 
                          : 'Questions you mark as favorite will appear here'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFavorites
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((favorite) => {
                    const isItemSelected = isSelected(favorite.id);
                    const labelId = `favorites-table-checkbox-${favorite.id}`;

                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={favorite.id}
                        selected={isItemSelected}
                        onClick={(event) => handleClick(event, favorite.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{ 'aria-labelledby': labelId }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {favorite.title}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {favorite.tags.map((tag, i) => (
                              <Chip 
                                key={i} 
                                label={tag} 
                                size="small" 
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchTerm(tag);
                                }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<CategoryIcon fontSize="small" />} 
                            label={favorite.category} 
                            size="small" 
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilter(favorite.category);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={favorite.type} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={favorite.difficulty} 
                            size="small" 
                            sx={{
                              backgroundColor: 
                                favorite.difficulty === 'Easy' ? 'success.light' :
                                favorite.difficulty === 'Medium' ? 'warning.light' :
                                'error.light',
                              color: 'common.white',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(favorite.addedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove from favorites">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => handleToggleFavorite(favorite.id, e)}
                            >
                              <BookmarkIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={7} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFavorites.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Favorites;
