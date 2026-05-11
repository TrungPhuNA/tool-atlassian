require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const authRoutes = require('./routes/auth.route');
const jiraRoutes = require('./routes/jira.route');
const taskRoutes = require('./routes/task.route');
const syncRoutes = require('./routes/sync-history.route'); // Đã sửa
const userRoutes = require('./routes/admin-user.route'); // Đã sửa

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jira', jiraRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/users', userRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

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
    process.exit(1);
  }
};

startServer();
