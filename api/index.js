require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'success', message: 'Jira Reporting Tool API is running' });
});

// Auth Routes
app.use('/api/v1/auth', require('./routes/auth.route'));

// User Task Routes
app.use('/api/v1/tasks', require('./routes/task.route'));

// Admin Routes
app.use('/api/v1/admin/jira', require('./routes/jira.route'));
app.use('/api/v1/admin/users', require('./routes/admin-user.route'));
app.use('/api/v1/admin/sync-history', require('./routes/sync-history.route'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message });
});

// Start server and connect DB
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    
    // Tắt tự động cập nhật cấu trúc bảng để tránh lỗi ER_TOO_MANY_KEYS
    // await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();
