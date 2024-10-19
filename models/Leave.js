const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeaveSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: String, enum: ['single-day', 'multiple-days'], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    session: { type: String, enum: ['full-day', 'AN', 'FN'], required: true },
    reason: { type: String, required: true },
    handoverEmployee: {
        employeeCode: { type: String, required: true },
        employeeName: { type: String, required: true },
        phoneNumber: { type: String, required: true }
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);
