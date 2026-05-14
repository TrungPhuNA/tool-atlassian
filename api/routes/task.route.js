const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const exportController = require('../controllers/export.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// User & Admin đều có thể xem task
router.get('/filters/options', authMiddleware, syncController.getFilterOptions);
router.get('/', authMiddleware, syncController.getIssues);
router.get('/:id', authMiddleware, syncController.getIssueDetail);

// Notify
router.post('/:id/notify', authMiddleware, syncController.sendTaskNotification);

// Export
router.post('/export/google-sheet', authMiddleware, exportController.exportToGoogleSheet);

module.exports = router;
