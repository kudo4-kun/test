const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'voip_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database schema
const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password'
    });

    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'voip_app'}`);
    tempPool.end();

    // Create tables
    await createTables();
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

// Create database tables
const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      avatar_url VARCHAR(255),
      status ENUM('online', 'offline', 'busy', 'away') DEFAULT 'offline',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createContactsTable = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      contact_user_id INT NOT NULL,
      nickname VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_contact (user_id, contact_user_id)
    )
  `;

  const createCallsTable = `
    CREATE TABLE IF NOT EXISTS calls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      caller_id INT NOT NULL,
      receiver_id INT NOT NULL,
      call_type ENUM('voice', 'video') DEFAULT 'voice',
      status ENUM('initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected') DEFAULT 'initiated',
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      duration INT DEFAULT 0,
      FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      socket_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  await pool.execute(createUsersTable);
  await pool.execute(createContactsTable);
  await pool.execute(createCallsTable);
  await pool.execute(createSessionsTable);
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};