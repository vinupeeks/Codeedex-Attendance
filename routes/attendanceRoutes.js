const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.post('/punch-in', protect, attendanceController.punchIn);

router.post('/punch-out', protect, attendanceController.punchOut);

router.post('/start-break', protect, attendanceController.startBreak);

router.post('/end-break', protect, attendanceController.endBreak);

router.get('/today', protect, attendanceController.getAttendance);

module.exports = router;
