const express = require('express');
const { updateAttendanceByDate, handleAttendanceRequest, getAttendanceEditRequestByDetails, getAttendanceRequestList } = require('../controllers/adminAttendanceEditionController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Route to update attendance based on date (admin access only)
router.put('/update', protect, admin, updateAttendanceByDate);

router.post('/request', handleAttendanceRequest);

router.get('/requests/list', getAttendanceRequestList);

router.post('/request/details', getAttendanceEditRequestByDetails);

module.exports = router;
