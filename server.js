const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './users.json';

// ===== USER STORAGE =====
function loadUsers() {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUsers(users) {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ===== AUTH =====
app.post('/api/signup', (req, res) => {
    const { email, password } = req.body;

    let users = loadUsers();
    if (users.find(u => u.email === email)) {
        return res.json({ success: false });
    }

    users.push({ email, password, isPro: false });
    saveUsers(users);

    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const users = loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.json({ success: false });

    res.json({ success: true, user });
});

// ===== REAL AI CONTENT =====
app.post('/api/generate-content', async (req, res) => {
    const { topic, type } = req.body;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: `Create a ${type} about ${topic}. Make it engaging and viral.`
                    }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "Error generating content";

        res.json({ content });

    } catch (err) {
        res.json({ content: "AI error. Try again." });
    }
});

// ===== REAL VIDEO API (PEXELS) =====
app.post('/api/generate-video', async (req, res) => {
    const { query } = req.body;

    try {
        const response = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=1`, {
            headers: {
                Authorization: process.env.PEXELS_API_KEY
            }
        });

        const data = await response.json();

        const video = data.videos?.[0]?.video_files?.[0]?.link;

        res.json({
            videoUrl: video || "https://www.w3schools.com/html/mov_bbb.mp4"
        });

    } catch (err) {
        res.json({
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
        });
    }
});

// ===== ROOT =====
app.get('/', (req, res) => {
    res.send("AI Backend Running 🚀");
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));