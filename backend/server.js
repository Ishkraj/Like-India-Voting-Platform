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
  host: 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT == 465,
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

// 1. Signup (Save user & Send OTP)
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user && user.isVerified) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; 

    if (user) {
      user.password = hashedPassword;
      user.email = email; // Ensure email update ho jaye
      user.otp = otp;
      user.otpExpires = otpExpires;
    } else {
      user = new User({ username, email, password: hashedPassword, otp, otpExpires });
    }
    await user.save();

    // Fix: user.email use kiya hai taaki undefined error na aaye
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify your Like India Account',
      text: `Jai Hind! Your OTP for signup is ${otp}. Valid for 5 minutes.`
    });

    res.status(200).json({ message: 'OTP sent to email. Please verify.' });
  } catch (error) {
    console.error("Signup Error:", error); // Logs me error dikhega
    res.status(500).json({ message: 'Error in signup', error: error.message });
  }
});

// 2. Verify Signup OTP
app.post('/api/verify-signup', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Account verified successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error });
  }
});

// 3. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'User not found or not verified' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', userId: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error in login', error });
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
app.get('/api/competitions', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) {
      query.createdBy = userId;
    }

    const competitions = await Competition.find(query).sort({ _id: -1 });
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

// 6. Submit Vote
app.post('/api/vote', async (req, res) => {
  const { competitionId, rankedParticipants } = req.body;

  try {
    const comp = await Competition.findById(competitionId);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });

    if (comp.isActive === false) {
      return res.status(400).json({ message: 'Voting has been ended by the admin!' });
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

// Admin Password Verification Route
app.post('/api/verify-admin', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ message: 'Authorized' });
  }
  res.status(401).json({ message: 'Incorrect Admin Password!' });
});

// User Login Password Verification Route
app.post('/api/verify-user-password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect Password!' });

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error("BACKEND ERROR:", error); 
    res.status(500).json({ message: error.message });
  }
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