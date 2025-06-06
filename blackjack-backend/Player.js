const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    chips: { type: Number, required: true, default: 1000 }
});

module.exports = mongoose.model('Player', playerSchema);