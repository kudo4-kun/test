import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onToggleForm }) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      return;
    }

    const result = await login(formData);
    if (!result.success) {
      // Error is handled by context
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                mb: 2
              }}
            >
              <PhoneIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              VoIP App
            </Typography>
            <Typography variant="body2" color="textSecondary" textAlign="center">
              Connect with crystal clear voice calls
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
            Welcome Back
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username or Email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={onToggleForm}
                sx={{
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;