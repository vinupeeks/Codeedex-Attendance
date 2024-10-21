const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveAdminController.js');
const { protect } = require('../middleware/authMiddleware');

router.get('/all-leaves', protect, LeaveController.getAllLeaveRequests);

router.get('/pending', protect, LeaveController.getPendingLeaves);

router.get('/approved-leaves', LeaveController.getApprovedLeaves);

router.get('/rejected-leaves', protect, LeaveController.getRejectedLeaves);

router.get('/:id', protect, LeaveController.getLeaveById);

router.put('/approve-leave/:leaveId', protect, LeaveController.approveLeave);

router.put('/reject-leave/:leaveId', protect, LeaveController.rejectLeave);

module.exports = router;
