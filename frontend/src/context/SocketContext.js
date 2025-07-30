import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeCalls, setActiveCalls] = useState(new Map());
  const [incomingCall, setIncomingCall] = useState(null);
  const [contactStatuses, setContactStatuses] = useState(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      console.log('Connecting to socket server...');
      
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket'],
        upgrade: true
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Call events
      socket.on('call:incoming', (data) => {
        console.log('Incoming call:', data);
        setIncomingCall(data);
      });

      socket.on('call:initiated', (data) => {
        console.log('Call initiated:', data);
        // You can add UI feedback here
      });

      socket.on('call:answered', (data) => {
        console.log('Call answered:', data);
        setActiveCalls(prev => {
          const updated = new Map(prev);
          const call = updated.get(data.callId);
          if (call) {
            call.status = 'answered';
            updated.set(data.callId, call);
          }
          return updated;
        });
      });

      socket.on('call:rejected', (data) => {
        console.log('Call rejected:', data);
        setActiveCalls(prev => {
          const updated = new Map(prev);
          updated.delete(data.callId);
          return updated;
        });
        setIncomingCall(null);
      });

      socket.on('call:ended', (data) => {
        console.log('Call ended:', data);
        setActiveCalls(prev => {
          const updated = new Map(prev);
          updated.delete(data.callId);
          return updated;
        });
        setIncomingCall(null);
      });

      socket.on('call:error', (data) => {
        console.error('Call error:', data);
        // Handle call errors
      });

      // Contact status updates
      socket.on('contact:status', (data) => {
        console.log('Contact status update:', data);
        setContactStatuses(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, data.status);
          return updated;
        });
      });

      // WebRTC signaling events will be handled by WebRTC hook
      socket.on('webrtc:offer', (data) => {
        console.log('WebRTC offer received:', data);
        // This will be handled by WebRTC context/hook
      });

      socket.on('webrtc:answer', (data) => {
        console.log('WebRTC answer received:', data);
        // This will be handled by WebRTC context/hook
      });

      socket.on('webrtc:ice-candidate', (data) => {
        console.log('WebRTC ICE candidate received:', data);
        // This will be handled by WebRTC context/hook
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socketRef.current = null;
          setIsConnected(false);
        }
      };
    }
  }, [isAuthenticated, token]);

  // Cleanup on unmount or logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setActiveCalls(new Map());
      setIncomingCall(null);
      setContactStatuses(new Map());
    }
  }, [isAuthenticated]);

  // Socket utility functions
  const initiateCall = (receiverId, callType = 'voice') => {
    if (socketRef.current && isConnected) {
      console.log('Initiating call to:', receiverId);
      socketRef.current.emit('call:initiate', { receiverId, callType });
      return true;
    }
    return false;
  };

  const answerCall = (callId) => {
    if (socketRef.current && isConnected) {
      console.log('Answering call:', callId);
      socketRef.current.emit('call:answer', { callId });
      setIncomingCall(null);
      return true;
    }
    return false;
  };

  const rejectCall = (callId) => {
    if (socketRef.current && isConnected) {
      console.log('Rejecting call:', callId);
      socketRef.current.emit('call:reject', { callId });
      setIncomingCall(null);
      return true;
    }
    return false;
  };

  const endCall = (callId) => {
    if (socketRef.current && isConnected) {
      console.log('Ending call:', callId);
      socketRef.current.emit('call:end', { callId });
      return true;
    }
    return false;
  };

  const updateStatus = (status) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('status:update', { status });
      return true;
    }
    return false;
  };

  // WebRTC signaling functions
  const sendOffer = (callId, offer) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('webrtc:offer', { callId, offer });
      return true;
    }
    return false;
  };

  const sendAnswer = (callId, answer) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('webrtc:answer', { callId, answer });
      return true;
    }
    return false;
  };

  const sendIceCandidate = (callId, candidate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('webrtc:ice-candidate', { callId, candidate });
      return true;
    }
    return false;
  };

  // Get socket instance for WebRTC context
  const getSocket = () => socketRef.current;

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    activeCalls,
    incomingCall,
    contactStatuses,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    updateStatus,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    getSocket,
    clearIncomingCall
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};