const Attendance = require("../models/attendance");
const AttendanceEditRequest = require("../models/AttendanceEditRequest");
const Employee = require("../models/Employee");
const cron = require('node-cron');
const moment = require('moment');
const tz = require('tz');

const convertToIST = (date) => {
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
};

cron.schedule('31 17 * * *', async () => {
    try {
        const today = convertToIST(new Date());
        today.setHours(0, 0, 0, 0);

        const punchedInEmployeeIds = await Attendance.find({
            date: { $gte: today, $lte: new Date() },
            punchIn: { $ne: null }
        }).distinct('userId');

        const absentEmployees = await Employee.find({
            _id: { $nin: punchedInEmployeeIds }
        });

        console.log('Absent employees:', absentEmployees);

        // Step 3: Bulk update absent employees' attendance status
        const bulkOperations = absentEmployees.map((employee) => ({
            updateOne: {
                filter: { userId: employee._id, date: today },
                update: {
                    $set: { status: 'Absent', punchIn: null, punchOut: null, totalWorkTime: 0 }
                },
                upsert: true // Insert if no document exists for the day
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
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
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
        const today = convertToIST(new Date()).toISOString().slice(0, 10);
        const todayStart = new Date(today + "T00:00:00.000Z");
        const todayEnd = new Date(today + "T23:59:59.999Z");
        // today.setHours(0, 0, 0, 0);

        const attendanceList = await Attendance.find({
            date: { $gte: todayStart, $lte: todayEnd }
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
            .populate('userId', 'name email role')
            .select(`-createdAt -updatedAt`);

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
const getAttendanceForCurrentMonth = async (req, res) => {
    try {
        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();

        const attendanceRecords = await Attendance.find({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        })
            .populate({
                path: 'userId',
                select: 'employeeCode email username', // Populate only the code and email fields
            })
            .select(`date totalWorkTime totalBreakTime status _id`)
            .sort({ date: -1 });

        const formattedAttendance = attendanceRecords.map(record => {
            if (record.userId) {
                return {
                    user: {
                        Name: record.userId.username,
                        EmpCode: record.userId.employeeCode,
                        email: record.userId.email,
                    },
                    date: record.date,
                    totalWorkTime: record.totalWorkTime,
                    totalBreakTime: record.totalBreakTime,
                    status: record.status,
                    Work_iD: record._id
                };
            } else {
                return {
                    user: {
                        Name: null,
                        EmpCode: null,
                        email: null,
                    },
                    date: record.date,
                    totalWorkTime: record.totalWorkTime,
                    totalBreakTime: record.totalBreakTime,
                    status: record.status
                };
            }
        });

        res.status(200).json({
            success: 'Attendance List fetched Succeced',
            count: attendanceRecords.length,
            data: formattedAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance for the current month',
            error: error.message
        });
    }
};

const filterAttendance = async (req, res) => {
    const { employeeCode, workMode, month, Date, year } = req.body;

    try {
        let startDate, endDate;
        // console.log(`employeeName: ${employeeName}, workMode: ${workMode}, month: ${month}, Date: ${Date}`);

        // Handle specific date filtering (convert to UTC)
        if (Date) {
            startDate = moment.utc(Date).startOf('day').toDate();
            endDate = moment.utc(Date).endOf('day').toDate();
        } else {
            // Default to last month's data if no date is provided (convert to UTC)
            const lastMonth = moment.utc().subtract(1, 'month');
            startDate = lastMonth.startOf('month').toDate();
            endDate = lastMonth.endOf('month').toDate();
        }

        // If the user provides a month filter, adjust the date range accordingly
        if (month) {
            // const year = moment().year(); // Use the current year
            const monthIndex = parseInt(month) - 1; // Convert month to zero-based index
            startDate = moment.utc().year(year).month(monthIndex).startOf('month').toDate();
            endDate = moment.utc().year(year).month(monthIndex).endOf('month').toDate();
        }


        if (year && !month) {
            startDate = moment.utc().year(year).startOf('year').toDate();
            endDate = moment.utc().year(year).endOf('year').toDate();
        }

        // Initialize the attendance query with the date range
        const attendanceQuery = {
            date: { $gte: startDate, $lte: endDate },
        };

        // Build the employee query based on the filters
        const employeeQuery = {};

        // Handle employee name filtering (case-insensitive)
        if (employeeCode) {
            employeeQuery.employeeCode = employeeCode; // Filter by employeeCode
        }

        // Handle workMode filtering
        if (workMode) {
            employeeQuery.workMode = workMode;
        }

        // console.log(employeeQuery);

        // Fetch filtered employees based on the query
        const filteredEmployees = await Employee.find(employeeQuery).select('_id');

        // console.log(filteredEmployees);
        // If employees are found, apply their IDs to the attendance query
        if (filteredEmployees.length > 0) {
            attendanceQuery.userId = { $in: filteredEmployees.map(emp => emp._id) };
        }

        console.log(`yes`, attendanceQuery);
        const attendanceRecords = await Attendance.find(attendanceQuery)
            .populate({
                path: 'userId',
                select: 'name email workMode employeeCode',
            })
            .select('date totalWorkTime totalBreakTime status _id')
            .select(`-createdAt -updatedAt`)
            .sort({ date: -1 });

        const formattedAttendance = attendanceRecords.map(record => ({
            user: {
                name: record.userId.name,
                email: record.userId.email,
                EmployeeCode: record.userId.employeeCode,
                workMode: record.userId.workMode,
            },
            date: record.date,
            totalWorkTime: record.totalWorkTime,
            totalBreakTime: record.totalBreakTime,
            status: record.status,
            Work_iD: record._id
        }));

        // Send success response
        if (formattedAttendance.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No matched fields..!',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            count: formattedAttendance.length,
            data: formattedAttendance,
        });

    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance data, Not matched fields..!',
            error: error.message,
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
    getAttendanceByAttendanceId,
    getAttendanceForCurrentMonth,
    filterAttendance
};
