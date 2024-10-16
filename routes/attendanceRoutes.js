const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController.js');
const { protect, employee } = require('../middleware/authMiddleware.js');

router.post('/punch-in', protect, employee, attendanceController.punchIn);

router.post('/punch-out', protect, employee, attendanceController.punchOut);

router.post('/start-break', protect, employee, attendanceController.startBreak);

router.post('/end-break', protect, employee, attendanceController.endBreak);

router.get('/today', protect, employee, attendanceController.getAttendance);

router.get('/all', protect, employee, attendanceController.getAllAttendance);

router.post('/date', protect, employee, attendanceController.getAttendanceByDate);

router.post('/date-range', protect, employee, attendanceController.getAttendanceByDateRange);

router.post('/edit-request', protect, employee, attendanceController.submitAttendanceEditRequest);

router.get('/requests', protect, employee, attendanceController.getAttendanceRequestsByUser);

module.exports = router;
