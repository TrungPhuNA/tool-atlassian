const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register); // Có thể thêm adminMiddleware sau này khi đã có user đầu tiên
router.get('/me', authMiddleware, authController.me);

module.exports = router;
