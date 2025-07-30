import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload.user,
        token: action.payload.token,
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: false, 
        user: null,
        token: null,
        error: action.payload 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null,
        token: null,
        error: null 
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Setup axios interceptor for token
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await axios.get(API_ENDPOINTS.PROFILE);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data,
              token
            }
          });
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          dispatch({ type: 'LOGOUT' });
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await axios.post(API_ENDPOINTS.LOGIN, credentials);
      const { token, user } = response.data;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await axios.post(API_ENDPOINTS.REGISTER, userData);
      const { token, user } = response.data;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await axios.post(API_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user status
  const updateStatus = async (status) => {
    try {
      await axios.put(API_ENDPOINTS.STATUS, { status });
      dispatch({
        type: 'UPDATE_USER',
        payload: { status }
      });
      return { success: true };
    } catch (error) {
      console.error('Status update error:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update status' };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      await axios.put(API_ENDPOINTS.PROFILE, profileData);
      dispatch({
        type: 'UPDATE_USER',
        payload: profileData
      });
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateStatus,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};