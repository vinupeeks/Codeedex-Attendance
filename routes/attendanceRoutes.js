const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.post('/punch-in', protect, attendanceController.punchIn);

router.post('/punch-out', protect, attendanceController.punchOut);

router.post('/start-break', protect, attendanceController.startBreak);

router.post('/end-break', protect, attendanceController.endBreak);

router.get('/today', protect, attendanceController.getAttendance);

router.get('/all', protect, attendanceController.getAllAttendance);

router.post('/date', protect, attendanceController.getAttendanceByDate);

router.post('/date-range', protect, attendanceController.getAttendanceByDateRange);

router.post('/edit-request', protect, attendanceController.submitAttendanceEditRequest);

router.get('/requests', protect, attendanceController.getAttendanceRequestsByUser);

module.exports = router;
