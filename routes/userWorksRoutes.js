// routes/userWorksRoutes.js
const express = require('express');
const router = express.Router();
const userWorksController = require('../controllers/userWorksController.js');
const { protect } = require('../middleware/authMiddleware.js');

// User routes (get assigned works, update status)
router.get('/', protect, userWorksController.getAssignedWorks);
router.get('/work/:workId', protect, userWorksController.getWorkDetailsById);
router.put('/update-status', protect, userWorksController.updateWorkStatus);

module.exports = router;
