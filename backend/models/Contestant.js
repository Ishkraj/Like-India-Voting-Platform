const mongoose = require('mongoose');

const contestantSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  details: { type: String },
  image: { type: String },
  totalScore: { type: Number, default: 0 } // Rank ke hisaab se points add honge (eg. Rank 1 = 3 pts, Rank 2 = 2 pts)
});

module.exports = mongoose.model('Contestant', contestantSchema);