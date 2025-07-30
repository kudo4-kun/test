const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get call history for the authenticated user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [calls] = await pool.execute(`
      SELECT 
        c.*,
        caller.username as caller_username,
        caller.full_name as caller_name,
        caller.avatar_url as caller_avatar,
        receiver.username as receiver_username,
        receiver.full_name as receiver_name,
        receiver.avatar_url as receiver_avatar
      FROM calls c
      JOIN users caller ON c.caller_id = caller.id
      JOIN users receiver ON c.receiver_id = receiver.id
      WHERE c.caller_id = ? OR c.receiver_id = ?
      ORDER BY c.start_time DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM calls c
      WHERE c.caller_id = ? OR c.receiver_id = ?
    `, [req.user.id, req.user.id]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      calls,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new call record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverId, callType = 'voice' } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: 'Cannot call yourself' });
    }

    // Check if receiver exists
    const [receivers] = await pool.execute(
      'SELECT id, username, status FROM users WHERE id = ?',
      [receiverId]
    );

    if (receivers.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Create call record
    const [result] = await pool.execute(
      'INSERT INTO calls (caller_id, receiver_id, call_type, status) VALUES (?, ?, ?, ?)',
      [req.user.id, receiverId, callType, 'initiated']
    );

    // Get the created call details
    const [callDetails] = await pool.execute(`
      SELECT 
        c.*,
        caller.username as caller_username,
        caller.full_name as caller_name,
        receiver.username as receiver_username,
        receiver.full_name as receiver_name
      FROM calls c
      JOIN users caller ON c.caller_id = caller.id
      JOIN users receiver ON c.receiver_id = receiver.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Call initiated',
      call: callDetails[0]
    });
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update call status
router.put('/:callId/status', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status } = req.body;

    const validStatuses = ['initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid call status' });
    }

    // Check if call exists and user is involved
    const [calls] = await pool.execute(
      'SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR receiver_id = ?)',
      [callId, req.user.id, req.user.id]
    );

    if (calls.length === 0) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const call = calls[0];
    const updateData = { status };

    // Handle specific status updates
    if (status === 'ended') {
      const now = new Date();
      updateData.end_time = now;
      
      // Calculate duration if call was answered
      if (call.status === 'answered') {
        const duration = Math.floor((now - new Date(call.start_time)) / 1000);
        updateData.duration = duration;
      }
    }

    // Build update query
    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    updateValues.push(callId);

    await pool.execute(
      `UPDATE calls SET ${updateFields} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Call status updated successfully' });
  } catch (error) {
    console.error('Update call status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active calls for the user
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const [activeCalls] = await pool.execute(`
      SELECT 
        c.*,
        caller.username as caller_username,
        caller.full_name as caller_name,
        caller.avatar_url as caller_avatar,
        receiver.username as receiver_username,
        receiver.full_name as receiver_name,
        receiver.avatar_url as receiver_avatar
      FROM calls c
      JOIN users caller ON c.caller_id = caller.id
      JOIN users receiver ON c.receiver_id = receiver.id
      WHERE (c.caller_id = ? OR c.receiver_id = ?)
        AND c.status IN ('initiated', 'ringing', 'answered')
      ORDER BY c.start_time DESC
    `, [req.user.id, req.user.id]);

    res.json(activeCalls);
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get call statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered_calls,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_calls,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_calls,
        SUM(CASE WHEN status = 'answered' THEN duration ELSE 0 END) as total_duration,
        COUNT(CASE WHEN caller_id = ? THEN 1 END) as outgoing_calls,
        COUNT(CASE WHEN receiver_id = ? THEN 1 END) as incoming_calls
      FROM calls 
      WHERE caller_id = ? OR receiver_id = ?
    `, [req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;