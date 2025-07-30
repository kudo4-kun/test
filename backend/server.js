const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const setupSignaling = require('./socket/signaling');

// Import routes
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const callsRoutes = require('./routes/calls');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow for development
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/calls', callsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Setup WebRTC signaling
setupSignaling(io);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Initializing database schema...');
    await initializeDatabase();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`
🚀 VoIP Server is running!
   
📍 Server: http://localhost:${PORT}
🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
🗄️  Database: ${process.env.DB_NAME || 'voip_app'}
🌍 Environment: ${process.env.NODE_ENV || 'development'}

📡 Socket.IO server is ready for WebRTC signaling
🔐 JWT authentication is enabled
📞 Ready to handle voice calls!
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the server
startServer();