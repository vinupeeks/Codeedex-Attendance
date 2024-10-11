const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const { editProfile, userDetails } = require('../controllers/userProfileController.js');


router.get('/', protect, userDetails);
router.put('/edit', protect, editProfile);

module.exports = router; 