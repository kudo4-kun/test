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

const RegisterForm = ({ onToggleForm }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
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
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              error={!!formErrors.username}
              helperText={formErrors.username}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              error={!!formErrors.email}
              helperText={formErrors.email}
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
              error={!!formErrors.password}
              helperText={formErrors.password}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
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
                'Create Account'
              )}
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="textSecondary">
              Already have an account?{' '}
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
                Sign in here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;