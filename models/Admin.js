const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true, },
    username: { type: String, required: true, unique: true, },
    password: { type: String, required: true, },
    email: { type: String, required: true, unique: true, },
    address: { type: String, },
    role: { type: String, default: 'admin', },
},
    {
        timestamps: true,
    });

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
