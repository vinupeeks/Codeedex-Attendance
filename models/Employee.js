const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    password: { type: String, required: true, },
    employeeCode: { type: String, required: true, unique: true, },
    designation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Designation',
        required: true,
    },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, },
    teamLead: { type: String, },
    workMode: { type: String, },
    role: { type: String, default: 'employee', },
}, {
    timestamps: true,
});

// Pre-save middleware to hash the password before saving
employeeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to check entered password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
