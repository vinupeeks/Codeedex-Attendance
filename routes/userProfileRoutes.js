const express = require('express');
const { protect, employee } = require('../middleware/authMiddleware.js');
const { editProfile, userDetails } = require('../controllers/userProfileController.js');

const router = express.Router();

router.get('/', protect, employee, userDetails);

router.put('/edit', protect, employee, editProfile);

module.exports = router; 