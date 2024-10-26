const Attendance = require("../models/attendance");
const AttendanceEditRequest = require("../models/AttendanceEditRequest");
const Employee = require("../models/Employee");
const cron = require('node-cron');
const moment = require('moment');
const tz = require('tz');

const convertToIST = (date) => {
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
};

cron.schedule('25 17 * * *', async () => {
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

        // console.log('Absent employees:', absentEmployees);

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
            // console.log(`${absentEmployees.length} employees marked as absent.`);
        } else {
            // console.log('No absent employees found.');
        }

    } catch (error) {
        // console.error('Error marking employees as absent:', error);
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
            .populate('userId', 'username employeeCode _id')
            .sort({ date: -1 });

        if (!pendingRequests || pendingRequests.length === 0) {
            return res.status(404).json({ message: 'No pending attendance requests found' });
        }

        const requestSummaries = pendingRequests.map(request => ({
            username: request.userId ? request.userId.username : 'Unknown User',
            employeeCode: request.userId ? request.userId.employeeCode : '',
            date: request.date,
            ID: request._id
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
const getAttendanceEditRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await AttendanceEditRequest.findById(id)
            .populate({
                path: 'userId',
                select: 'username workMode employeeCode'
            })
            .populate({
                path: 'adminAction.reviewedBy', select: 'username adminCode email'
            })
            .select(`-createdAt -updatedAt `)
            .lean();

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Attendance Edit Request not found'
            });
        }

        res.status(200).json({
            success: true,
            request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance edit request',
            error: error.message
        });
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

        const allEmployees = await Employee.find().select('username employeeCode');

        const attendanceList = await Attendance.find({
            date: { $gte: todayStart, $lte: todayEnd }
        }).populate('userId', 'username employeeCode')
            .select(`date punchIn punchOut status _id`)
            .select(`-createdAt -updatedAt`);

        const attendanceMarked = [];
        const absentList = [];
        const notMarkedList = [];

        // Convert attendanceList to a map for easy lookup by employee ID
        const attendanceMap = new Map();
        attendanceList.forEach((att) => {
            attendanceMap.set(att.userId._id.toString(), {
                EMP_id: att.userId._id,
                employeeCode: att.userId.employeeCode,
                username: att.userId.username,
                status: att.status,
                WRK_id: att._id
            });
        });

        allEmployees.forEach((employee) => {
            const empIdStr = employee._id.toString();

            if (attendanceMap.has(empIdStr)) {
                const empAttendance = attendanceMap.get(empIdStr);
                // Check the attendance status and add to respective lists
                if (empAttendance.status === 'Present' || empAttendance.status === 'Halfday' || empAttendance.status === 'Fullday') {
                    attendanceMarked.push(empAttendance);
                } else if (empAttendance.status === 'Absent' || empAttendance.status === null || empAttendance.status === '') {
                    absentList.push(empAttendance);
                }
            } else {
                // If no attendance record for today, add to Not Marked list
                notMarkedList.push({
                    EMP_id: employee._id,
                    employeeCode: employee.employeeCode,
                    username: employee.username,
                    Status: 'Not Marked'
                });
            }
        });

        res.status(200).json({
            success: true,
            Employees_Count: allEmployees.length,
            AttendanceMarcked_count: attendanceMarked.length,
            attendanceMarked,
            AttendanceNotMarcked_Count: absentList.length,
            NotMarcked_List: absentList,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching today's attendance",
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
                message: 'No attendance records found of this Id.'
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
            message: 'Error fetching attendance details..!',
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
                select: 'employeeCode email username',
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
    const { employeeCode, workMode, month, Date, year, designation } = req.body; // Add designation here

    try {
        let startDate, endDate;
        if (Date) {
            startDate = moment.utc(Date).startOf('day').toDate();
            endDate = moment.utc(Date).endOf('day').toDate();
        } else {
            const lastMonth = moment.utc().subtract(1, 'month');
            startDate = lastMonth.startOf('month').toDate();
            endDate = lastMonth.endOf('month').toDate();
        }

        if (month) {
            const monthIndex = parseInt(month) - 1;
            startDate = moment.utc().year(year).month(monthIndex).startOf('month').toDate();
            endDate = moment.utc().year(year).month(monthIndex).endOf('month').toDate();
        }

        if (year && !month) {
            startDate = moment.utc().year(year).startOf('year').toDate();
            endDate = moment.utc().year(year).endOf('year').toDate();
        }

        const attendanceQuery = {
            date: { $gte: startDate, $lte: endDate },
        };

        const employeeQuery = {};

        if (employeeCode) {
            employeeQuery.employeeCode = employeeCode;
        }

        if (workMode) {
            employeeQuery.workMode = workMode;
        }

        // Add designation filter
        if (designation) {
            employeeQuery.designation = designation; // This assumes designation is stored as a string in the Employee model
        }

        const filteredEmployees = await Employee.find(employeeQuery).select('_id').populate(`designation`, `title`);

        // If employees are found, apply their IDs to the attendance query
        if (filteredEmployees.length > 0) {
            attendanceQuery.userId = { $in: filteredEmployees.map(emp => emp._id) };
        }

        const attendanceRecords = await Attendance.find(attendanceQuery)
            .populate({
                path: 'userId',
                select: 'name email workMode employeeCode designation',
                populate: { path: 'designation', select: 'title' }
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
                designation: record.userId.designation?.title, // Include designation in the output
            },
            date: record.date,
            totalWorkTime: record.totalWorkTime,
            totalBreakTime: record.totalBreakTime,
            status: record.status,
            Work_iD: record._id,
        }));

        if (formattedAttendance.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No matched fields..! ',
                data: [],
            });
        }

        res.status(200).json({
            success: true,
            count: formattedAttendance.length,
            data: formattedAttendance,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance data, Not matched fields..! ',
            error: error.message,
        });
    }
};


const getYesterdayAttendance = async (req, res) => {
    try {
        const today = new Date();

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const startOfYesterday = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0));
        const endOfYesterday = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999));

        const employees = await Employee.find({}).populate('designation', 'title');

        let results = [];

        for (const employee of employees) {
            const attendanceRecord = await Attendance.findOne({
                userId: employee._id,
                date: { $gte: startOfYesterday, $lte: endOfYesterday }
            });

            const employeeData = {
                name: employee.name,
                email: employee.email,
                employeeCode: employee.employeeCode,
                designation: employee.designation?.title || 'No designation'
            };

            if (attendanceRecord) {
                results.push({
                    employee: employeeData,
                    attendance: {
                        date: attendanceRecord.date.toISOString().slice(0, 10),
                        status: attendanceRecord.status
                    }
                });
            } else {
                results.push({
                    employee: employeeData,
                    attendance: {
                        date: startOfYesterday.toISOString().slice(0, 10),
                        status: 'Not marked'
                    }
                });
            }
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching yesterday\'s attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAttendanceSummary = async (req, res) => {
    try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
        const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

        const startOfCurrentMonth = moment().startOf('month').toDate();
        const endOfCurrentMonth = moment().endOf('month').toDate();

        const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate();
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        // Fetch today's attendance
        const todayAttendance = await Attendance.find({
            date: { $gte: startOfToday, $lte: endOfToday }
        });

        // Debugging line
        console.log('Today Attendance:', todayAttendance);

        // Fetch yesterday's attendance
        const yesterdayAttendance = await Attendance.find({
            date: { $gte: startOfYesterday, $lte: endOfYesterday }
        });

        // Count attendance status with the correct filter for present statuses
        const todayPresentCount = todayAttendance.filter(att =>
            att.status === 'Present' || att.status === 'Halfday' || att.status === 'Fullday'
        ).length;

        const todayAbsentCount = todayAttendance.filter(att => att.status === 'Absent' || att.status === '').length;

        const yesterdayPresentCount = yesterdayAttendance.filter(att => att.status === 'Present').length;
        const yesterdayAbsentCount = yesterdayAttendance.filter(att => att.status === 'Absent').length;

        const currentMonthAttendance = await Attendance.find({
            date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        });

        const lastMonthAttendance = await Attendance.find({
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });

        const currentMonthPresentCount = currentMonthAttendance.filter(att =>
            att.status === 'Present' || att.status === 'Halfday' || att.status === 'Fullday'
        ).length;

        const currentMonthAbsentCount = currentMonthAttendance.filter(att => att.status === 'Absent').length;

        const lastMonthPresentCount = lastMonthAttendance.filter(att =>
            att.status === 'Present' || att.status === 'Halfday' || att.status === 'Fullday'
        ).length;

        const lastMonthAbsentCount = lastMonthAttendance.filter(att => att.status === 'Absent').length;

        // Calculate percentage changes
        const presentPercentageChangeToday = yesterdayPresentCount === 0 ? 0 :
            ((todayPresentCount - yesterdayPresentCount) / yesterdayPresentCount) * 100;

        const absentPercentageChangeToday = yesterdayAbsentCount === 0 ? 0 :
            ((todayAbsentCount - yesterdayAbsentCount) / yesterdayAbsentCount) * 100;

        const presentPercentageChangeMonth = lastMonthPresentCount === 0 ? 0 :
            ((currentMonthPresentCount - lastMonthPresentCount) / lastMonthPresentCount) * 100;

        const absentPercentageChangeMonth = lastMonthAbsentCount === 0 ? 0 :
            ((currentMonthAbsentCount - lastMonthAbsentCount) / lastMonthAbsentCount) * 100;

        // Send response
        res.status(200).json({
            success: true,
            today: {
                presentCount: todayPresentCount,
                absentCount: todayAbsentCount,
                presentPercentageChange: presentPercentageChangeToday.toFixed() + '%',
                absentPercentageChange: absentPercentageChangeToday.toFixed() + '%',
            },
            yesterday: {
                presentCount: yesterdayPresentCount,
                absentCount: yesterdayAbsentCount
            },
            currentMonth: {
                totalCount: currentMonthAttendance.length,
                presentCount: currentMonthPresentCount,
                absentCount: currentMonthAbsentCount
            },
            lastMonth: {
                totalCount: lastMonthAttendance.length,
                presentCount: lastMonthPresentCount,
                absentCount: lastMonthAbsentCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance summary',
            error: error.message
        });
    }
};




module.exports = {
    updateAttendanceByDate,
    getAttendanceEditRequestByDetails,
    getAttendanceRequestList,
    getAttendanceEditRequestById,
    getProceedAttendanceList,
    getRejectedAttendanceList,
    getTodayAttendance,
    getAttendanceByUserId,
    getAttendanceByAttendanceId,
    getAttendanceForCurrentMonth,
    filterAttendance,
    getYesterdayAttendance,
    getAttendanceSummary
};
