import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Validation Schema
const validationSchema = Yup.object().shape({
  companyName: Yup.string().required('Company name is required'),
  gstNumber: Yup.string()
    .required('GST number is required')
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    ),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  mobileNumber: Yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  country: Yup.string().required('Country is required'),
  pincode: Yup.string()
    .required('Pincode is required')
    .matches(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
  website: Yup.string().url('Invalid website URL'),
  industry: Yup.string(),
  description: Yup.string(),
});

export const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(id);

  // Fetch company data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchCompany = async () => {
        try {
          setIsLoading(true);
          const response = await userAPI.getCompany(id);
          const company = response.data;
          
          formik.setValues({
            companyName: company.company_name || '',
            gstNumber: company.gst_number || '',
            firstName: company.first_name || '',
            lastName: company.last_name || '',
            email: company.email || '',
            mobileNumber: company.mobile_number || '',
            address: company.address || '',
            city: company.city || '',
            state: company.state || '',
            country: company.country || 'India',
            pincode: company.pincode || '',
            website: company.website || '',
            industry: company.industry || '',
            description: company.company_description || '',
          });
        } catch (error) {
          console.error('Error fetching company:', error);
          enqueueSnackbar('Failed to load company data', { variant: 'error' });
          navigate('/companies');
        } finally {
          setIsLoading(false);
        }
      };

      fetchCompany();
    }
  }, [id, isEditMode]);

  const formik = useFormik({
    initialValues: {
      companyName: '',
      gstNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      website: '',
      industry: '',
      description: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        setIsSubmitting(true);
        
        const companyData = {
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          email: values.email.trim(),
          mobile_number: values.mobileNumber.trim(),
          company_name: values.companyName.trim(),
          gst_number: values.gstNumber.trim(),
          address: values.address.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          country: values.country.trim(),
          pincode: values.pincode.trim(),
          website: values.website ? values.website.trim() : '',
          industry: values.industry ? values.industry.trim() : '',
          company_description: values.description ? values.description.trim() : ''
        };

        if (isEditMode) {
          // Update existing company
          await userAPI.updateCompany(id, companyData);
          enqueueSnackbar('Company updated successfully!', { variant: 'success' });
        } else {
          // Create new company with a default password
          await userAPI.createCompany({
            ...companyData,
            password: 'Default@123' // Default password that can be changed later
          });
          enqueueSnackbar('Company created successfully!', { variant: 'success' });
        }
        
        navigate('/companies');
      } catch (error) {
        console.error('Error saving company:', error);
        
        // Handle validation errors
        if (error.response?.data?.errors) {
          error.response.data.errors.forEach(err => {
            setFieldError(err.param, err.msg);
          });
        } else {
          enqueueSnackbar(
            error.response?.data?.message || 'Failed to save company. Please try again.',
            { variant: 'error' }
          );
        }
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Card>
        <CardHeader
          title={`${isEditMode ? 'Edit' : 'Create New'} Company`}
          subheader={isEditMode 
            ? 'Update the company details below' 
            : 'Fill in the details below to create a new company'}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Company Information</Typography>
              <TextField
                fullWidth
                label="Company Name"
                name="companyName"
                value={formik.values.companyName}
                onChange={formik.handleChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="GST Number"
                name="gstNumber"
                value={formik.values.gstNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.gstNumber && Boolean(formik.errors.gstNumber)}
                helperText={formik.touched.gstNumber && formik.errors.gstNumber}
                margin="normal"
                variant="outlined"
                placeholder="22AAAAA0000A1Z5"
              />
              <TextField
                fullWidth
                label="Industry"
                name="industry"
                value={formik.values.industry}
                onChange={formik.handleChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formik.values.website}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
                margin="normal"
                variant="outlined"
                placeholder="https://example.com"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                margin="normal"
                variant="outlined"
                placeholder="Brief description about the company"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                    margin="normal"
                    variant="outlined"
                    autoComplete="given-name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                    margin="normal"
                    variant="outlined"
                    autoComplete="family-name"
                  />
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="normal"
                variant="outlined"
                autoComplete="email"
                disabled={isEditMode}
              />
              
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobileNumber"
                value={formik.values.mobileNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mobileNumber && Boolean(formik.errors.mobileNumber)}
                helperText={formik.touched.mobileNumber && formik.errors.mobileNumber}
                margin="normal"
                variant="outlined"
                autoComplete="tel"
                placeholder="9876543210"
              />
              
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                margin="normal"
                variant="outlined"
                multiline
                rows={2}
                autoComplete="street-address"
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    margin="normal"
                    variant="outlined"
                    autoComplete="address-level2"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.state && Boolean(formik.errors.state)}
                    helperText={formik.touched.state && formik.errors.state}
                    margin="normal"
                    variant="outlined"
                    autoComplete="address-level1"
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.country && Boolean(formik.errors.country)}
                    helperText={formik.touched.country && formik.errors.country}
                    margin="normal"
                    variant="outlined"
                    autoComplete="country"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    name="pincode"
                    value={formik.values.pincode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.pincode && Boolean(formik.errors.pincode)}
                    helperText={formik.touched.pincode && formik.errors.pincode}
                    margin="normal"
                    variant="outlined"
                    autoComplete="postal-code"
                    placeholder="400001"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            color="primary"
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={isSubmitting || !formik.isValid}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting 
              ? isEditMode 
                ? 'Updating...' 
                : 'Creating...' 
              : isEditMode 
                ? 'Update Company' 
                : 'Create Company'}
          </Button>
        </Box>
      </Card>
    </form>
  );
};

export default CompanyForm;
