const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: String,
  details: String,
  image: String,
  totalScore: { type: Number, default: 0 }
});

const competitionSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  numParticipants: Number,
  participants: [participantSchema],
  totalVotes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  // Naya array banaya hai jo un users ki ID store karega jinhone vote de diya hai
  votedBy: [{ type: String }] 
}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);