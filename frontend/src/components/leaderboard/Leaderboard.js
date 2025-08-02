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
  Avatar,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeRange, setTimeRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Generate mock data
        const mockData = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          rank: i + 1,
          name: `User ${i + 1}`,
          avatar: `https://i.pravatar.cc/150?img=${i % 70}`, // Random avatar
          score: 1000 - (i * 10) + Math.floor(Math.random() * 50),
          questionsAnswered: 50 + Math.floor(Math.random() * 100),
          accuracy: (80 + Math.floor(Math.random() * 20)).toFixed(1) + '%',
          change: i < 3 ? 0 : (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 10)
        }));
        
        setLeaderboardData(mockData);
        setIsLoading(false);
      }, 800);
    };

    fetchLeaderboard();
  }, [timeRange]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTimeRange(newValue);
    setPage(0);
  };

  const getTopThree = () => {
    if (leaderboardData.length < 3) return [];
    return leaderboardData.slice(0, 3);
  };

  const topThree = getTopThree();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Leaderboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        See how you rank against other users
      </Typography>

      {/* Time Range Tabs */}
      <Tabs 
        value={timeRange} 
        onChange={handleTabChange} 
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="All Time" value="all" />
        <Tab label="This Month" value="month" />
        <Tab label="This Week" value="week" />
      </Tabs>

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} justifyContent="center">
            {topThree.map((user, index) => (
              <Grid item xs={12} sm={4} key={user.id}>
                <Card 
                  elevation={index === 1 ? 8 : 4}
                  sx={{ 
                    textAlign: 'center',
                    pt: 3,
                    pb: 2,
                    position: 'relative',
                    height: '100%',
                    ...(index === 1 && { 
                      transform: 'scale(1.05)',
                      zIndex: 1,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    })
                  }}
                >
                  <Box 
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      ...(index === 0 && { 
                        backgroundColor: '#FFD700',
                        boxShadow: '0 0 10px #FFD700'
                      }),
                      ...(index === 1 && { 
                        backgroundColor: '#C0C0C0',
                        boxShadow: '0 0 10px #C0C0C0'
                      }),
                      ...(index === 2 && { 
                        backgroundColor: '#CD7F32',
                        boxShadow: '0 0 10px #CD7F32'
                      })
                    }}
                  >
                    {index + 1}
                  </Box>
                  
                  <Avatar 
                    src={user.avatar} 
                    alt={user.name}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto',
                      mb: 2,
                      border: '3px solid',
                      borderColor: 'primary.main'
                    }}
                  />
                  
                  <Typography variant="h6" component="div">
                    {user.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {user.score} points
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon color="primary" fontSize="small" />
                      <Typography variant="caption">
                        {user.questionsAnswered}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUpIcon 
                        fontSize="small" 
                        color={user.change >= 0 ? 'success' : 'error'} 
                        sx={{ 
                          transform: user.change >= 0 ? 'none' : 'rotate(180deg)' 
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        color={user.change >= 0 ? 'success.main' : 'error.main'}
                      >
                        {Math.abs(user.change)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Leaderboard Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Questions</TableCell>
                <TableCell align="right">Accuracy</TableCell>
                <TableCell align="right">Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography>Loading leaderboard data...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaderboardData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow 
                      key={row.id}
                      hover
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {row.rank <= 3 ? (
                            <TrophyIcon 
                              sx={{ 
                                color: row.rank === 1 ? '#FFD700' : 
                                      row.rank === 2 ? '#C0C0C0' : '#CD7F32',
                                fontSize: 20
                              }} 
                            />
                          ) : (
                            <Typography variant="body2">{row.rank}</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={row.avatar} alt={row.name} sx={{ width: 32, height: 32 }} />
                          <Typography>{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{row.score}</TableCell>
                      <TableCell align="right">{row.questionsAnswered}</TableCell>
                      <TableCell align="right">{row.accuracy}</TableCell>
                      <TableCell align="right">
                        <Box 
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: row.change >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {row.change >= 0 ? '↑' : '↓'} {Math.abs(row.change)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={leaderboardData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* User's Position Card */}
      {!isLoading && leaderboardData.length > 0 && (
        <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Position
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">You</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rank: #{leaderboardData.length > 10 ? '10+' : leaderboardData.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Score: {leaderboardData[leaderboardData.length - 1]?.score || 0}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography color="success.main" variant="body2">
                  +5 this week
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Leaderboard;
