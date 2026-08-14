const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String, required: true }, // Ise humne 'Act' ke taur par use kiya hai
  image: { type: String, required: true },
  totalScore: { type: Number, default: 0 } // Yahan stars ka total count save hoga
});

const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  numParticipants: { type: Number, required: true },
  participants: [participantSchema],
  isActive: { type: Boolean, default: true },
  totalVotes: { type: Number, default: 0 },
  votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Competition', competitionSchema);