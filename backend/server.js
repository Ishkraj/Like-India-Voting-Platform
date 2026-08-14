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
  host: 'smtp-relay.brevo.com', 
  port: 2525, 
  secure: false, 
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
//             API ROUTES
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

    // 🌟 YAHAN UPDATE HUA HAI: Ab hum userId aur name bhi bhej rahe hain taaki direct login ho sake
    res.status(201).json({ 
      message: 'Registration successful!', 
      userId: user._id,
      name: user.name 
    });
    
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

// 6. Submit Vote (1 User = 1 Vote) - 🔥 CONCURRENCY FIX 🔥
app.post('/api/vote', async (req, res) => {
  const { competitionId, ratings, userId } = req.body; 

  try {
    // 1. Pehle basic checks kar lete hain
    const comp = await Competition.findById(competitionId);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });
    if (comp.isActive === false) return res.status(400).json({ message: 'Voting is currently closed by the admin!' });
    if (comp.votedBy.includes(userId)) return res.status(400).json({ message: 'You have already voted!' });

    // 2. ATOMIC UPDATE LOGIC (Multiple bando ko ek sath handle karne ke liye)
    let incQuery = { totalVotes: 1 };
    let filters = [];

    // Har participant ke liye dynamically filter aur increment query banana
    ratings.forEach((ratingObj, index) => {
      incQuery[`participants.$[elem${index}].totalScore`] = ratingObj.stars;
      // Array Filters ke liye ID ko MongoDB ObjectId me convert karna zaroori hai
      filters.push({ [`elem${index}._id`]: new mongoose.Types.ObjectId(ratingObj.participantId) });
    });

    const updateOptions = { new: true };
    if (filters.length > 0) {
      updateOptions.arrayFilters = filters;
    }

    // 3. findOneAndUpdate seedha database me ek-ek karke process (queue) hota hai, bina VersionError ke!
    const updatedComp = await Competition.findOneAndUpdate(
      { 
        _id: competitionId, 
        isActive: true, 
        votedBy: { $ne: userId } // Strict atomic check ki user ne pehle vote na diya ho
      },
      {
        $inc: incQuery,             // Har participant ke Stars aur total votes ek sath jodo
        $push: { votedBy: userId }  // User ka ID voted list me ek sath daalo
      },
      updateOptions
    );

    // Agar updatedComp nahi mila, toh iska matlab user ne same time pe multiple tap kar diye the
    if (!updatedComp) {
      return res.status(400).json({ message: 'Vote failed or you already voted. Please try again.' });
    }

    res.status(200).json({ message: 'Vote recorded successfully!', totalVotes: updatedComp.totalVotes });
  } catch (error) {
    console.error("Concurrency Voting Error:", error);
    res.status(500).json({ message: 'Voting failed', error: error.message });
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
  
  if (action === 'admin') {
    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ message: 'Authorized' });
    }
  }
  
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