import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Snackbar,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { markAttendance, getStudentAttendance } from '../../services/attendanceService';

export default function StudentDashboard() {
  const [classId, setClassId] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState([
    { id: 1, name: 'Mathematics 101' },
    { id: 2, name: 'Physics 101' },
    { id: 3, name: 'Chemistry 101' },
  ]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!classId || !code) {
      setSnackbar({
        open: true,
        message: 'Please select a class and enter the attendance code',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      await markAttendance(classId, code);
      setSnackbar({
        open: true,
        message: 'Attendance marked successfully!',
        severity: 'success'
      });
      setCode('');
      fetchAttendance();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to mark attendance',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!classId) return;
    
    try {
      const response = await getStudentAttendance(classId);
      setAttendanceRecords(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch attendance records',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    if (classId) {
      fetchAttendance();
    } else {
      setAttendanceRecords([]);
    }
  }, [classId]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success.main';
      case 'absent':
        return 'error.main';
      case 'late':
        return 'warning.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Class Selection */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Select Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            variant="outlined"
            margin="normal"
          >
            <MenuItem value="">Select a class</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Mark Attendance Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mark Attendance
              </Typography>
              <form onSubmit={handleMarkAttendance}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Attendance Code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
                      variant="outlined"
                      margin="normal"
                      placeholder="Enter 6-digit code"
                      disabled={!classId}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!classId || !code || isLoading}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Ask your teacher for the attendance code
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance History */}
        {classId && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Attendance History
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Marked At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Box 
                                component="span"
                                sx={{
                                  color: getStatusColor(record.status),
                                  fontWeight: 'bold'
                                }}
                              >
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Box>
                            </TableCell>
                            <TableCell>{record.class_name}</TableCell>
                            <TableCell>
                              {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No attendance records found for this class
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
