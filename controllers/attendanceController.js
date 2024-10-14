const Attendance = require("../models/attendance");


// Create Punch-In (Start Attendance)
exports.punchIn = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        let attendance = await Attendance.findOne({ userId, date: today });

        if (attendance) {
            return res.status(400).json({ message: 'You have already punched in today.' });
        }

        attendance = new Attendance({
            userId,
            date: today,
            punchIn: new Date(),
            status: 'Present'
        });

        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error punching in', error });
    }
};

// Create Punch-Out (End Attendance)
exports.punchOut = async (req, res) => {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    try {
        const attendance = await Attendance.findOne({ userId, date: today });

        if (!attendance || !attendance.punchIn) {
            return res.status(404).json({ message: 'No active attendance found.' });
        }

        // Update punch-out time and calculate total work time
        attendance.punchOut = new Date();

        const punchInTime = new Date(attendance.punchIn);
        const punchOutTime = new Date(attendance.punchOut);

        const totalTime = Math.floor((punchOutTime - punchInTime) / (1000 * 60)); // in minutes
        attendance.totalWorkTime = totalTime - attendance.totalBreakTime;

        // Set Halfday status based on working hours
        if (attendance.totalWorkTime < 100) { // example: less than 4 hours
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
        const attendance = await Attendance.findOne({ userId, date: today });

        if (!attendance || !attendance.punchIn) {
            return res.status(404).json({ message: 'No active attendance found.' });
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
        const attendance = await Attendance.findOne({ userId, date: today });

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
    const userId = req.user._id; // Assuming you are using some middleware to get user from the token
    const today = new Date().setHours(0, 0, 0, 0); // This sets the time to midnight, so only the date is compared

    try {
        const attendance = await Attendance.findOne({ userId, date: today });

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
// totalWorkTime