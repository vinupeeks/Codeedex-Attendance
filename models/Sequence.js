const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
    sequenceName: { type: String, required: true, unique: true },
    sequenceValue: { type: Number, default: 100 },
});

module.exports = mongoose.model('Sequence', sequenceSchema);
