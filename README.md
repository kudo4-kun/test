# VoIP Web Application

A modern, real-time Voice over IP (VoIP) web application built with Node.js, React, MySQL, and WebRTC technology. Features crystal-clear voice calling, user authentication, contact management, and real-time communication.

## 🚀 Features

### Core Functionality
- **Real-time Voice Calls**: HD quality voice calls using WebRTC technology
- **User Authentication**: Secure JWT-based authentication system
- **Contact Management**: Add, search, and organize your contacts
- **Real-time Status**: See when your contacts are online/offline
- **Call History**: Track your call history and statistics
- **Modern UI**: Beautiful, responsive interface built with Material-UI

### Technical Features
- **WebRTC Signaling**: Peer-to-peer voice communication
- **Socket.IO Integration**: Real-time bidirectional communication
- **MySQL Database**: Robust data storage for users, contacts, and calls
- **JWT Security**: Secure token-based authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Audio Controls**: Mute/unmute, call controls during conversations

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Socket.IO** - Real-time communication
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Material-UI** - Component library
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **WebRTC** - Peer-to-peer communication

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MySQL** (v8 or higher)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd voip-web-app
```

### 2. Install Dependencies
```bash
# Install root dependencies (for concurrent running)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Database Setup

#### Create MySQL Database
```sql
-- Connect to MySQL and create database
CREATE DATABASE voip_app;
USE voip_app;
```

#### Configure Database Connection
Edit `backend/.env` file with your MySQL credentials:
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=voip_app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 4. Start the Application

#### Option 1: Start Both Servers Concurrently (Recommended)
```bash
npm run dev
```

#### Option 2: Start Servers Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📱 Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Add Contacts**: Search for users and add them to your contact list
4. **Start Calling**: Click the phone icon next to any online contact to start a call

### Making Calls
1. Click the phone icon next to an online contact
2. Wait for the connection to establish
3. Use the mute button to toggle your microphone
4. Click the red phone button to end the call

### Receiving Calls
1. When someone calls you, you'll see an incoming call dialog
2. Click the green phone button to answer
3. Click the red phone button to decline
4. The call will connect automatically once answered

### Managing Contacts
- **Add Contacts**: Use the search feature to find users by username, email, or name
- **Contact Status**: See real-time online/offline status of your contacts
- **Contact List**: All your contacts are displayed with their current status

## 🏗️ Project Structure

```
voip-web-app/
├── backend/                 # Backend Node.js application
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication middleware
│   ├── routes/            # API routes (auth, contacts, calls)
│   ├── socket/            # WebRTC signaling server
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── frontend/               # Frontend React application
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   │   ├── Auth/      # Authentication components
│   │   │   ├── Call/      # Call-related components
│   │   │   └── Dashboard/ # Main dashboard components
│   │   ├── context/       # React contexts (Auth, Socket)
│   │   ├── hooks/         # Custom React hooks (WebRTC)
│   │   ├── config/        # Configuration files
│   │   └── App.js         # Main App component
│   ├── .env               # Frontend environment variables
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json for scripts
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `PUT /api/auth/status` - Update user status (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### Contacts
- `GET /api/contacts` - Get user's contacts (requires auth)
- `GET /api/contacts/search` - Search for users (requires auth)
- `POST /api/contacts` - Add a contact (requires auth)
- `PUT /api/contacts/:id` - Update contact (requires auth)
- `DELETE /api/contacts/:id` - Remove contact (requires auth)

### Calls
- `GET /api/calls/history` - Get call history (requires auth)
- `GET /api/calls/active` - Get active calls (requires auth)
- `GET /api/calls/stats` - Get call statistics (requires auth)
- `POST /api/calls` - Create call record (requires auth)
- `PUT /api/calls/:id/status` - Update call status (requires auth)

## 🔌 WebRTC & Socket.IO Events

### Socket Events
- `call:initiate` - Initiate a call
- `call:incoming` - Incoming call notification
- `call:answer` - Answer a call
- `call:reject` - Reject a call
- `call:end` - End a call
- `call:error` - Call error occurred

### WebRTC Signaling Events
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate exchange

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side input validation
- **CORS Protection**: Configured CORS for frontend-backend communication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet**: Security headers for Express.js

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Make sure MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Check database credentials in backend/.env
# Ensure the database 'voip_app' exists
```

#### WebRTC Connection Issues
```bash
# Check browser console for WebRTC errors
# Ensure microphone permissions are granted
# Check if STUN servers are accessible
```

#### Socket.IO Connection Issues
```bash
# Check if backend server is running on port 5000
# Verify CORS configuration
# Check browser network tab for WebSocket connections
```

#### Port Conflicts
```bash
# If ports 3000 or 5000 are in use, you can change them:
# Backend: Change PORT in backend/.env
# Frontend: Use PORT=3001 npm start
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**:
```bash
# Backend production environment
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_very_secure_jwt_secret
```

2. **Build Frontend**:
```bash
cd frontend
npm run build
```

3. **Deploy Backend**:
- Use PM2 for process management
- Configure reverse proxy (nginx)
- Set up SSL certificates for HTTPS
- Configure firewall rules

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **WebRTC** for peer-to-peer communication technology
- **Socket.IO** for real-time bidirectional communication
- **Material-UI** for the beautiful React components
- **MySQL** for robust data storage
- **Express.js** for the fast web application framework

## 📞 Support

If you have any questions or need help with setup, please:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about your problem

---

**Happy Calling! 📞✨**