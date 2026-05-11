const express = require('express');
const router = express.Router();
const { SyncJob } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const jobs = await SyncJob.findAll({
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json({ status: 'success', data: jobs });
  } catch (err) { next(err); }
});

module.exports = router;
