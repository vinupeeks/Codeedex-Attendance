const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    punchIn: { type: Date, required: true },
    punchOut: { type: Date, default: null },
    breakTimes: [
        {
            breakStart: { type: Date, default: null },
            breakEnd: { type: Date, default: null },
            time: { type: Number, default: null }
        }
    ],
    totalBreakTime: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Halfday', 'Fullday'],
        default: 'Absent'
    },
    totalWorkTime: { type: Number, default: 0 }
}, {
    timestamps: true
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
