const express = require('express');
const { updateAttendanceByDate, getAttendanceEditRequestByDetails, getAttendanceRequestList } = require('../controllers/adminAttendanceEditionController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Route to update attendance based on date (admin access only)
router.put('/update', protect, admin, updateAttendanceByDate);

router.get('/requests/list', protect, admin, getAttendanceRequestList);

router.post('/request/details', protect, admin, getAttendanceEditRequestByDetails);

module.exports = router;
