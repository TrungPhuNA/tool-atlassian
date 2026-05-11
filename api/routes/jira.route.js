const express = require('express');
const router = express.Router();
const jiraConfigController = require('../controllers/jira-config.controller');
const syncController = require('../controllers/sync.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

// Áp dụng bảo mật cho toàn bộ Route Admin Jira
router.use(authMiddleware);
router.use(adminMiddleware);

// Config Routes
router.get('/config', jiraConfigController.getConfig);
router.post('/config', jiraConfigController.saveConfig);
router.post('/test-connection', jiraConfigController.testConnection);

// Sync Jobs
router.post('/sync', syncController.triggerSync);
router.get('/sync-status', syncController.getJobStatus);
router.post('/debug-sync', syncController.debugSync);

module.exports = router;
