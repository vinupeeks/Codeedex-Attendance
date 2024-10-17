const Attendance = require("../models/attendance");
const AttendanceEditRequest = require("../models/AttendanceEditRequest");
const Employee = require("../models/Employee");
const cron = require('node-cron');
const moment = require('moment');

cron.schedule('30 17 * * *', async () => {
    try {

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const absentEmployees = await Employee.find({
            _id: {
                $nin: await Attendance.find({ date: today }).distinct('userId')
            }
        });

        const bulkOperations = absentEmployees.map((employee) => ({
            updateOne: {
                filter: { userId: employee._id, date: today },
                update: {
                    $set: { status: 'Absent', punchIn: null, punchOut: null, totalWorkTime: 0 }
                },
                upsert: true,
            }
        }));

        if (bulkOperations.length > 0) {
            await Attendance.bulkWrite(bulkOperations);
            console.log(`${absentEmployees.length} employees marked as absent.`);
        } else {
            console.log('No absent employees found.');
        }
    } catch (error) {
        console.error('Error marking employees as absent:', error);
    }
});

const updateAttendanceByDate = async (req, res) => {
    const { userId, date, punchIn, punchOut, breakTime, requestId, action, adminId, reason } = req.body;

    if (!userId || !date || !punchIn || !punchOut || !breakTime) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {

        const editRequest = await AttendanceEditRequest.findById(requestId);
        if (!editRequest) {
            return res.status(404).json({ message: 'Edit request not found' });
        }

        if (action === 'approve') {
            // Find the attendance record for the user and date
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
                const totalWorkTime = (punchOutTime - punchInTime) / (1000 * 60); // Calculate in minutes
                attendance.totalWorkTime = totalWorkTime - totalBreakTime;
                // attendance.status = attendance.totalWorkTime < 240 ? 'Halfday' : 'Present';
            }
            attendance.status = attendance.totalWorkTime < 240 ? "Halfday" : "Fullday";
            editRequest.status = 'approved';

            editRequest.adminAction = { reviewedBy: adminId, reviewedAt: new Date(), reason: reason };
            await attendance.save();
            await editRequest.save();

            return res.json({
                message: 'Attendance request approved',
                attendance: attendance,
                request: editRequest,
            });
        }
        if (action === 'reject') {
            // Update the request with rejection reason and status
            editRequest.status = 'rejected';
            editRequest.adminAction = { reviewedBy: adminId, reviewedAt: new Date(), reason };
            await editRequest.save();

            return res.json({ message: 'Attendance request rejected', request: editRequest });
        }

        return res.status(400).json({ message: 'Invalid action' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

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


const getProceedAttendanceList = async (req, res) => {

    try {
        const ProceedAttendanceList = await AttendanceEditRequest.find({ status: 'approved' })
            .populate({
                path: 'adminAction.reviewedBy',
                select: 'username email',
            })
            .select(' status adminAction date totalWorkTime totalBreakTime')
            .select('-createdAt -updatedAt');

        if (!ProceedAttendanceList || ProceedAttendanceList.length === 0) {
            return res.status(404).json({ message: 'No proceed Attendance found' });
        }

        res.status(200).json(ProceedAttendanceList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching proceed attendance List time', error: error.message });
    }
};

const getRejectedAttendanceList = async (req, res) => {

    try {
        const ProceedAttendanceList = await AttendanceEditRequest.find({ status: 'rejected' })
            .populate({
                path: 'adminAction.reviewedBy',
                select: 'username email',
            })
            .select(' status adminAction date totalWorkTime totalBreakTime')
            .select('-createdAt -updatedAt');

        if (!ProceedAttendanceList || ProceedAttendanceList.length === 0) {
            return res.status(404).json({ message: 'No proceed Attendance found' });
        }

        res.status(200).json(ProceedAttendanceList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching proceed attendance List time', error: error.message });
    }
};

const getTodayAttendance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceList = await Attendance.find({
            date: today.toISOString()
        }).populate('userId', 'name')
            .select(`date punchIn punchOut status`)
            .select(`-createdAt -updatedAt`)

        res.status(200).json({
            success: true,
            count: attendanceList.length,
            data: attendanceList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching today\'s attendance',
            error: error.message
        });
    }
};

const getAttendanceByUserId = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const attendanceRecords = await Attendance.find({ userId: employeeId })
            .populate('userId', 'name email role');

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No attendance records found for this employee.'
            });
        }

        res.status(200).json({
            success: true,
            count: attendanceRecords.length,
            data: attendanceRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance for the employee',
            error: error.message
        });
    }
};

const getAttendanceByAttendanceId = async (req, res) => {
    try {
        const attendanceId = req.params.id;
        const attendanceRecords = await Attendance.find({ _id: attendanceId })
            .populate('userId', 'name email role');

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No attendance records found for this employee.'
            });
        }

        res.status(200).json({
            success: true,
            count: attendanceRecords.length,
            data: attendanceRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance for the employee',
            error: error.message
        });
    }
};
module.exports = {
    updateAttendanceByDate,
    getAttendanceEditRequestByDetails,
    getAttendanceRequestList,
    getProceedAttendanceList,
    getRejectedAttendanceList,
    getTodayAttendance,
    getAttendanceByUserId,
    getAttendanceByAttendanceId
};
