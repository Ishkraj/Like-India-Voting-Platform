require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Competition = require('./models/Competition');

const app = express();
app.use(express.json());
app.use(cors());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com', // Gmail hata kar Brevo laga diya
  port: 2525, // Render ka bypass port
  secure: false, // 2525 ke liye false hota hai
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// --- UPLOADS SETUP (For Images) ---
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


// ==========================================
//               API ROUTES
// ==========================================

// 1. Signup (Fast & No OTP)
app.post('/api/signup', async (req, res) => {
  const { name, phoneNumber, password } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    if (user) return res.status(400).json({ message: 'Phone number already registered!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, phoneNumber, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: 'Error in signup', error: error.message });
  }
});

// 2. Login (By Phone Number)
app.post('/api/login', async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'User not found! Please register first.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect Password!' });

    res.status(200).json({ 
      message: 'Login successful', 
      userId: user._id, 
      name: user.name 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Error in login', error: error.message });
  }
});

// 4. Add Competition
app.post('/api/add-competition', upload.any(), async (req, res) => {
  try {
    const { competitionName, numParticipants, userId } = req.body;
    const participantsData = [];

    for (let i = 0; i < numParticipants; i++) {
      const name = req.body[`name_${i}`];
      const details = req.body[`details_${i}`];
      
      const file = req.files.find(f => f.fieldname === `image_${i}`); 
      const imagePath = file ? `/uploads/${file.filename}` : '';

      participantsData.push({
        name,
        details,
        image: imagePath 
      });
    }

    const newCompetition = new Competition({
      name: competitionName,
      createdBy: userId,
      numParticipants,
      participants: participantsData,
      totalVotes: 0
    });

    await newCompetition.save();
    res.status(201).json({ message: 'Competition saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving competition', error });
  }
});

// 5. Get Competitions
// Get ALL Competitions
app.get('/api/competitions', async (req, res) => {
  try {
    // find() ke andar koi condition nahi hai, matlab sab return hoga
    const competitions = await Competition.find(); 
    res.status(200).json(competitions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching competitions', error });
  }
});

// Single Competition by ID
app.get('/api/competitions/:id', async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: "Not found" });
    
    const competitionData = comp.toObject();
    competitionData.totalVotes = comp.totalVotes || 0;
    
    res.status(200).json(competitionData);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
});

// 6. Submit Vote (1 User = 1 Vote)
app.post('/api/vote', async (req, res) => {
  const { competitionId, rankedParticipants, userId } = req.body; // Frontend se userId bhi aayega ab

  try {
    const comp = await Competition.findById(competitionId);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });

    if (comp.isActive === false) {
      return res.status(400).json({ message: 'Voting is currently closed by the admin!' });
    }

    // CHECK: Kya user ne pehle vote diya hai?
    if (comp.votedBy.includes(userId)) {
      return res.status(400).json({ message: 'You have already voted in this competition!' });
    }

    const total = rankedParticipants.length;
    rankedParticipants.forEach((participantId, index) => {
      const points = total - index;
      const participant = comp.participants.id(participantId);
      if (participant) {
        participant.totalScore += points;
      }
    });

    comp.totalVotes = (comp.totalVotes || 0) + 1;
    comp.votedBy.push(userId); // Vote hote hi user ka ID list me save ho jayega
    await comp.save();

    res.status(200).json({ message: 'Vote recorded successfully!', totalVotes: comp.totalVotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Voting failed', error });
  }
});

// 7. End Voting Route
app.post('/api/end-voting/:id', async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });
    
    comp.isActive = false; 
    await comp.save();
    
    res.status(200).json({ message: 'Voting ended successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error ending voting' });
  }
});

// Get Competition for Editing
app.get('/api/edit-competition/:id', async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: "Competition not found" });
    res.status(200).json(comp);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching competition' });
  }
});

// Update Competition Route
app.post('/api/edit-competition/:id', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    let participants = JSON.parse(req.body.participants);

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const indexMatch = file.fieldname.match(/image_(\d+)/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1]);
          participants[index].image = `/uploads/${file.filename}`;
        }
      });
    }

    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      { participants },
      { new: true }
    );

    res.status(200).json({ message: 'Updated successfully', updatedCompetition });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating competition' });
  }
});

// Open Voting Route (Jab Moderator/Admin voting shuru kare)
app.post('/api/open-voting/:id', async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });
    
    comp.isActive = true; 
    await comp.save();
    
    res.status(200).json({ message: 'Voting opened successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error opening voting' });
  }
});

// Admin & Moderator Password Verification Route
app.post('/api/verify-password', (req, res) => {
  const { action, password } = req.body;
  
  // action = 'admin' (Create, Edit, End ke liye)
  if (action === 'admin') {
    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ message: 'Authorized' });
    }
  }
  
  // action = 'open' (Open voting ke liye alag password)
  if (action === 'open') {
    if (password === process.env.MODERATOR_PASSWORD) {
      return res.status(200).json({ message: 'Authorized' });
    }
  }

  res.status(401).json({ message: 'Incorrect Password!' });
});

// Results Protected Route
app.post('/api/results/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Incorrect Admin Password!' });
  }
  try {
    const competition = await Competition.findById(req.params.id);
    res.status(200).json(competition);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));