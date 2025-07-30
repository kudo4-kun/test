import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Chip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ContactsList from './ContactsList';
import IncomingCallDialog from '../Call/IncomingCallDialog';
import ActiveCallDialog from '../Call/ActiveCallDialog';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleInitiateCall = (callData) => {
    setActiveCall(callData);
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <PhoneIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VoIP App
          </Typography>

          {/* Connection status */}
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
            size="small"
            sx={{ mr: 2, color: 'white', borderColor: 'white' }}
          />

          {/* User menu */}
          <IconButton
            size="large"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Badge color="success" variant="dot" invisible={!isConnected}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircleIcon sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <SettingsIcon sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Welcome card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  Welcome back, {user?.fullName || user?.username}!
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  You're connected and ready to make crystal clear voice calls.
                  {!isConnected && ' Please check your connection.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Contacts section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Contacts" 
                subheader="Manage your contacts and start calls"
              />
              <CardContent>
                <ContactsList onInitiateCall={handleInitiateCall} />
              </CardContent>
            </Card>
          </Grid>

          {/* Quick actions / Recent calls */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Recent Activity" 
                subheader="Your recent calls and activity"
              />
              <CardContent>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  height={200}
                  color="textSecondary"
                >
                  <Typography>
                    Call history feature coming soon...
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Status/Stats cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {isConnected ? '✓' : '✗'}
                </Typography>
                <Typography variant="h6">
                  Connection
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {isConnected ? 'Online' : 'Offline'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  0
                </Typography>
                <Typography variant="h6">
                  Active Calls
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  ♪
                </Typography>
                <Typography variant="h6">
                  Audio Quality
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  HD Voice Ready
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  🔒
                </Typography>
                <Typography variant="h6">
                  Security
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  End-to-end encrypted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Call dialogs */}
      <IncomingCallDialog />
      {activeCall && (
        <ActiveCallDialog 
          callData={activeCall} 
          onEndCall={handleEndCall}
        />
      )}
    </Box>
  );
};

export default Dashboard;