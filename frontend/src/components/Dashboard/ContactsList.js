import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { useSocket } from '../../context/SocketContext';

const ContactsList = ({ onInitiateCall }) => {
  const { contactStatuses, initiateCall } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CONTACTS);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(API_ENDPOINTS.SEARCH_USERS, {
        params: { q: query }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addContact = async (userId, nickname = '') => {
    try {
      const response = await axios.post(API_ENDPOINTS.CONTACTS, {
        contactUserId: userId,
        nickname
      });
      
      // Add to contacts list
      setContacts(prev => [...prev, response.data.contact]);
      setShowAddDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact');
    }
  };

  const handleCall = (contact) => {
    // Initiate call through socket
    const success = initiateCall(contact.contact_id, 'voice');
    if (success) {
      // Call onInitiateCall with call data for UI
      onInitiateCall({
        callId: Date.now(), // Temporary ID, will be replaced by server
        contact: {
          id: contact.contact_id,
          username: contact.username,
          fullName: contact.full_name,
          avatarUrl: contact.avatar_url
        },
        isOutgoing: true,
        callType: 'voice'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'away': return 'warning';
      case 'busy': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (userId) => {
    const status = contactStatuses.get(userId) || 'offline';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search bar */}
      <TextField
        fullWidth
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowAddDialog(true)}>
                <PersonAddIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Contacts list */}
      <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
        <List>
          {filteredContacts.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No contacts found"
                secondary={contacts.length === 0 ? "Add some contacts to get started" : "No contacts match your search"}
              />
            </ListItem>
          ) : (
            filteredContacts.map((contact) => (
              <ListItem
                key={contact.id}
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <IconButton
                      edge="end"
                      onClick={() => handleCall(contact)}
                      color="primary"
                    >
                      <PhoneIcon />
                    </IconButton>
                    <IconButton edge="end">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar src={contact.avatar_url}>
                    {contact.full_name?.charAt(0) || contact.username?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1">
                        {contact.nickname || contact.full_name || contact.username}
                      </Typography>
                      <Chip
                        label={getStatusText(contact.contact_id)}
                        size="small"
                        color={getStatusColor(contactStatuses.get(contact.contact_id))}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={`@${contact.username}`}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Add contact dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Contact</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search users by username, email, or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mt: 2, mb: 2 }}
          />

          {searchLoading && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <Button
                    variant={user.is_contact ? "outlined" : "contained"}
                    disabled={user.is_contact}
                    onClick={() => addContact(user.id)}
                    size="small"
                  >
                    {user.is_contact ? 'Added' : 'Add'}
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar_url}>
                    {user.full_name?.charAt(0) || user.username?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.full_name || user.username}
                  secondary={`@${user.username} • ${user.email}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactsList;