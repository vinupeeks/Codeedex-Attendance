const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveUserController.js');
const { protect, employee } = require('../middleware/authMiddleware');


router.get('/', protect, employee, LeaveController.getUserLeaveRequests);

router.post('/submit-leave', protect, employee, LeaveController.submitLeave);

router.get('/pending-leaves', protect, employee, LeaveController.getUserPendingLeaves);

router.get('/approved-leaves', protect, employee, LeaveController.getUserApprovedLeaves);

router.get('/rejected-leaves', protect, employee, LeaveController.getUserRejectedLeaves);

module.exports = router;
