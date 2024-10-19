const Leave = require('../models/Leave');

// User submits a leave request
exports.submitLeave = async (req, res) => {
    try {
        const { leaveType, fromDate, toDate, duration, session, reason, handoverEmployee } = req.body;

        const newLeaveRequest = new Leave({
            userId: req.user._id,
            leaveType,
            fromDate,
            toDate,
            duration,
            session,
            reason,
            handoverEmployee: {
                employeeCode: handoverEmployee.employeeCode,
                employeeName: handoverEmployee.employeeName,
                phoneNumber: handoverEmployee.phoneNumber
            },
            status: 'Pending'
        });

        await newLeaveRequest.save();

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully!',
            leaveRequest: newLeaveRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting leave request',
            error: error.message
        });
    }
};

// Get all leave requests for the logged-in user (all statuses)
exports.getUserLeaveRequests = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user._id })
            .select(`-createdAt -updatedAt -userId`);

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No leave requests found..!'
            });
        }
        res.status(200).json({
            success: true,
            count: leaves.length,
            leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leave requests',
            error: error.message
        });
    }
};

// Get pending leave requests for the logged-in user
exports.getUserPendingLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user._id, status: 'Pending' })
            .select(`-createdAt -updatedAt -userId`);

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pendeing requests found..!'
            });
        }

        res.status(200).json({
            success: true,
            count: leaves.length,
            leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending leave requests',
            error: error.message
        });
    }
};

// Get approved leave requests for the logged-in user
exports.getUserApprovedLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user._id, status: 'Approved' })
            .select(`-createdAt -updatedAt -userId`);;

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No approved requests found..!'
            });
        }

        res.status(200).json({
            success: true,
            count: leaves.length,
            leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching approved leave requests',
            error: error.message
        });
    }
};

// Get rejected leave requests for the logged-in user
exports.getUserRejectedLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user._id, status: 'Rejected' })
            .select(`-createdAt -updatedAt -userId`);;

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No rejected requests found..!'
            });
        }

        res.status(200).json({
            success: true,
            count: leaves.length,
            leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching rejected leave requests',
            error: error.message
        });
    }
};
