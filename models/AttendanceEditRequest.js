const mongoose = require('mongoose');

const AttendanceEditRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    punchIn: { type: Date, required: true },
    punchOut: { type: Date, required: true },
    totalWorkTime: { type: Number },
    totalBreakTime: { type: Number },
    breakTime: [
        {
            breakStart: { type: Date, required: true },
            breakEnd: { type: Date, required: true },
            time: { type: Number, required: true }
        }
    ],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminAction: {
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        reviewedAt: { type: Date },
        reason: { type: String },
    }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceEditRequest', AttendanceEditRequestSchema);
