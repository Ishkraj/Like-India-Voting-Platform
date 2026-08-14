const mongoose = require('mongoose');

const contestantSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  details: { type: String }, // Ye tera Act / Performance Type hai
  image: { type: String },
  totalScore: { type: Number, default: 0 } // ✅ Star rating ke total stars yahan add honge
});

module.exports = mongoose.model('Contestant', contestantSchema);