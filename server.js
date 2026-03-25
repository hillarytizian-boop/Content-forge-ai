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

// Helper: Read/Write Users
const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};

const saveUser = (user) => {
    const users = getUsers();
    users.push(user);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- ROUTES ---

// 1. Signup
app.post('/api/signup', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
        id: Date.now(),
        email,
        password, // For production: hash passwords
        isPro: false
    };

    saveUser(newUser);
    res.json({ message: 'Signup successful', user: newUser });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user });
});

// 3. Content Generator (Fallback Logic)
app.post('/api/generate-content', (req, res) => {
    const { topic, type } = req.body;
    let content = "";

    // Simple template logic for instant results
    if (type === 'tiktok') {
        content = `🎥 HOOK: Stop scrolling if you love ${topic}!\n\n💡 Here are 3 secrets about ${topic}:\n1. It changes everything.\n2. You need to try this today.\n3. The results are insane.\n\n👇 Follow for more ${topic} tips! #${topic.replace(/\s/g, '')} #viral`;
    } else if (type === 'instagram') {
        content = `✨ Obsessed with ${topic}! Swipe to see the details. \n\n#${topic.replace(/\s/g, '')} #inspiration #lifestyle`;
    } else if (type === 'youtube') {
        content = `In this video, we dive deep into ${topic}.\n\nTimestamps:\n0:00 Intro\n1:30 Why ${topic} matters\n5:00 The Secret Revealed\n\nDon't forget to LIKE and SUBSCRIBE!`;
    }

    res.json({ content });
});

// 4. Video Generator (Fallback & Pexels API)
app.post('/api/generate-video', async (req, res) => {
    const { query } = req.body;

    // Robust fallback videos
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

    // NOTE: For real 4K AI video generation, integrate with a service like Pexels, Pixabay, or an AI video generator API.
    // Current implementation guarantees working high-quality fallback videos.

    res.json({ videoUrl, source });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 ContentForge AI Server running on port ${PORT}`);
    // Initialize users file if not exists
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, '[]');
    }
});