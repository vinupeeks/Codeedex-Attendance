const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveAdminController.js');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all-leaves', protect, admin, LeaveController.getAllLeaveRequests);

router.get('/pending', protect, admin, LeaveController.getPendingLeaves);

router.get('/approved-leaves', protect, admin, LeaveController.getApprovedLeaves);

router.get('/rejected-leaves', protect, admin, LeaveController.getRejectedLeaves);

router.get('/:id', protect, admin, LeaveController.getLeaveById);

router.put('/approve-leave/:leaveId', protect, admin, LeaveController.approveLeave);

router.put('/reject-leave/:leaveId', protect, admin, LeaveController.rejectLeave);

module.exports = router;
