import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TablePagination,
  IconButton,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export const CompanyList = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  // State management
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState(query.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(query.get('status') || 'all');
  
  // Permission checks
  const canEdit = hasPermission('company_edit');
  const canDelete = hasPermission('company_delete');
  const canView = hasPermission('company_view');
  const canCreate = hasPermission('company_create');
  
  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  // Fetch companies with filters and pagination
  const fetchCompanies = useCallback(async (page = 0, search = searchQuery, status = statusFilter) => {
    try {
      const isInitialLoad = page === 0 && search === searchQuery && status === statusFilter;
      
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // Build query params
      const params = {
        role: 'company',
        page: page + 1,
        limit: pagination.pageSize,
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
      
      const response = await userAPI.getCompanies(params);
      
      setCompanies(response.data.users || response.data);
      setPagination({
        ...pagination,
        page,
        total: response.data.total || response.data.length,
        totalPages: Math.ceil((response.data.total || response.data.length) / pagination.pageSize)
      });
      
      // Update URL with current filters
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (status !== 'all') queryParams.set('status', status);
      
      const newSearch = queryParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      
      if (newPath !== location.pathname + location.search) {
        navigate(newPath, { replace: true });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to load companies', 
        { variant: 'error' }
      );
      throw error;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.pageSize, searchQuery, statusFilter, location.pathname, location.search, navigate, enqueueSnackbar]);

  // Handle initial load and filter changes
  useEffect(() => {
    const page = parseInt(query.get('page')) || 0;
    const search = query.get('search') || '';
    const status = query.get('status') || 'all';
    
    setSearchQuery(search);
    setStatusFilter(status);
    
    fetchCompanies(page, search, status);
  }, [fetchCompanies, query]);
  
  // Handle refresh
  const handleRefresh = () => {
    fetchCompanies(pagination.page, searchQuery, statusFilter);
  };
  
  // Handle search with debounce
  const handleSearch = useCallback((event) => {
    const value = event.target.value;
    setSearchQuery(value);
    // Reset to first page when searching
    fetchCompanies(0, value, statusFilter);
  }, [fetchCompanies, statusFilter]);
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    // Reset to first page when changing status
    fetchCompanies(0, searchQuery, value);
  };

  const handlePageChange = (event, newPage) => {
    fetchCompanies(newPage, searchQuery, statusFilter);
  };
  
  // Handle company status toggle
  const handleToggleStatus = async (companyId, currentStatus) => {
    const snackbarKey = `toggle-${companyId}-${Date.now()}`;
    const newStatus = !currentStatus;
    
    try {
      enqueueSnackbar('Updating company status...', { 
        key: snackbarKey,
        variant: 'info',
        persist: true
      });
      
      await userAPI.toggleUserStatus(companyId, newStatus);
      
      // Update local state
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === companyId 
            ? { ...company, is_active: newStatus } 
            : company
        )
      );
      
      enqueueSnackbar(
        `Company ${newStatus ? 'activated' : 'deactivated'} successfully`, 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error toggling company status:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to update company status',
        { variant: 'error' }
      );
    } finally {
      closeSnackbar(snackbarKey);
    }
  };
  
  // Handle company deletion
  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }
    
    const snackbarKey = `delete-${companyId}-${Date.now()}`;
    
    try {
      enqueueSnackbar('Deleting company...', { 
        key: snackbarKey,
        variant: 'info',
        persist: true
      });
      
      await userAPI.deleteUser(companyId);
      
      // Refresh the list
      await fetchCompanies(pagination.page, searchQuery, statusFilter);
      
      enqueueSnackbar('Company deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting company:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to delete company',
        { variant: 'error' }
      );
    } finally {
      closeSnackbar(snackbarKey);
    }
  };



  const handleChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 0 // Reset to first page when changing page size
    }));
  };

  const handleEditCompany = (companyId) => {
    navigate(`/companies/${companyId}/edit`);
  };

  // If user doesn't have view permission, show access denied
  if (!canView) {
    return (
      <Box p={3}>
        <Alert severity="error">
          You don't have permission to view companies. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Companies</Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isRefreshing}
              startIcon={<RefreshIcon />}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/companies/new"
                startIcon={<AddIcon />}
              >
                Add Company
              </Button>
            )}
          </Box>
        </Box>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            variant="outlined"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>GST</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="textSecondary">
                          {searchQuery || statusFilter !== 'all' 
                            ? 'No matching companies found. Try adjusting your filters.'
                            : 'No companies found. Create your first company to get started.'}
                        </Typography>
                        {!searchQuery && statusFilter === 'all' && canCreate && (
                          <Box mt={2}>
                            <Button
                              variant="contained"
                              color="primary"
                              component={RouterLink}
                              to="/companies/new"
                              startIcon={<AddIcon />}
                            >
                              Add Company
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow 
                      key={company.id}
                      hover
                      sx={{ '&:hover': { cursor: 'pointer' } }}
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{company.company_name || 'N/A'}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {company.industry || 'No industry specified'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {company.first_name} {company.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {company.designation || 'Contact'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${company.email}`} onClick={e => e.stopPropagation()}>
                          {company.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${company.mobile_number}`} onClick={e => e.stopPropagation()}>
                          {company.mobile_number || 'N/A'}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={company.gst_number || 'Not provided'}>
                          <Chip 
                            label={company.gst_number ? 'GST Available' : 'No GST'}
                            size="small"
                            variant="outlined"
                            color={company.gst_number ? 'primary' : 'default'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={new Date(company.created_at).toLocaleString()}>
                          <Typography variant="body2">
                            {formatDate(company.created_at, 'MMM d, yyyy')}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={company.is_active ? 'Click to deactivate' : 'Click to activate'}>
                          <Switch
                            checked={company.is_active}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(company.id, company.is_active);
                            }}
                            color="success"
                            size="small"
                            disabled={!canEdit}
                          />
                        </Tooltip>
                        <Chip 
                          label={company.is_active ? 'Active' : 'Inactive'}
                          color={company.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton 
                          size="small" 
                          component={RouterLink} 
                          to={`/companies/${company.id}`}
                          color="primary"
                          title="View details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canEdit && (
                          <IconButton 
                            size="small" 
                            component={RouterLink} 
                            to={`/companies/${company.id}/edit`}
                            color="primary"
                            title="Edit company"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <Tooltip title="Delete company">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(company.id);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.pageSize}
              page={pagination.page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={(e) => {
                const newPageSize = parseInt(e.target.value, 10);
                setPagination({
                  ...pagination,
                  page: 0, // Reset to first page
                  pageSize: newPageSize
                });
              }}
              labelRowsPerPage="Companies per page:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
              }
              sx={{
                '& .MuiTablePagination-toolbar': {
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  p: 1
                },
                '& .MuiTablePagination-spacer': {
                  flex: '0 0 0',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  m: 0,
                  fontSize: '0.8rem'
                },
                '& .MuiTablePagination-actions': {
                  ml: 1
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default CompanyList;
