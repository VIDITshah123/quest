import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Paper, 
  InputBase, 
  IconButton, 
  Box, 
  ClickAwayListener,
  Popper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

const SearchBar = () => {
  const theme = useTheme();
  const { currentTheme } = useCustomTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Close suggestions when route changes
  useEffect(() => {
    setShowSuggestions(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update recent searches
    const updatedSearches = [
      { query: searchQuery, timestamp: new Date().toISOString() },
      ...recentSearches.filter(item => item.query.toLowerCase() !== searchQuery.toLowerCase())
    ].slice(0, 5); // Keep only 5 most recent searches

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        component="form"
        onSubmit={handleSearch}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          bgcolor: currentTheme === 'dark' ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.05),
          '&:hover': {
            bgcolor: currentTheme === 'dark' ? alpha(theme.palette.common.white, 0.15) : alpha(theme.palette.common.black, 0.1),
          },
          transition: theme.transitions.create('background-color'),
        }}
      >
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1, color: 'inherit' }}
          placeholder="Search questions, categories..."
          inputProps={{ 'aria-label': 'search questions' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          ref={(node) => setAnchorEl(node)}
        />
        {searchQuery && (
          <IconButton
            type="button"
            sx={{ p: '10px' }}
            aria-label="clear"
            onClick={handleClearSearch}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      {/* Search Suggestions */}
      <Popper
        open={showSuggestions && (searchQuery || recentSearches.length > 0)}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{
          zIndex: theme.zIndex.modal,
          width: anchorEl ? anchorEl.offsetWidth : 'auto',
          mt: 1,
        }}
      >
        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxHeight: 400,
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: theme.shadows[3],
            }}
          >
            {searchQuery ? (
              // Search suggestions
              <List dense>
                <ListItem 
                  button 
                  onClick={() => handleRecentSearchClick(searchQuery)}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <SearchIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Search for "${searchQuery}"`}
                    primaryTypographyProps={{ color: 'primary' }}
                  />
                </ListItem>
              </List>
            ) : recentSearches.length > 0 ? (
              // Recent searches
              <>
                <Box 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Recent searches
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="primary"
                    onClick={handleClearRecentSearches}
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Clear all
                  </Typography>
                </Box>
                <List dense>
                  {recentSearches.map((search, index) => (
                    <ListItem 
                      key={index}
                      button 
                      onClick={() => handleRecentSearchClick(search.query)}
                      sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <ListItemIcon>
                        <HistoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={search.query}
                        primaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              // No recent searches
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No recent searches
                </Typography>
              </Box>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default SearchBar;
