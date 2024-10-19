const Leave = require('../models/Leave');

// Admin fetches all leave requests
exports.getAllLeaveRequests = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('userId', 'username employeeCode')
            .select(`-createdAt -updatedAt -userId`);;
        res.status(200).json({
            success: true,
            count: leaves.length,
            leaves
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching all leave requests',
            error: error.message
        });
    }
};

// Admin fetches pending leave requests
exports.getPendingLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'Pending' })
            .populate('userId', 'username employeeCode')
            .select(`-createdAt -updatedAt -userId`);;
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

exports.getLeaveById = async (req, res) => {
    try {
        const leaveId = req.params.id;

        const leave = await Leave.findById(leaveId)
            .populate('userId', 'username employeeCode')
            .select(`-createdAt -updatedAt`);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        res.status(200).json({
            success: true,
            leave
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leave request details',
            error: error.message
        });
    }
};

// Admin fetches approved leave requests
exports.getApprovedLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'Approved' })
            .populate('userId', 'username employeeCode')
            .select(`-createdAt -updatedAt -userId`);;
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

// Admin fetches rejected leave requests
exports.getRejectedLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'Rejected' })
            .populate('userId', 'username employeeCode')
            .select(`-createdAt -updatedAt -userId`);;
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

// Admin approves a leave request
exports.approveLeave = async (req, res) => {
    try {
        const leaveId = req.params.leaveId;
        const { adminReason } = req.body;

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            { status: 'Approved', adminReason },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Leave request approved successfully!',
            leave
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving leave request',
            error: error.message
        });
    }
};

// Admin rejects a leave request
exports.rejectLeave = async (req, res) => {
    try {
        const leaveId = req.params.leaveId;
        const { adminReason } = req.body;

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            { status: 'Rejected', adminReason },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Leave request rejected successfully!',
            leave
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting leave request',
            error: error.message
        });
    }
};
