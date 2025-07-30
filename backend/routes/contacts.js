const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all contacts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.execute(`
      SELECT 
        c.id,
        c.nickname,
        c.created_at,
        u.id as contact_id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        u.status
      FROM contacts c
      JOIN users u ON c.contact_user_id = u.id
      WHERE c.user_id = ?
      ORDER BY u.full_name
    `, [req.user.id]);

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search for users to add as contacts
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q}%`;
    
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        u.status,
        CASE WHEN c.id IS NOT NULL THEN true ELSE false END as is_contact
      FROM users u
      LEFT JOIN contacts c ON c.contact_user_id = u.id AND c.user_id = ?
      WHERE u.id != ? 
        AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)
      ORDER BY u.full_name
      LIMIT 20
    `, [req.user.id, req.user.id, searchTerm, searchTerm, searchTerm]);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contactUserId, nickname } = req.body;

    if (!contactUserId) {
      return res.status(400).json({ error: 'Contact user ID is required' });
    }

    if (contactUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a contact' });
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, username, full_name FROM users WHERE id = ?',
      [contactUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if contact already exists
    const [existingContacts] = await pool.execute(
      'SELECT id FROM contacts WHERE user_id = ? AND contact_user_id = ?',
      [req.user.id, contactUserId]
    );

    if (existingContacts.length > 0) {
      return res.status(400).json({ error: 'Contact already exists' });
    }

    // Add contact
    const [result] = await pool.execute(
      'INSERT INTO contacts (user_id, contact_user_id, nickname) VALUES (?, ?, ?)',
      [req.user.id, contactUserId, nickname || null]
    );

    // Get the added contact details
    const [contactDetails] = await pool.execute(`
      SELECT 
        c.id,
        c.nickname,
        c.created_at,
        u.id as contact_id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url,
        u.status
      FROM contacts c
      JOIN users u ON c.contact_user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Contact added successfully',
      contact: contactDetails[0]
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contact nickname
router.put('/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { nickname } = req.body;

    // Check if contact exists and belongs to user
    const [contacts] = await pool.execute(
      'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, req.user.id]
    );

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update nickname
    await pool.execute(
      'UPDATE contacts SET nickname = ? WHERE id = ?',
      [nickname || null, contactId]
    );

    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a contact
router.delete('/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;

    // Check if contact exists and belongs to user
    const [contacts] = await pool.execute(
      'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
      [contactId, req.user.id]
    );

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Remove contact
    await pool.execute(
      'DELETE FROM contacts WHERE id = ?',
      [contactId]
    );

    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;