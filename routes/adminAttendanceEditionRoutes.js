const express = require('express');
const { updateAttendanceByDate, getAttendanceEditRequestByDetails, getAttendanceRequestList, getProceedAttendanceList, getRejectedAttendanceList, getTodayAttendance, getAttendanceByUserId, getAttendanceByAttendanceId, getAttendanceForCurrentMonth } = require('../controllers/adminAttendanceEditionController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Route to update attendance based on date (admin access only)
router.put('/update', protect, admin, updateAttendanceByDate);

router.get('/requests/list', protect, admin, getAttendanceRequestList);

router.post('/request/details', protect, admin, getAttendanceEditRequestByDetails);

router.get('/proceed-list', protect, admin, getProceedAttendanceList);

router.get('/rejected-list', protect, admin, getRejectedAttendanceList);


router.get('/list-today', protect, admin, getTodayAttendance);
router.get('/user/:id', protect, admin, getAttendanceByUserId);
router.get('/details/:id', protect, admin, getAttendanceByAttendanceId);


router.get('/month', protect, admin, getAttendanceForCurrentMonth);

module.exports = router;
