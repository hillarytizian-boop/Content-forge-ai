// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// --- Helper Functions ---
const getUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- Routes ---

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Signup
app.post('/api/signup', (req, res) => {
  const { email, password, ref } = req.body;
  const users = getUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    id: Date.now(),
    email,
    password, // In production, hash this
    isPro: false,
    freeCredits: 0
  };

  // Handle referral bonus
  if (ref) {
    const refUser = users.find(u => u.id === Number(ref));
    if (refUser) {
      refUser.freeCredits = (refUser.freeCredits || 0) + 2;
    }
  }

  users.push(newUser);
  saveUsers(users);

  res.json({ message: 'Signup successful', user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful', user });
});

// Generate Content
app.post('/api/generate-content', (req, res) => {
  const { topic, type } = req.body;
  let content = '';

  if (type === 'tiktok') {
    content = `🎥 HOOK: Stop scrolling if you love ${topic}!\n\n💡 Secrets:\n1. Amazing insight.\n2. Quick tip.\n3. Must try!\n\nFollow for more! #${topic.replace(/\s/g,'')}`;
  } else if (type === 'instagram') {
    content = `✨ Obsessed with ${topic}! Explore more and swipe 👉\n\n#${topic.replace(/\s/g,'')} #inspiration`;
  } else if (type === 'youtube') {
    content = `In this video, we dive deep into ${topic}.\n0:00 Intro\n1:30 Importance\n5:00 Tips\nLike & Subscribe!`;
  }

  res.json({ content });
});

// Generate Video (Fallback 4K ready videos)
app.post('/api/generate-video', (req, res) => {
  const { query } = req.body;

  const fallbacks = {
    'nature': 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    'technology': 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4',
    'gym': 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-the-gym-2846-large.mp4',
    'default': 'https://www.w3schools.com/html/mov_bbb.mp4'
  };

  let videoUrl = fallbacks['default'];
  let source = 'Fallback Video (Big Buck Bunny)';

  const q = query.toLowerCase();
  if (q.includes('nature')) { videoUrl = fallbacks['nature']; source = 'Mixkit Nature'; }
  else if (q.includes('tech') || q.includes('computer')) { videoUrl = fallbacks['technology']; source = 'Mixkit Tech'; }
  else if (q.includes('gym') || q.includes('sport')) { videoUrl = fallbacks['gym']; source = 'Mixkit Gym'; }

  res.json({ videoUrl, source });
});

// Share Bonus
app.post('/api/grant-share-bonus', (req, res) => {
  const { userId } = req.body;
  const users = getUsers();
  const user = users.find(u => u.id === Number(userId));

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.freeCredits = (user.freeCredits || 0) + 2;
  saveUsers(users);
  res.json({ success: true, message: '2 free generations added' });
});

// Catch-all for undefined routes (404)
app.use((req, res) => {
  res.status(404).sendFile(path.join(frontendPath, 'index.html')); // fallback to index.html
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 ContentForge AI Server running on port ${PORT}`);
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
});