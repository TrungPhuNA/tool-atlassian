const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// User & Admin đều có thể xem task
router.get('/filters/options', authMiddleware, syncController.getFilterOptions);
router.get('/', authMiddleware, syncController.getIssues);
router.get('/:id', authMiddleware, syncController.getIssueDetail);

module.exports = router;
