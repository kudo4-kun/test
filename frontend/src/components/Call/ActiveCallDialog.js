import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import { useWebRTC } from '../../hooks/useWebRTC';

const ActiveCallDialog = ({ callData, onEndCall }) => {
  const { endCall } = useSocket();
  const { toggleMute, isMuted, connectionState, createOffer } = useWebRTC();
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  // Start call timer when call becomes active
  useEffect(() => {
    if (connectionState === 'connected' && !callStartTime) {
      setCallStartTime(Date.now());
    }
  }, [connectionState, callStartTime]);

  // Update call duration every second
  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);

  // Initialize WebRTC offer for outgoing calls
  useEffect(() => {
    if (callData && callData.isOutgoing && connectionState === 'new') {
      createOffer(callData.callId);
    }
  }, [callData, connectionState, createOffer]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (callData) {
      endCall(callData.callId);
      onEndCall();
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'new':
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'disconnected':
        return 'Call ended';
      case 'failed':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'success';
      case 'connecting':
      case 'new':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!callData) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element for remote stream */}
      <audio id="remoteAudio" autoPlay />
      
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            {/* Connection progress bar */}
            {(connectionState === 'connecting' || connectionState === 'new') && (
              <LinearProgress 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main'
                  }
                }} 
              />
            )}

            {/* Call status */}
            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              sx={{ mb: 2 }}
            />

            {/* Contact avatar and info */}
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                fontSize: '3rem',
                backgroundColor: 'primary.main'
              }}
            >
              {callData.contact?.fullName?.charAt(0) || 
               callData.contact?.username?.charAt(0) || 
               callData.receiverName?.charAt(0) || '?'}
            </Avatar>

            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              {callData.contact?.fullName || 
               callData.contact?.username || 
               callData.receiverName || 'Unknown'}
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
              @{callData.contact?.username || 'unknown'}
            </Typography>

            {/* Call controls */}
            <Box display="flex" gap={3} justifyContent="center" mb={3}>
              {/* Mute toggle */}
              <IconButton
                onClick={toggleMute}
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: isMuted ? 'error.main' : 'grey.700',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: isMuted ? 'error.dark' : 'grey.600',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </IconButton>

              {/* Speaker indicator (placeholder) */}
              <IconButton
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: 'grey.700',
                  color: 'white'
                }}
                disabled
              >
                <VolumeUpIcon />
              </IconButton>
            </Box>

            {/* End call button */}
            <IconButton
              onClick={handleEndCall}
              sx={{
                width: 70,
                height: 70,
                backgroundColor: 'error.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'error.dark',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s'
              }}
            >
              <PhoneDisabledIcon sx={{ fontSize: 32 }} />
            </IconButton>

            {/* Call info */}
            <Box mt={3}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {callData.callType === 'video' ? 'Video Call' : 'Voice Call'}
                {connectionState === 'connected' && ' • HD Quality'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveCallDialog;