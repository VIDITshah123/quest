import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Snackbar,
  Alert,
  Box
} from '@mui/material';
import { generateAttendanceCode, getClassAttendance } from '../../services/attendanceService';

export default function TeacherDashboard() {
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([
    { id: 1, name: 'Mathematics 101' },
    { id: 2, name: 'Physics 101' },
    { id: 3, name: 'Chemistry 101' },
  ]);
  const [attendanceCode, setAttendanceCode] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleGenerateCode = async () => {
    try {
      const response = await generateAttendanceCode(classId);
      setAttendanceCode(response.code);
      setCodeExpiresAt(new Date(response.expiresAt).toLocaleTimeString());
      setSnackbar({
        open: true,
        message: 'Attendance code generated successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to generate attendance code',
        severity: 'error'
      });
    }
  };

  const fetchAttendance = async () => {
    if (!classId) return;
    
    try {
      const response = await getClassAttendance(classId, selectedDate);
      setAttendanceData(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch attendance data',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    if (classId) {
      fetchAttendance();
    }
  }, [classId, selectedDate]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
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
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Date Picker */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            variant="outlined"
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Generate Code Section */}
        {classId && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generate Attendance Code
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleGenerateCode}
                  disabled={!classId}
                >
                  Generate Code
                </Button>
                
                {attendanceCode && (
                  <Box mt={2}>
                    <Typography variant="body1">
                      <strong>Code:</strong> {attendanceCode}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Expires at: {codeExpiresAt}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Attendance Table */}
        {classId && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance for {selectedDate}
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Marked At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.length > 0 ? (
                        attendanceData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.name}</TableCell>
                            <TableCell>{record.email}</TableCell>
                            <TableCell>
                              <span style={{
                                color: record.status === 'present' ? 'green' : 'inherit',
                                fontWeight: 'bold'
                              }}>
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'Not marked'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No attendance records found for this date
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
