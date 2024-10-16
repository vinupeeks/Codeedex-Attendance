const express = require('express');
const userWorksController = require('../controllers/userWorksController.js');
const { protect, employee } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.get('/', protect, employee, userWorksController.getAssignedWorks);

router.get('/work/:workId', protect, employee, userWorksController.getWorkDetailsById);

router.put('/update-status', protect, employee, userWorksController.updateWorkStatus);

module.exports = router;
