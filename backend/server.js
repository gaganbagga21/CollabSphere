import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Bypass SRV lookup blocks

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Gemini AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🍃 Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  category: String,
  location: String,
  meta: String,
  avatar: String,
  bio: String
}, { timestamps: true });

const dealSchema = new mongoose.Schema({
  businessId: String,
  businessName: String,
  creatorId: String,
  creatorName: String,
  senderRole: String,
  title: String,
  perks: String,
  status: { type: String, default: 'pending' },
  notes: String
}, { timestamps: true });

const creatorSchema = new mongoose.Schema({
  name: String,
  email: String,
  category: String,
  location: String,
  meta: String,
  avatar: String,
  bio: String
});

const brandSchema = new mongoose.Schema({
  name: String,
  email: String,
  category: String,
  location: String,
  meta: String,
  avatar: String,
  bio: String
});

const User = mongoose.model('User', userSchema);
const Deal = mongoose.model('Deal', dealSchema);
const Creator = mongoose.model('Creator', creatorSchema);
const Brand = mongoose.model('Brand', brandSchema);

// Health Endpoint
app.get('/', (req, res) => {
  res.send('🚀 CollabSphere Live API Active');
});

// AUTHENTICATION
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }
    
    console.log(`🔐 User logged in: ${user.name} (${user.role})`);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category,
        avatar: user.avatar,
        bio: user.bio,
        meta: user.meta
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// MATCHMAKER & DIRECTORY
app.post('/api/matchmaker', async (req, res) => {
  try {
    const { prompt, userRole } = req.body;
    console.log(`\n🔍 Searching for: "${prompt}" (User Role: ${userRole})`);

    const DBModel = (userRole === 'creator') ? Brand : Creator;
    const defaultBtnText = (userRole === 'creator') ? "Pitch Collaboration" : "Send Deal Invitation";

    const testEmails = ['business@collabsphere.com', 'creator@collabsphere.com'];
    let relevantCandidates = [];
    const isDefaultFeed = !prompt || prompt === 'all' || prompt.trim() === '';

    if (isDefaultFeed) {
      relevantCandidates = await DBModel.find({
        email: { $nin: testEmails }
      }).lean();

      relevantCandidates.sort(() => Math.random() - 0.5);

    } else {
      const searchKeywords = prompt.trim().split(/\s+/).join('|');
      const queryRegex = new RegExp(searchKeywords, 'i');

      relevantCandidates = await DBModel.find({
        $or: [
          { category: { $regex: queryRegex } },
          { bio: { $regex: queryRegex } },
          { name: { $regex: queryRegex } },
          { meta: { $regex: queryRegex } },
          { email: { $regex: queryRegex } }
        ]
      }).lean();

      if (!relevantCandidates || relevantCandidates.length === 0) {
        relevantCandidates = await DBModel.find().lean();
      }

      relevantCandidates.sort((a, b) => {
        const aIsTest = testEmails.includes(a.email);
        const bIsTest = testEmails.includes(b.email);
        if (aIsTest && !bIsTest) return -1;
        if (!aIsTest && bIsTest) return 1;
        return 0;
      });
    }

    if (!relevantCandidates || relevantCandidates.length === 0) {
      return res.json({ results: [] });
    }

    let cleanCandidates = relevantCandidates.map(c => ({
      name: c.name,
      email: c.email,
      category: c.category,
      location: c.location,
      meta: c.meta,
      avatar: c.avatar,
      bio: c.bio
    }));

    const matches = cleanCandidates.map((c, i) => ({
      ...c,
      match: Math.max(82, 99 - (i * 2)),
      btnText: defaultBtnText
    }));

    console.log(`✅ Returning ${matches.length} candidates.`);
    res.json({ results: matches });

  } catch (error) {
    console.error('❌ Matchmaker Execution Error:', error);
    res.status(500).json({ error: 'Failed to process search query.' });
  }
});

// CREATE DEAL
app.post('/api/deals', async (req, res) => {
  try {
    const { businessId, businessName, creatorId, creatorName, senderRole, title, perks, notes } = req.body;
    
    const newDeal = await Deal.create({
      businessId: businessId || "business@collabsphere.com",
      businessName: businessName || "Flex Gym & Fitness",
      creatorId: creatorId || "creator@collabsphere.com",
      creatorName: creatorName || "Gagan Bagga",
      senderRole: senderRole || "business",
      title: title || "Influencer Collaboration Deal",
      perks: perks || "Promotional Sponsorship",
      notes: notes || "Sent via CollabSphere Matchmaker",
      status: "pending"
    });

    console.log(`🤝 New Deal Created: "${newDeal.title}"`);
    res.json({ success: true, deal: newDeal });
  } catch (err) {
    console.error('Error creating deal:', err);
    res.status(500).json({ error: 'Failed to create deal.' });
  }
});

// GET USER DEALS
app.get('/api/deals', async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: 'User email is required' });

    const deals = await Deal.find({
      $or: [{ creatorId: userEmail }, { businessId: userEmail }]
    }).sort({ createdAt: -1 });

    res.json({ success: true, deals });
  } catch (err) {
    console.error('Error fetching deals:', err);
    res.status(500).json({ error: 'Failed to fetch deals.' });
  }
});

// DASHBOARD NOTIFICATIONS
app.get('/api/deals/notifications', async (req, res) => {
  try {
    const { userEmail, userRole } = req.query;
    let filter = { status: 'pending' };

    if (userRole === 'creator') {
      filter.creatorId = userEmail;
      filter.senderRole = 'business';
    } else {
      filter.businessId = userEmail;
      filter.senderRole = 'creator';
    }

    const pendingDeals = await Deal.find(filter).sort({ createdAt: -1 });
    const allUserDeals = await Deal.find({
      $or: [{ creatorId: userEmail }, { businessId: userEmail }]
    });

    const stats = {
      total: allUserDeals.length,
      active: allUserDeals.filter(d => d.status === 'accepted').length,
      completed: allUserDeals.filter(d => d.status === 'completed').length
    };

    res.json({ success: true, count: pendingDeals.length, deals: pendingDeals, stats });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// UPDATE DEAL STATUS
app.patch('/api/deals/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, deal: updatedDeal });
  } catch (err) {
    console.error('Error updating deal:', err);
    res.status(500).json({ error: 'Failed to update deal.' });
  }
});

// DELETE DEAL (CANCEL REQUEST)
app.delete('/api/deals/:id', async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);
    if (!deletedDeal) {
      return res.status(404).json({ error: 'Deal request not found' });
    }
    console.log(`🗑️ Deal Request Cancelled/Deleted: "${deletedDeal.title}"`);
    res.json({ success: true, message: 'Deal request cancelled successfully.' });
  } catch (err) {
    console.error('Error deleting deal request:', err);
    res.status(500).json({ error: 'Failed to cancel deal request.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CollabSphere Server running on http://localhost:${PORT}`));