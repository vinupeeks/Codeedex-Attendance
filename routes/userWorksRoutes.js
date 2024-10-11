// routes/userWorksRoutes.js
const express = require('express');
const router = express.Router();
const userWorksController = require('../controllers/userWorksController.js');
const { protect } = require('../middleware/authMiddleware.js');

// User routes (get assigned works, update status)
router.get('/assigned', protect, userWorksController.getAssignedWorks);
router.put('/update-status/:workId', protect, userWorksController.updateWorkStatus);

module.exports = router;
