// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure frontend folder path matches your setup
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(cors());
app.use(bodyParser.json());

// USERS FILE
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper: read users
const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
    const data = fs.readFileSync(USERS_FILE);
    try { return JSON.parse(data); } 
    catch { return []; }
};

// Helper: save users
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// --- ROUTES ---

// Signup with optional referral
app.post('/api/signup', (req,res)=>{
    const { email, password, referralId } = req.body;
    const users = getUsers();

    if(users.find(u=>u.email===email)) return res.status(400).json({message:'User exists'});

    const newUser = { id: Date.now(), email, password, isPro:false, freeCredits:0 };

    if(referralId){
        const referrer = users.find(u=>u.id===parseInt(referralId));
        if(referrer) referrer.freeCredits = (referrer.freeCredits||0)+2;
    }

    users.push(newUser);
    saveUsers(users);
    res.json({message:'Signup successful', user:newUser});
});

// Login
app.post('/api/login', (req,res)=>{
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u=>u.email===email && u.password===password);
    if(!user) return res.status(401).json({message:'Invalid credentials'});
    res.json({message:'Login successful', user});
});

// Generate content
app.post('/api/generate-content', (req,res)=>{
    const { topic, type } = req.body;
    let content='';
    if(type==='tiktok') content=`🎥 HOOK: Stop scrolling if you love ${topic}!\n💡 Secrets about ${topic}...\n👇 Follow for more #${topic.replace(/\s/g,'')}`;
    else if(type==='instagram') content=`✨ Obsessed with ${topic}! Swipe for more. #${topic.replace(/\s/g,'')} #inspo`;
    else if(type==='youtube') content=`Deep dive into ${topic}.\n0:00 Intro\n1:30 Why it matters\n5:00 Secret Revealed\nLIKE & SUBSCRIBE!`;
    res.json({content});
});

// Video generation fallback
app.post('/api/generate-video', (req,res)=>{
    const { query } = req.body;
    const fallbacks={
        nature:'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
        technology:'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4',
        gym:'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-the-gym-2846-large.mp4',
        default:'https://www.w3schools.com/html/mov_bbb.mp4'
    };
    let videoUrl=fallbacks.default, source="Fallback Video";
    const q=query.toLowerCase();
    if(q.includes('nature')) {videoUrl=fallbacks.nature; source="Mixkit Nature";}
    else if(q.includes('tech')||q.includes('computer')) {videoUrl=fallbacks.technology; source="Mixkit Tech";}
    else if(q.includes('gym')||q.includes('sport')) {videoUrl=fallbacks.gym; source="Mixkit Gym";}
    res.json({videoUrl, source});
});

// Grant share/referral bonus
app.post('/api/grant-share-bonus',(req,res)=>{
    const { userId } = req.body;
    const users = getUsers();
    const user = users.find(u=>u.id===userId);
    if(!user) return res.status(404).json({success:false,message:'User not found'});
    user.freeCredits=(user.freeCredits||0)+2;
    saveUsers(users);
    res.json({success:true,message:'2 free generations added'});
});

// Start server
app.listen(PORT, ()=>{
    console.log(`🚀 Server running on port ${PORT}`);
    if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE,'[]');
});