const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Designation = mongoose.model('Designation', designationSchema);
module.exports = Designation;