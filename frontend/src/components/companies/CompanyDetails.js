import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const { hasPermission } = useAuth();

  const fetchCompanyDetails = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getUser(id);
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast.error('Failed to load company details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/companies/edit/${id}`);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!company) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6">Company not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Company Details
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {hasPermission('company_edit') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
        )}
      </Box>

      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              <Avatar
                src={company.avatar_url || '/static/default-company.png'}
                sx={{ width: 60, height: 60, mr: 2 }}
              >
                {company.company_name?.charAt(0) || 'C'}
              </Avatar>
              <div>
                <Typography variant="h5">{company.company_name || 'N/A'}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {company.gst_number || 'No GST'}
                </Typography>
              </div>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={company.is_active ? 'Active' : 'Inactive'}
                  color={company.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          }
        />
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="company tabs"
        >
          <Tab label="Overview" />
          <Tab label="Contact Information" />
          <Tab label="Settings" />
        </Tabs>
        
        <Divider />
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Company Information</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ width: '40%', fontWeight: 'bold' }}>Company Name</TableCell>
                      <TableCell>{company.company_name || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>GST Number</TableCell>
                      <TableCell>{company.gst_number || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Industry</TableCell>
                      <TableCell>{company.industry || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Website</TableCell>
                      <TableCell>
                        {company.website ? (
                          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer">
                            {company.website}
                          </a>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell>{company.company_description || 'No description provided'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ width: '40%', fontWeight: 'bold' }}>Contact Person</TableCell>
                      <TableCell>{company.first_name} {company.last_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell>
                        <a href={`mailto:${company.email}`}>{company.email}</a>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                      <TableCell>{company.mobile_number || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Address</TableCell>
                      <TableCell>
                        {company.address ? (
                          <>
                            {company.address}<br />
                            {company.city}, {company.state}<br />
                            {company.country} - {company.pincode}
                          </>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Contact Details</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>Primary Contact</TableCell>
                  <TableCell>{company.first_name} {company.last_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell>
                    <a href={`mailto:${company.email}`}>{company.email}</a>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell>{company.mobile_number || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell>
                    {company.address ? (
                      <>
                        {company.address}<br />
                        {company.city}, {company.state}<br />
                        {company.country} - {company.pincode}
                      </>
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Account Settings</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ width: '30%', fontWeight: 'bold' }}>Account Status</TableCell>
                  <TableCell>
                    <Chip
                      label={company.is_active ? 'Active' : 'Inactive'}
                      color={company.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                  <TableCell>{new Date(company.created_at).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                  <TableCell>{company.updated_at ? new Date(company.updated_at).toLocaleString() : 'N/A'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default CompanyDetails;
