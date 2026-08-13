const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Dance", "Music"
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Event', eventSchema);