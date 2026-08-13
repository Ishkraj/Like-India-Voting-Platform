const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String, required: true },
  image: { type: String, required: true },
  totalScore: { type: Number, default: 0 }
});

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Nayi field
  numParticipants: { type: Number, required: true },
  participants: [participantSchema],
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalVotes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Competition', competitionSchema);