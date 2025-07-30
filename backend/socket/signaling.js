const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Store active user sessions
const userSessions = new Map();
const activeCalls = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return next(new Error('User not found'));
    }

    socket.user = users[0];
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

const setupSignaling = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected:`, socket.id);

    // Store user session
    userSessions.set(socket.user.id, {
      socketId: socket.id,
      user: socket.user,
      status: 'online'
    });

    // Update user status in database
    try {
      await pool.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['online', socket.user.id]
      );

      // Store session in database
      await pool.execute(
        'INSERT INTO user_sessions (user_id, socket_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE socket_id = ?',
        [socket.user.id, socket.id, socket.id]
      );
    } catch (error) {
      console.error('Database update error:', error);
    }

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Notify contacts about online status
    notifyContactsStatus(socket.user.id, 'online');

    // Handle call initiation
    socket.on('call:initiate', async (data) => {
      try {
        const { receiverId, callType = 'voice' } = data;
        
        // Check if receiver is online
        const receiverSession = userSessions.get(receiverId);
        if (!receiverSession) {
          socket.emit('call:error', { message: 'User is not online' });
          return;
        }

        // Create call record in database
        const [result] = await pool.execute(
          'INSERT INTO calls (caller_id, receiver_id, call_type, status) VALUES (?, ?, ?, ?)',
          [socket.user.id, receiverId, callType, 'initiated']
        );

        const callId = result.insertId;

        // Store call in memory
        activeCalls.set(callId, {
          id: callId,
          callerId: socket.user.id,
          receiverId: receiverId,
          callerSocketId: socket.id,
          receiverSocketId: receiverSession.socketId,
          status: 'initiated',
          callType
        });

        // Send call offer to receiver
        io.to(receiverSession.socketId).emit('call:incoming', {
          callId,
          caller: {
            id: socket.user.id,
            username: socket.user.username,
            fullName: socket.user.full_name
          },
          callType
        });

        // Update call status to ringing
        await pool.execute(
          'UPDATE calls SET status = ? WHERE id = ?',
          ['ringing', callId]
        );

        socket.emit('call:initiated', { callId });

      } catch (error) {
        console.error('Call initiation error:', error);
        socket.emit('call:error', { message: 'Failed to initiate call' });
      }
    });

    // Handle call answer
    socket.on('call:answer', async (data) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call || call.receiverId !== socket.user.id) {
          socket.emit('call:error', { message: 'Invalid call' });
          return;
        }

        // Update call status
        call.status = 'answered';
        activeCalls.set(callId, call);

        await pool.execute(
          'UPDATE calls SET status = ? WHERE id = ?',
          ['answered', callId]
        );

        // Notify caller that call was answered
        io.to(call.callerSocketId).emit('call:answered', { callId });

        socket.emit('call:answered', { callId });

      } catch (error) {
        console.error('Call answer error:', error);
        socket.emit('call:error', { message: 'Failed to answer call' });
      }
    });

    // Handle call rejection
    socket.on('call:reject', async (data) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call || call.receiverId !== socket.user.id) {
          socket.emit('call:error', { message: 'Invalid call' });
          return;
        }

        // Update call status
        await pool.execute(
          'UPDATE calls SET status = ?, end_time = NOW() WHERE id = ?',
          ['rejected', callId]
        );

        // Notify caller that call was rejected
        io.to(call.callerSocketId).emit('call:rejected', { callId });

        // Remove call from active calls
        activeCalls.delete(callId);

      } catch (error) {
        console.error('Call reject error:', error);
        socket.emit('call:error', { message: 'Failed to reject call' });
      }
    });

    // Handle call end
    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call || (call.callerId !== socket.user.id && call.receiverId !== socket.user.id)) {
          socket.emit('call:error', { message: 'Invalid call' });
          return;
        }

        // Calculate duration if call was answered
        let duration = 0;
        if (call.status === 'answered') {
          // In a real implementation, you'd track the start time
          duration = Math.floor(Date.now() / 1000) - Math.floor(Date.now() / 1000); // Placeholder
        }

        // Update call status
        await pool.execute(
          'UPDATE calls SET status = ?, end_time = NOW(), duration = ? WHERE id = ?',
          ['ended', duration, callId]
        );

        // Notify other participant
        const otherSocketId = call.callerId === socket.user.id ? call.receiverSocketId : call.callerSocketId;
        io.to(otherSocketId).emit('call:ended', { callId });

        // Remove call from active calls
        activeCalls.delete(callId);

      } catch (error) {
        console.error('Call end error:', error);
        socket.emit('call:error', { message: 'Failed to end call' });
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtc:offer', (data) => {
      const { callId, offer } = data;
      const call = activeCalls.get(callId);

      if (call && call.callerId === socket.user.id) {
        io.to(call.receiverSocketId).emit('webrtc:offer', { callId, offer });
      }
    });

    socket.on('webrtc:answer', (data) => {
      const { callId, answer } = data;
      const call = activeCalls.get(callId);

      if (call && call.receiverId === socket.user.id) {
        io.to(call.callerSocketId).emit('webrtc:answer', { callId, answer });
      }
    });

    socket.on('webrtc:ice-candidate', (data) => {
      const { callId, candidate } = data;
      const call = activeCalls.get(callId);

      if (call) {
        const targetSocketId = call.callerId === socket.user.id ? call.receiverSocketId : call.callerSocketId;
        io.to(targetSocketId).emit('webrtc:ice-candidate', { callId, candidate });
      }
    });

    // Handle status updates
    socket.on('status:update', async (data) => {
      try {
        const { status } = data;
        
        if (!['online', 'offline', 'busy', 'away'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        // Update in database
        await pool.execute(
          'UPDATE users SET status = ? WHERE id = ?',
          [status, socket.user.id]
        );

        // Update in memory
        const session = userSessions.get(socket.user.id);
        if (session) {
          session.status = status;
          userSessions.set(socket.user.id, session);
        }

        // Notify contacts
        notifyContactsStatus(socket.user.id, status);

      } catch (error) {
        console.error('Status update error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected:`, socket.id);

      try {
        // Update user status to offline
        await pool.execute(
          'UPDATE users SET status = ? WHERE id = ?',
          ['offline', socket.user.id]
        );

        // Remove session from database
        await pool.execute(
          'DELETE FROM user_sessions WHERE user_id = ?',
          [socket.user.id]
        );

        // End any active calls
        for (const [callId, call] of activeCalls.entries()) {
          if (call.callerId === socket.user.id || call.receiverId === socket.user.id) {
            const otherSocketId = call.callerId === socket.user.id ? call.receiverSocketId : call.callerSocketId;
            io.to(otherSocketId).emit('call:ended', { callId, reason: 'user_disconnected' });
            
            // Update call in database
            await pool.execute(
              'UPDATE calls SET status = ?, end_time = NOW() WHERE id = ?',
              ['ended', callId]
            );
            
            activeCalls.delete(callId);
          }
        }

        // Remove user session
        userSessions.delete(socket.user.id);

        // Notify contacts about offline status
        notifyContactsStatus(socket.user.id, 'offline');

      } catch (error) {
        console.error('Disconnect cleanup error:', error);
      }
    });
  });

  // Helper function to notify contacts about status changes
  async function notifyContactsStatus(userId, status) {
    try {
      // Get user's contacts
      const [contacts] = await pool.execute(
        'SELECT contact_user_id FROM contacts WHERE user_id = ?',
        [userId]
      );

      // Also get users who have this user as a contact
      const [reverseContacts] = await pool.execute(
        'SELECT user_id FROM contacts WHERE contact_user_id = ?',
        [userId]
      );

      const allContactIds = [
        ...contacts.map(c => c.contact_user_id),
        ...reverseContacts.map(c => c.user_id)
      ];

      // Notify each online contact
      for (const contactId of allContactIds) {
        const contactSession = userSessions.get(contactId);
        if (contactSession) {
          io.to(contactSession.socketId).emit('contact:status', {
            userId,
            status
          });
        }
      }
    } catch (error) {
      console.error('Notify contacts error:', error);
    }
  }
};

module.exports = setupSignaling;