const Attendance = require("../models/attendance");


// Create Punch-In (Start Attendance)
exports.punchIn = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        let attendanceCheck = await Attendance.findOne({ userId, date: today })
            .select('-createdAt -updatedAt');

        if (attendanceCheck) {
            return res.status(400).json({ message: 'You have already punched in today.' });
        }

        const attendance = new Attendance({
            userId,
            date: today,
            punchIn: new Date(),
            status: 'Present'
        })
        await attendance.save();

        const attendanceResponse = attendance.toObject();
        delete attendanceResponse.createdAt;
        delete attendanceResponse.updatedAt;

        res.status(201).json(attendanceResponse);
    } catch (error) {
        res.status(500).json({ message: 'Error punching in', error });
    }
};

// Create Punch-Out (End Attendance)
exports.punchOut = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const attendance = await Attendance.findOne({ userId, date: today })
            .select('-createdAt -updatedAt');

        if (!attendance || !attendance.punchIn) {
            return res.status(404).json({ message: 'No active attendance found.' });
        }
        const currentBreak = attendance.breakTimes[attendance.breakTimes.length - 1];
        if (currentBreak && currentBreak.breakStart && !currentBreak.breakEnd) {
            currentBreak.breakEnd = new Date();

            const breakDuration = Math.floor((new Date(currentBreak.breakEnd) - new Date(currentBreak.breakStart)) / (1000 * 60)); // in minutes
            attendance.totalBreakTime += breakDuration;
            currentBreak.time = breakDuration;
        }

        attendance.punchOut = new Date();
        const punchInTime = new Date(attendance.punchIn);
        const punchOutTime = new Date(attendance.punchOut);

        const totalTime = Math.floor((punchOutTime - punchInTime) / (1000 * 60));
        attendance.totalWorkTime = totalTime - attendance.totalBreakTime;

        if (attendance.totalWorkTime < 240) {
            attendance.status = 'Halfday';
        }

        await attendance.save();
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error punching out', error });
    }
};

// Start Break
exports.startBreak = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const attendance = await Attendance.findOne({ userId, date: today })
            .select('-createdAt -updatedAt');

        if (!attendance || !attendance.punchIn) {
            return res.status(404).json({ message: 'No active attendance found.' });
        }

        if (attendance.punchOut) {
            return res.status(404).json({ message: 'You are already PunchedOut.' });
        }

        const lastBreak = attendance.breakTimes[attendance.breakTimes.length - 1];
        if (lastBreak && !lastBreak.breakEnd) {
            return res.status(400).json({ message: 'A break is already ongoing. Please end the current break before starting a new one.' });
        }

        attendance.breakTimes.push({ breakStart: new Date() });
        await attendance.save();

        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error starting break', error });
    }
};

// End Break
exports.endBreak = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const attendance = await Attendance.findOne({ userId, date: today })
            .select('-createdAt -updatedAt');

        if (!attendance || !attendance.punchIn) {
            return res.status(404).json({ message: 'No active attendance found.' });
        }

        const currentBreak = attendance.breakTimes[attendance.breakTimes.length - 1];

        if (!currentBreak.breakStart || currentBreak.breakEnd) {
            return res.status(400).json({ message: 'No ongoing break found.' });
        }

        currentBreak.breakEnd = new Date();

        const breakDuration = Math.floor((new Date(currentBreak.breakEnd) - new Date(currentBreak.breakStart)) / (1000 * 60)); // in minutes
        attendance.totalBreakTime += breakDuration;
        currentBreak.time = breakDuration
        // attendance.time

        await attendance.save();
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error ending break', error });
    }
};

exports.getAttendance = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const attendance = await Attendance.findOne({ userId, date: today })
            .select('-createdAt -updatedAt');

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found.' });
        } 

        let totalBreakTime = 0;

        attendance.breakTimes.forEach(breakTime => {
            if (breakTime.breakStart && breakTime.breakEnd) {
                const breakDuration = Math.floor((new Date(breakTime.breakEnd) - new Date(breakTime.breakStart)) / (1000 * 60)); // in minutes
                totalBreakTime += breakDuration;
            }
        });

        const punchOutTime = attendance.punchOut ? new Date(attendance.punchOut) : new Date();

        const workDuration = Math.floor((punchOutTime - new Date(attendance.punchIn)) / (1000 * 60));

        const totalWorkTime = workDuration - totalBreakTime;

        const result = {
            totalBreakTime,
            totalWorkTime,
            breakTimes: attendance.breakTimes,
            punchIn: attendance.punchIn,
            punchOut: attendance.punchOut || 'Still Working',
            WorkingStatus: attendance.status
        };

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};

exports.getAllAttendance = async (req, res) => {
    const userId = req.user._id;

    try {
        const attendanceRecords = await Attendance.find({ userId })
            .select('punchIn punchOut date totalWorkTime status')
            .select('-createdAt -updatedAt');

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found for this user.' });
        }


        const formattedRecords = attendanceRecords.map(record => ({
            date: record.date,
            punchIn: record.punchIn,
            punchOut: record.punchOut ? record.punchOut : 'Still working',
            totalWorkTime: record.totalWorkTime ? `${record.totalWorkTime} minutes` : 'N/A',
            status: record.status || 'N/A'
        }));

        res.status(200).json(formattedRecords);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};

// Get one attendance record by date
exports.getAttendanceByDate = async (req, res) => {
    const userId = req.user._id;
    const { date } = req.body;

    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    try {
        const attendanceDate = new Date(date).setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ userId, date: attendanceDate })
            .select('-createdAt -updatedAt');

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found for this date.' });
        }

        const result = {
            date: attendance.date,
            punchIn: attendance.punchIn,
            punchOut: attendance.punchOut ? attendance.punchOut : 'Still working',
            totalWorkTime: attendance.totalWorkTime ? `${attendance.totalWorkTime}` : 'N/A',
            totalBreakTime: attendance.totalBreakTime ? `${attendance.totalBreakTime}` : 'N/A',
            status: attendance.status || 'N/A',
        };
        breakTime: attendance.breakTimes

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance record', error });
    }
};

// Get attendance list by date range
exports.getAttendanceByDateRange = async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Both start date and end date are required.' });
    }

    try {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);

        const attendanceRecords = await Attendance.find({
            userId,
            date: {
                $gte: start,
                $lte: end
            }
        });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found for the selected dates.' });
        }
        const result = attendanceRecords.map(record => ({
            date: record.date,
            punchIn: record.punchIn,
            punchOut: record.punchOut ? record.punchOut : 'Still working',
            totalWorkTime: record.totalWorkTime ? `${record.totalWorkTime} minutes` : 'N/A',
            totalBreakTime: record.totalBreakTime ? `${record.totalBreakTime} minutes` : 'N/A',
            status: record.status || 'N/A'
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};
