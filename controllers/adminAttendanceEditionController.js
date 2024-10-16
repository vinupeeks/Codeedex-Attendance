const Attendance = require("../models/attendance");
const AttendanceEditRequest = require("../models/AttendanceEditRequest");
const Employee = require("../models/Employee");

const updateAttendanceByDate = async (req, res) => {
    const { userId, date, punchIn, punchOut, breakTime } = req.body;

    if (!userId || !date || !punchIn || !punchOut || !breakTime) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const attendance = await Attendance.findOne({ userId, date });

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found for the given user and date' });
        }

        attendance.punchIn = punchIn;
        attendance.punchOut = punchOut;
        attendance.breakTimes = breakTime;

        const totalBreakTime = breakTime.reduce((total, breakObj) => total + breakObj.time, 0);
        attendance.totalBreakTime = totalBreakTime;

        if (punchOut !== "Still Working") {
            const punchInTime = new Date(punchIn);
            const punchOutTime = new Date(punchOut);
            const totalWorkTime = (punchOutTime - punchInTime) / (1000 * 60);
            attendance.totalWorkTime = totalWorkTime - totalBreakTime;
        }

        attendance.status = attendance.totalWorkTime < 240 ? "Halfday" : "Present";

        const updatedAttendance = await attendance.save();

        res.json(updatedAttendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const handleAttendanceRequest = async (req, res) => {
    const { requestId, action, adminId, reason } = req.body; // action = 'approve' or 'reject'

    try {
        const editRequest = await AttendanceEditRequest.findById(requestId);

        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        // Approve the request
        if (action === 'approve') {
            const attendance = await Attendance.findOne({ userId: editRequest.userId, date: editRequest.date });

            if (!attendance) {
                return res.status(404).json({ message: 'Attendance record not found' });
            }

            // Update the attendance record with new data
            attendance.punchIn = editRequest.punchIn;
            attendance.punchOut = editRequest.punchOut;
            attendance.breakTime = editRequest.breakTime;
            const totalBreakTime = editRequest.breakTime.reduce((total, breakObj) => total + breakObj.time, 0);
            attendance.totalBreakTime = totalBreakTime;
            const totalWorkTime = (new Date(editRequest.punchOut) - new Date(editRequest.punchIn)) / (1000 * 60); // minutes
            attendance.totalWorkTime = totalWorkTime - totalBreakTime;
            attendance.status = totalWorkTime < 240 ? 'Halfday' : 'Present';

            await attendance.save();

            // Update the request status to approved
            editRequest.status = 'approved';
            editRequest.adminAction = { reviewedBy: adminId, reviewedAt: new Date() };
            await editRequest.save();

            return res.json({ message: 'Attendance request approved', attendance });
        }

        // Reject the request
        if (action === 'reject') {
            editRequest.status = 'rejected';
            editRequest.adminAction = { reviewedBy: adminId, reviewedAt: new Date(), reason };
            await editRequest.save();

            return res.json({ message: 'Attendance request rejected', reason });
        }

        return res.status(400).json({ message: 'Invalid action' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAttendanceRequestList = async (req, res) => {

    try {
        const pendingRequests = await AttendanceEditRequest.find({ status: 'pending' })
            .populate('userId', 'username employeeCode')
            .select('userId date')
            .sort({ date: -1 });

        if (!pendingRequests || pendingRequests.length === 0) {
            return res.status(404).json({ message: 'No pending attendance requests found' });
        }

        const requestSummaries = pendingRequests.map(request => ({
            username: request.userId.username,
            EmplyCode: request.userId.employeeCode,
            date: request.date
        }));

        res.status(200).json(requestSummaries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAttendanceEditRequestByDetails = async (req, res) => {
    const { username, EmplyCode, date } = req.body;

    try {
        const user = await Employee.findOne({ employeeCode: EmplyCode });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pendingRequests = await AttendanceEditRequest.findOne({
            userId: user._id,
            date: new Date(date),
            status: 'pending'
        })
            .populate('userId', 'username email')
            .sort({ date: -1 });

        if (!pendingRequests || pendingRequests.length === 0) {
            return res.status(404).json({ message: 'No pending attendance requests found' });
        }

        res.status(200).json(pendingRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { updateAttendanceByDate, handleAttendanceRequest, getAttendanceEditRequestByDetails, getAttendanceRequestList };
