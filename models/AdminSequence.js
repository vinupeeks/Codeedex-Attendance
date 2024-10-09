const mongoose = require('mongoose');

const sequenceAdminSchema = new mongoose.Schema({
    sequenceName: { type: String, required: true, unique: true },
    sequenceValue: { type: Number, default: 100 },
});

module.exports = mongoose.model('AdminSequence', sequenceAdminSchema);
