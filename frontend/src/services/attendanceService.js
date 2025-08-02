import axios from 'axios';

const API_URL = '/api/attendance';

// Generate attendance code (Teacher only)
export const generateAttendanceCode = async (classId, expiresInMinutes = 15) => {
  try {
    const response = await axios.post(`${API_URL}/generate-code`, {
      classId,
      expiresInMinutes
    });
    return response.data;
  } catch (error) {
    console.error('Error generating attendance code:', error);
    throw error;
  }
};

// Mark attendance (Student)
export const markAttendance = async (classId, code) => {
  try {
    const response = await axios.post(`${API_URL}/mark`, {
      classId,
      code
    });
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Get class attendance (Teacher)
export const getClassAttendance = async (classId, date) => {
  try {
    const response = await axios.get(`${API_URL}/class/${classId}`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    throw error;
  }
};

// Get student attendance (Student)
export const getStudentAttendance = async (classId) => {
  try {
    const response = await axios.get(`${API_URL}/student`, {
      params: { classId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
};
