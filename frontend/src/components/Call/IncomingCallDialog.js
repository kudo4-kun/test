import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Grow
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import { useWebRTC } from '../../hooks/useWebRTC';

const IncomingCallDialog = () => {
  const { incomingCall, answerCall, rejectCall } = useSocket();
  const { handleOffer } = useWebRTC();

  const handleAnswer = async () => {
    if (incomingCall) {
      // Answer the call through socket
      answerCall(incomingCall.callId);
      
      // Note: WebRTC offer will be handled automatically through socket events
      // The handleOffer from useWebRTC will be called when the offer arrives
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      rejectCall(incomingCall.callId);
    }
  };

  if (!incomingCall) {
    return null;
  }

  return (
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
      TransitionComponent={Grow}
    >
      <DialogContent sx={{ p: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          <Typography variant="h6" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
            Incoming {incomingCall.callType || 'voice'} call
          </Typography>

          <Avatar
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              fontSize: '3rem',
              backgroundColor: 'primary.main'
            }}
          >
            {incomingCall.caller?.fullName?.charAt(0) || 
             incomingCall.caller?.username?.charAt(0) || '?'}
          </Avatar>

          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            {incomingCall.caller?.fullName || incomingCall.caller?.username || 'Unknown'}
          </Typography>

          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
            @{incomingCall.caller?.username || 'unknown'}
          </Typography>

          <Box display="flex" gap={4} justifyContent="center">
            <IconButton
              onClick={handleReject}
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

            <IconButton
              onClick={handleAnswer}
              sx={{
                width: 70,
                height: 70,
                backgroundColor: 'success.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'success.dark',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s'
              }}
            >
              <PhoneIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          <Box mt={3}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Swipe up to answer • Swipe down to decline
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;