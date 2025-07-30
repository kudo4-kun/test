import { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTC = () => {
  const { getSocket, sendOffer, sendAnswer, sendIceCandidate } = useSocket();
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [connectionState, setConnectionState] = useState('new');

  // Initialize peer connection
  const initializePeerConnection = useCallback((callId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
    setCurrentCallId(callId);

    const pc = peerConnectionRef.current;

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsCallActive(true);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Remote stream received:', event.streams[0]);
      remoteStreamRef.current = event.streams[0];
      
      // You can dispatch an event here to update UI with remote stream
      const remoteAudio = document.getElementById('remoteAudio');
      if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        sendIceCandidate(callId, event.candidate);
      }
    };

    // Handle ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, [sendIceCandidate]);

  // Get user media (microphone)
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      localStreamRef.current = stream;
      console.log('Local stream obtained:', stream);
      
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Failed to access microphone');
    }
  }, []);

  // Create and send offer (caller)
  const createOffer = useCallback(async (callId) => {
    try {
      const pc = initializePeerConnection(callId);
      const stream = await getUserMedia();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('Sending offer:', offer);
      sendOffer(callId, offer);
      
      return true;
    } catch (error) {
      console.error('Error creating offer:', error);
      return false;
    }
  }, [initializePeerConnection, getUserMedia, sendOffer]);

  // Handle incoming offer and create answer (receiver)
  const handleOffer = useCallback(async (callId, offer) => {
    try {
      const pc = initializePeerConnection(callId);
      const stream = await getUserMedia();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('Sending answer:', answer);
      sendAnswer(callId, answer);
      
      return true;
    } catch (error) {
      console.error('Error handling offer:', error);
      return false;
    }
  }, [initializePeerConnection, getUserMedia, sendAnswer]);

  // Handle incoming answer (caller)
  const handleAnswer = useCallback(async (answer) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('No peer connection available');
        return false;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Answer processed successfully');
      
      return true;
    } catch (error) {
      console.error('Error handling answer:', error);
      return false;
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('No peer connection available');
        return false;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added successfully');
      
      return true;
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      return false;
    }
  }, []);

  // End call and cleanup
  const endCall = useCallback(() => {
    console.log('Ending call and cleaning up...');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset state
    setIsCallActive(false);
    setIsMuted(false);
    setCurrentCallId(null);
    setConnectionState('new');
    remoteStreamRef.current = null;

    // Clear remote audio element
    const remoteAudio = document.getElementById('remoteAudio');
    if (remoteAudio) {
      remoteAudio.srcObject = null;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Mute toggled:', !audioTrack.enabled);
      }
    }
  }, []);

  // Setup socket event listeners for WebRTC signaling
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOfferEvent = (data) => {
      console.log('Offer received:', data);
      handleOffer(data.callId, data.offer);
    };

    const handleAnswerEvent = (data) => {
      console.log('Answer received:', data);
      handleAnswer(data.answer);
    };

    const handleIceCandidateEvent = (data) => {
      console.log('ICE candidate received:', data);
      handleIceCandidate(data.candidate);
    };

    socket.on('webrtc:offer', handleOfferEvent);
    socket.on('webrtc:answer', handleAnswerEvent);
    socket.on('webrtc:ice-candidate', handleIceCandidateEvent);

    return () => {
      socket.off('webrtc:offer', handleOfferEvent);
      socket.off('webrtc:answer', handleAnswerEvent);
      socket.off('webrtc:ice-candidate', handleIceCandidateEvent);
    };
  }, [getSocket, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    endCall,
    toggleMute,
    isCallActive,
    isMuted,
    currentCallId,
    connectionState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current
  };
};