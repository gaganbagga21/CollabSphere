import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// Updated CORS setup to allow all Vercel subdomains and local origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches Vercel domains or local hosts
    if (
      origin.endsWith('.vercel.app') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collabsphere')
  .then(() => console.log('🍃 Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({ 
  name: String, email: { type: String, unique: true }, password: String, role: String, category: String, location: String, meta: String, avatar: String, bio: String 
}, { timestamps: true });

const dealSchema = new mongoose.Schema({
  businessId: String, businessName: String, creatorId: String, creatorName: String,
  senderRole: String, title: String, perks: String, notes: String,
  status: { type: String, default: 'pending' },
  proofUrl: { type: String, default: '' }, proofStatus: { type: String, default: 'unsubmitted' },
  escrowAmount: { type: Number, default: 5000 }, escrowStatus: { type: String, default: 'funded' },
  dismissedByCreator: { type: Boolean, default: false },
  dismissedByBusiness: { type: Boolean, default: false },
  hiddenInInboxForCreator: { type: Boolean, default: false },
  hiddenInInboxForBusiness: { type: Boolean, default: false }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({ 
  dealId: { type: String, required: true }, 
  senderEmail: String, 
  senderName: String, 
  text: String, 
  fileUrl: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({ dealId: String, reviewerEmail: String, targetEmail: String, rating: Number, comment: String }, { timestamps: true });

const creatorSchema = new mongoose.Schema({
  name: String, email: String, category: String, location: String, meta: String, avatar: String, bio: String,
  engagementRate: { type: String, default: '4.8%' }, avgLikes: { type: String, default: '1.2k' }, topAudience: { type: String, default: 'Indore (62%)' }
});

const brandSchema = new mongoose.Schema({
  name: String, email: String, category: String, location: String, meta: String, avatar: String, bio: String,
  engagementRate: { type: String, default: '5.2%' }, avgLikes: { type: String, default: '2.4k' }, topAudience: { type: String, default: 'MP Region' }
});

const User = mongoose.model('User', userSchema);
const Deal = mongoose.model('Deal', dealSchema);
const Message = mongoose.model('Message', messageSchema);
const Review = mongoose.model('Review', reviewSchema);
const Creator = mongoose.model('Creator', creatorSchema);
const Brand = mongoose.model('Brand', brandSchema);

app.get('/', (req, res) => res.send('🚀 CollabSphere Live API Active'));

// AUTH / LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ 
        email, password: password || '123456', name: email.split('@')[0], role: email.includes('business') ? 'business' : 'creator' 
      });
    }
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, category: user.category, avatar: user.avatar, bio: user.bio, meta: user.meta }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login error' });
  }
});

// AI PITCH & BRIEF GENERATOR
app.post('/api/ai/generate-text', async (req, res) => {
  try {
    const { type, recipientName, category, followerCount } = req.body || {};
    
    if (apiKey) {
      const promptText = (type === 'pitch')
        ? `Write a compelling 2-sentence collaboration pitch from an influencer (${category || 'General'}, ${followerCount || '2.5k'} followers) to ${recipientName || 'Brand'}.`
        : `Write an engaging 2-sentence campaign offer brief from a brand manager to content creator ${recipientName || 'Creator'}.`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: promptText });
      if (response && response.text) {
        return res.json({ success: true, text: response.text.trim() });
      }
    }
  } catch (e) {
    console.warn('⚠️ Gemini AI Pitch Generation fallback active:', e.message);
  }

  const recipient = req.body?.recipientName || 'Partner';
  const niche = req.body?.category || 'creative';
  const reach = req.body?.followerCount || '2.5k';

  const fallbackText = (req.body?.type === 'pitch')
    ? `Hi ${recipient}, I love your brand vision! With my engaged audience in the ${niche} space (${reach}), I'd love to produce an exclusive reel highlight for your products.`
    : `Hello ${recipient}, we love your recent content quality! We'd like to sponsor your upcoming video and feature our brand with custom deliverables.`;

  res.json({ success: true, text: fallbackText });
});

// DASHBOARD AI STRATEGY ASSISTANT
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { prompt, userRole, category } = req.body || {};
    const query = (prompt || '').toLowerCase();

    if (apiKey) {
      const fullPrompt = `You are CollabSphere AI Strategy Bot. User Role: ${userRole || 'Creator'}, Category: ${category || 'General'}.\nUser Question: ${prompt}\nGive 3 short, practical, bulleted points for video reel ideas or marketing growth. Use markdown bolding for key points.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
      if (response && response.text) {
        return res.json({ success: true, answer: response.text.trim() });
      }
    }

    let dynamicAnswer = `💡 **Reel Strategy Ideas for "${prompt || 'Content Sponsorship'}"**:\n\n` +
      `1. **Problem-Solution Hook**: Start with a 3-second visual dilemma your audience relates to.\n` +
      `2. **Natural Product Integration**: Feature the brand's product seamlessly in mid-video action.\n` +
      `3. **Clear Call-To-Action**: Ask viewers to comment a specific keyword or tap the bio link for exclusive perks.`;

    if (query.includes('gym') || query.includes('fitness')) {
      dynamicAnswer = `💪 **Fitness & Gym Sponsorship Reel Strategy**:\n\n` +
        `1. **"Pre vs Post Workout Routine"**: Show energy gains using the brand's supplement/gear.\n` +
        `2. **"3 Form Mistakes You're Making"**: High-value tutorial with subtle brand placement.\n` +
        `3. **Discount Code CTA**: "Comment 'FIT' below to get 15% off your first order!"`;
    }

    return res.json({ success: true, answer: dynamicAnswer });

  } catch (err) {
    console.error('AI Assistant Error:', err);
    return res.json({ 
      success: true, 
      answer: `💡 **Content Ideas**:\n\n1. **Hook**: Catch attention in 2s with bold text overlays.\n2. **Value**: Demonstrate key benefits quickly.\n3. **CTA**: Direct viewers to save/share the reel.` 
    });
  }
});

// MATCHMAKER & DIRECTORY
app.post('/api/matchmaker', async (req, res) => {
  try {
    const { prompt, userRole } = req.body || {};
    const DBModel = (userRole === 'creator') ? Brand : Creator;
    const defaultBtnText = (userRole === 'creator') ? "Pitch Collaboration" : "Send Deal Invitation";

    let candidates = [];
    const isDefaultFeed = !prompt || prompt === 'all' || prompt.trim() === '';

    if (isDefaultFeed) {
      candidates = await DBModel.find({}).lean();
    } else {
      const queryRegex = new RegExp(prompt.trim(), 'i');
      candidates = await DBModel.find({
        $or: [
          { category: { $regex: queryRegex } },
          { bio: { $regex: queryRegex } },
          { name: { $regex: queryRegex } },
          { meta: { $regex: queryRegex } },
          { location: { $regex: queryRegex } }
        ]
      }).lean();
    }

    const cleanCandidates = (candidates || []).map((c, i) => ({
      name: c.name || "Collab Partner",
      email: c.email || "",
      category: c.category || "General",
      location: c.location || "Indore",
      meta: c.meta || "Active Account",
      avatar: c.avatar || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200",
      bio: c.bio || "No bio provided.",
      engagementRate: c.engagementRate || "4.8%",
      avgLikes: c.avgLikes || "1.2k",
      topAudience: c.topAudience || "Indore",
      match: Math.max(80, 99 - (i * 3)),
      btnText: defaultBtnText
    }));

    res.json({ success: true, results: cleanCandidates });
  } catch (error) {
    console.error('Matchmaker DB Search Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matchmaker data.' });
  }
});

// DEALS CRUD
app.get('/api/deals', async (req, res) => {
  try {
    const { userEmail, inboxOnly } = req.query;
    const deals = await Deal.find({
      $or: [{ creatorId: userEmail }, { businessId: userEmail }]
    }).sort({ createdAt: -1 }).lean();

    let visibleDeals = deals;
    if (inboxOnly === 'true') {
      visibleDeals = deals.filter(d => {
        if (d.creatorId === userEmail && d.hiddenInInboxForCreator) return false;
        if (d.businessId === userEmail && d.hiddenInInboxForBusiness) return false;
        return true;
      });
    }

    const enrichedDeals = await Promise.all(visibleDeals.map(async (d) => {
      const unreadCount = await Message.countDocuments({
        dealId: String(d._id),
        senderEmail: { $ne: userEmail },
        isRead: false
      });
      return { ...d, unreadCount };
    }));

    res.json({ success: true, deals: enrichedDeals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.post('/api/deals', async (req, res) => {
  const newDeal = await Deal.create(req.body);
  res.json({ success: true, deal: newDeal });
});

app.patch('/api/deals/:id', async (req, res) => {
  const updateData = req.body;
  if (updateData.status === 'completed') {
    updateData.escrowStatus = 'released';
  }
  const updated = await Deal.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json({ success: true, deal: updated });
});

app.delete('/api/deals/:id', async (req, res) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ dealId: req.params.id });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

app.post('/api/deals/:id/dismiss-notification', async (req, res) => {
  try {
    const { userRole } = req.body;
    const updateField = (userRole === 'creator') ? { dismissedByCreator: true } : { dismissedByBusiness: true };
    const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, updateField, { new: true });
    res.json({ success: true, message: 'Notification dismissed', deal: updatedDeal });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to dismiss notification' });
  }
});

app.post('/api/deals/hide-chat', async (req, res) => {
  try {
    const { dealId, userRole } = req.body;
    const updateField = (userRole === 'creator') ? { hiddenInInboxForCreator: true } : { hiddenInInboxForBusiness: true };
    await Deal.findByIdAndUpdate(dealId, updateField, { new: true });
    await Message.deleteMany({ dealId: String(dealId) });

    res.json({ success: true, message: 'Past conversation removed from inbox' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to hide conversation' });
  }
});

app.post('/api/messages/clear-history', async (req, res) => {
  try {
    const { dealId } = req.body;
    const deleteResult = await Message.deleteMany({ dealId: String(dealId) });
    res.json({ success: true, count: deleteResult.deletedCount, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear chat history' });
  }
});

// MESSAGES API
app.get('/api/messages/:dealId', async (req, res) => {
  try {
    const { userEmail } = req.query;
    const dealId = String(req.params.dealId);

    if (userEmail) {
      await Message.updateMany(
        { dealId, senderEmail: { $ne: userEmail }, isRead: false },
        { isRead: true }
      );
    }

    const messages = await Message.find({ dealId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { dealId, senderEmail, senderName, text, fileUrl } = req.body;
    const msg = await Message.create({
      dealId: String(dealId),
      senderEmail,
      senderName,
      text,
      fileUrl,
      isRead: false
    });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/messages/unread/total', async (req, res) => {
  try {
    const { userEmail } = req.query;
    const totalUnread = await Message.countDocuments({
      senderEmail: { $ne: userEmail },
      isRead: false
    });
    res.json({ success: true, totalUnread });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count unread messages' });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const result = await Message.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// DASHBOARD NOTIFICATIONS API
app.get('/api/deals/notifications', async (req, res) => {
  try {
    const { userEmail, userRole } = req.query;

    const pendingFilter = userRole === 'creator'
      ? { creatorId: userEmail, senderRole: 'business', status: 'pending', dismissedByCreator: false }
      : { businessId: userEmail, senderRole: 'creator', status: 'pending', dismissedByBusiness: false };
    const pendingDeals = await Deal.find(pendingFilter);

    const paymentRequestedDeals = (userRole === 'business') 
      ? await Deal.find({ businessId: userEmail, escrowStatus: 'requested', dismissedByBusiness: false })
      : [];

    const paymentReleasedDeals = (userRole === 'creator')
      ? await Deal.find({ creatorId: userEmail, escrowStatus: 'released', status: 'completed', dismissedByCreator: false })
      : [];

    const allUserDeals = await Deal.find({ $or: [{ creatorId: userEmail }, { businessId: userEmail }] });

    const stats = {
      total: allUserDeals.length,
      active: allUserDeals.filter(d => d.status === 'accepted').length,
      completed: allUserDeals.filter(d => d.status === 'completed').length
    };

    res.json({ 
      success: true, 
      count: pendingDeals.length + paymentRequestedDeals.length + paymentReleasedDeals.length, 
      pendingCount: pendingDeals.length,
      paymentRequestedCount: paymentRequestedDeals.length,
      paymentReleasedCount: paymentReleasedDeals.length,
      deals: pendingDeals,
      paymentRequests: paymentRequestedDeals,
      paymentReleases: paymentReleasedDeals,
      stats 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CollabSphere Server running on http://localhost:${PORT}`));