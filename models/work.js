const mongoose = require('mongoose');

// Updated Work Schema
const workSchema = new mongoose.Schema({
    workName: { type: String, required: true, },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation', required: true, },
    assignedTo: [{
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, },
        status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
    }],
    deadline: { type: Date, required: true, },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending', },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, }
}, { timestamps: true });

const Work = mongoose.model('Work', workSchema);
module.exports = Work;