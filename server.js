// FILE: backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

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

// 1. Signup
app.post('/api/signup', (req, res) => {
    const { email, password, referralId } = req.body;
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
        id: Date.now(),
        email,
        password, // For production, hash this!
        isPro: false,
        freeCredits: 0
    };

    // Referral Bonus
    if (referralId) {
        const referrer = users.find(u => u.id === parseInt(referralId));
        if (referrer) {
            referrer.freeCredits = (referrer.freeCredits || 0) + 2;
        }
    }

    users.push(newUser);
    saveUsers(users);
    res.json({ message: 'Signup successful', user: newUser });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful', user });
});

// 3. Content Generator
app.post('/api/generate-content', (req, res) => {
    const { topic, type } = req.body;
    let content = '';

    if (type === 'tiktok') {
        content = `🎥 HOOK: Stop scrolling if you love ${topic}!\n💡 Did you know these 3 secrets about ${topic}?\n1. It changes everything.\n2. You need to try this today.\n3. The results are insane.\n👇 CTA: Follow for more ${topic} tips! #${topic.replace(/\s/g,'')} #viral`;
    } else if (type === 'instagram') {
        content = `✨ Obsessed with ${topic} lately! Swipe to see the details. #${topic.replace(/\s/g,'')} #lifestyle #inspiration`;
    } else if (type === 'youtube') {
        content = `In this video, we dive deep into ${topic}.\nTimestamps:\n0:00 Intro\n1:30 Why ${topic} matters\n5:00 The Secret Revealed\nDon't forget to LIKE and SUBSCRIBE!`;
    }

    res.json({ content });
});

// 4. Video Generator (with fallback 4K videos)
app.post('/api/generate-video', (req, res) => {
    const { query } = req.body;

    const fallbacks = {
        'nature': 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
        'technology': 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4',
        'gym': 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-the-gym-2846-large.mp4',
        'default': 'https://www.w3schools.com/html/mov_bbb.mp4'
    };

    let videoUrl = fallbacks['default'];
    let source = "Fallback Video (Big Buck Bunny)";
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('nature')) { videoUrl = fallbacks['nature']; source = "Mixkit Nature"; }
    else if (lowerQuery.includes('tech') || lowerQuery.includes('computer')) { videoUrl = fallbacks['technology']; source = "Mixkit Tech"; }
    else if (lowerQuery.includes('gym') || lowerQuery.includes('sport')) { videoUrl = fallbacks['gym']; source = "Mixkit Gym"; }

    res.json({ videoUrl, source });
});

// 5. Share Bonus Route (Referral)
app.post('/api/grant-share-bonus', (req, res) => {
    const { userId } = req.body;
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.freeCredits = (user.freeCredits || 0) + 2;
    saveUsers(users);
    res.json({ success: true, message: '2 free generations added' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 ContentForge AI Server running on port ${PORT}`);
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
});