import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Bypasses local SRV lookup blocks

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // Plaintext for demo simplicity
  role: String, // 'business' or 'creator'
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
  senderRole: String, // 'business' or 'creator'
  title: String,
  perks: String,
  status: { type: String, default: 'pending' }, // 'pending' | 'accepted' | 'completed' | 'declined'
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

// Dummy Auth Accounts
const dummyUsers = [
  {
    name: "Flex Gym & Fitness",
    email: "business@collabsphere.com",
    password: "123456",
    role: "business",
    category: "Fitness & Gym",
    location: "Indore",
    meta: "Perks: Free 6-Mo Membership + ₹2,000 Reel Budget",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200",
    bio: "Premium gym facility in Indore looking for local workout vloggers and creators."
  },
  {
    name: "Gagan Bagga",
    email: "creator@collabsphere.com",
    password: "123456",
    role: "creator",
    category: "Fitness & Gym",
    location: "Indore",
    meta: "@gagan_bagga • 2.0k Followers",
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200",
    bio: "Fitness vlogger & personal workout coach in Indore | Daily training reels, diet tips, & vlogs."
  }
];

// Pre-Seeded Sample Deals (Pending, Active/Accepted, Completed)
const sampleDeals = [
  {
    businessId: "business@collabsphere.com",
    businessName: "Flex Gym & Fitness",
    creatorId: "creator@collabsphere.com",
    creatorName: "Gagan Bagga",
    senderRole: "business",
    title: "Gym Promo Reel & Membership Showcase",
    perks: "Free 6-Mo Membership + ₹2,000 Reel Budget",
    status: "pending",
    notes: "Hey Gagan! We loved your workout vlogs and would love to sponsor your gym training reels at Flex Gym."
  },
  {
    businessId: "business@collabsphere.com",
    businessName: "Flex Gym & Fitness",
    creatorId: "creator@collabsphere.com",
    creatorName: "Gagan Bagga",
    senderRole: "business",
    title: "Supplement Showcase & Gym Routine Reel",
    perks: "Free Whey Protein Tub + ₹1,500 Payout",
    status: "accepted",
    notes: "Active campaign in progress."
  },
  {
    businessId: "gourmet@demo.com",
    businessName: "The Gourmet Cafe",
    creatorId: "creator@collabsphere.com",
    creatorName: "Gagan Bagga",
    senderRole: "creator",
    title: "Healthy Brunch & Diet Meal Vlog",
    perks: "Free Healthy Meal + ₹2,000 Reel Fee",
    status: "completed",
    notes: "Delivered reel on schedule!"
  }
];

// Full 40 Creators List (Gagan Bagga + 39 Nano Creators)
const nanoCreators = [
  // FITNESS (<= 5k)
  { name: "Gagan Bagga", email: "creator@collabsphere.com", category: "Fitness & Gym", location: "Indore", meta: "@gagan_bagga • 2.0k Followers", avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200", bio: "Fitness vlogger & personal workout coach in Indore | Daily training reels, diet tips, & vlogs." },
  { name: "Indore Fitness Guide", email: "fitguide@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@indore.fit_guide • 3.4k Followers", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200", bio: "Guiding gym enthusiasts in MP. Daily workout reels." },
  { name: "Yash Fitness Vlogs", email: "yash@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@fit_with_yash • 1.8k Followers", avatar: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=200", bio: "Student fitness journey, physique updates, & budget diet." },
  { name: "Pragya Powerlifting", email: "pragya@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@pragya_powerlifting • 4.2k Followers", avatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=200", bio: "State powerlifter & gym coach sharing form tips." },
  { name: "Shivam Calisthenics", email: "shivam@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@calisthenics_shivam • 2.9k Followers", avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=200", bio: "Bodyweight strength, pull-ups, and street workout tutorials." },
  { name: "Rohit Workout Vlogs", email: "rohit@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@iron_mind_rohit • 1.5k Followers", avatar: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=200", bio: "Hardcore gym motivation and daily transformation vlogs." },
  { name: "Ananya Yoga", email: "ananya@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@yoga_with_ananya • 3.8k Followers", avatar: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=200", bio: "Certified yoga instructor sharing daily posture practices." },
  { name: "Saksham Gym Vlogs", email: "saksham@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@shredded_saksham • 4.9k Followers", avatar: "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&q=80&w=200", bio: "Natural physique builder & supplement breakdown." },
  { name: "Aman Personal Trainer", email: "aman@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@core_nutrition_indore • 2.7k Followers", avatar: "https://images.unsplash.com/photo-1491786317500-11116c47863f?auto=format&fit=crop&q=80&w=200", bio: "Online coaching & weight loss guidance for students." },
  { name: "Tanmay Fitness", email: "tanmay@demo.com", category: "Fitness & Gym", location: "Indore", meta: "@flex_physique_tanmay • 1.2k Followers", avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=200", bio: "Beginner gym tips & aesthetic conditioning." },

  // FOOD (<= 5k)
  { name: "Indori Food Diaries", email: "fooddiaries@demo.com", category: "Food & Cafes", location: "Indore", meta: "@indori_food_diaries • 3.1k Followers", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200", bio: "Exploring local street food, cafes, & hidden food spots." },
  { name: "Hunger Bites MP", email: "hungerbites@demo.com", category: "Food & Cafes", location: "Indore", meta: "@hunger_bites_indore • 4.5k Followers", avatar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=200", bio: "Honest food reviews, night markets, and cafe recommendations." },
  { name: "Chai & Street Vlogs", email: "chai@demo.com", category: "Food & Cafes", location: "Indore", meta: "@chahi_and_charcha • 2.2k Followers", avatar: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200", bio: "Chai spots, evening snacks, & student hangout reviews." },
  { name: "Street Taste Indore", email: "streettaste@demo.com", category: "Food & Cafes", location: "Indore", meta: "@street_taste_indore • 1.9k Followers", avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200", bio: "Chapan Dukan & Sarafa night food short reels." },
  { name: "Cafe Hop Indore", email: "cafehop@demo.com", category: "Food & Cafes", location: "Indore", meta: "@cafe_hop_indore • 3.7k Followers", avatar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200", bio: "Aesthetic cafe reviews, coffee tasting, & brunch spots." },
  { name: "Nikhil Food Vlogs", email: "nikhil@demo.com", category: "Food & Cafes", location: "Indore", meta: "@foodie_nikhil_07 • 4.8k Followers", avatar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200", bio: "Food vlogger exploring thalis, street food, & desserts." },
  { name: "Sarafa Night Vlogs", email: "sarafa@demo.com", category: "Food & Cafes", location: "Indore", meta: "@the_taste_of_sarafa • 2.8k Followers", avatar: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=200", bio: "Dedicated night market food guide for Indore city." },
  { name: "Indori Plate Reviews", email: "plate@demo.com", category: "Food & Cafes", location: "Indore", meta: "@indori_plate • 3.3k Followers", avatar: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=200", bio: "Poha, jalebi, and authentic MP cuisine reviewer." },
  { name: "Riya Bakery Vlogs", email: "riya@demo.com", category: "Food & Cafes", location: "Indore", meta: "@bake_and_vlog_indore • 1.6k Followers", avatar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200", bio: "Home baker reviewing bakery items and dessert parlors." },
  { name: "Zayka Indore Ka", email: "zayka@demo.com", category: "Food & Cafes", location: "Indore", meta: "@zayka_indore_ka • 4.1k Followers", avatar: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=200", bio: "Local food explorer finding low-cost tasty spots." },

  // TECH (<= 5k)
  { name: "Indore Tech Reviews", email: "techreviews@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@indore_tech_reviews • 2.4k Followers", avatar: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200", bio: "Budget smartphone unboxing & gadget reviews in Hindi." },
  { name: "Hindi Tech Hacks", email: "techhacks@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@gadget_hacks_hindi • 3.9k Followers", avatar: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=200", bio: "Quick Android & PC shortcut tricks." },
  { name: "Unboxing Indore", email: "unboxing@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@unboxing_indore • 1.7k Followers", avatar: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=200", bio: "Unboxing earphones, smartwatches, & accessories." },
  { name: "Aman Tech & Builds", email: "amantech@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@tech_vlog_aman • 4.6k Followers", avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=200", bio: "Custom PC build guides & hardware testing." },
  { name: "Smartphone Tips MP", email: "smarttips@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@mobile_tricks_indore • 2.1k Followers", avatar: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&q=80&w=200", bio: "Mobile hidden features, battery hacks, & app suggestions." },
  { name: "Camera Gear Talks", email: "cameragear@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@camera_gear_talks • 3.2k Followers", avatar: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200", bio: "Camera gear testing, gimbal reviews, & lens guides." },
  { name: "Desk Setup Wars", email: "setupwars@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@setup_wars_india • 4.8k Followers", avatar: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&q=80&w=200", bio: "Aesthetic desk setup inspiration & RGB accessories." },
  { name: "Rohan App Reviews", email: "rohanapp@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@app_geek_vlogs • 1.3k Followers", avatar: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=200", bio: "Must-have productivity & AI app reviews." },
  { name: "Daily Tech Bytes", email: "dailytech@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@daily_tech_indore • 2.9k Followers", avatar: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=200", bio: "Short daily tech news updates and leaks." },
  { name: "Tech Student Vlogs", email: "techstudent@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "@code_and_gadgets • 3.5k Followers", avatar: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=200", bio: "Engineering student sharing laptop reviews & tech tips." },

  // FASHION (<= 5k)
  { name: "Indore Thrift Styling", email: "thriftstyle@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@thrift_style_indore • 3.6k Followers", avatar: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200", bio: "Budget shopping & thrift store outfit styling." },
  { name: "Fashion Vibes Indore", email: "fashionvibes@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@indori_fashion_vibes • 4.3k Followers", avatar: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=200", bio: "College outfit ideas, street style, & lookbooks." },
  { name: "Prachi OOTD", email: "prachi@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@outfit_inspo_prachi • 2.8k Followers", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200", bio: "Daily fit check, ethnic wear styling, & aesthetic reels." },
  { name: "Indore Streetwear", email: "streetwear@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@streetwear_indore • 1.9k Followers", avatar: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=200", bio: "Oversized t-shirts, sneakers, & urban fashion trends." },
  { name: "Traditional Styling MP", email: "ethnic@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@ethnic_wear_diaries • 3.1k Followers", avatar: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200", bio: "Festival and wedding outfit recommendations." },
  { name: "Grooming Tips Indore", email: "grooming@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@mens_grooming_indore • 2.5k Followers", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", bio: "Men's hair styling, beard care, & fashion hacks." },
  { name: "Srishti Lookbooks", email: "srishti@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@fashion_vlogs_srishti • 4.7k Followers", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200", bio: "Minimalistic aesthetic styling & seasonal fashion." },
  { name: "Budget Shopping MP", email: "budgetshop@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@budget_fashion_mp • 3.0k Followers", avatar: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=200", bio: "Finding outfits under ₹999 in Indore local markets." },
  { name: "Sneakerhead MP", email: "sneakerhead@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@sneaker_culture_indore • 2.2k Followers", avatar: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=200", bio: "Sneaker collection, cleaning tips, & styling reels." },
  { name: "Daily Fit Check", email: "fitcheck@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "@daily_fit_check_indore • 1.4k Followers", avatar: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=200", bio: "Quick college outfit reels & accessory styling." }
];

// Full 40 Brands List (Flex Gym & Fitness + 39 Brands)
const brandPartners = [
  // FITNESS BRANDS
  { name: "Flex Gym & Fitness", email: "business@collabsphere.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free 6-Mo Membership + ₹2,000 Reel Budget", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200", bio: "Premium gym facility in Indore looking for local workout vloggers and creators." },
  { name: "FitLine Nutrition Store", email: "fitline@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free Whey Protein Tub + Sponsored Posts", avatar: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=200", bio: "Supplement retail store sponsoring fitness creators." },
  { name: "PowerPulse Gym", email: "powerpulse@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free Gym Pass + Sponsored Story", avatar: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=200", bio: "Vijay Nagar branch offering gym passes for workout reels." },
  { name: "Core Crossfit Studio", email: "corecrossfit@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Complimentary 3-Mo Pass + Gym Wear", avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200", bio: "Crossfit training center looking for high-energy creators." },
  { name: "Zenith Yoga Center", email: "zenithyoga@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free Yoga Workshop + ₹1,500 Payout", avatar: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=200", bio: "Wellness studio promoting holistic health & yoga." },
  { name: "IronCore Gym Bhawarkua", email: "ironcore@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free Gym Membership + Supplement Discounts", avatar: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=200", bio: "Popular student gym seeking fitness influencers." },
  { name: "NutriFuel Meal Prep", email: "nutrifuel@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Free Healthy Meal Subscriptions", avatar: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=200", bio: "Healthy meal delivery service seeking fit lifestyle vloggers." },
  { name: "ProActive Activewear", email: "proactive@demo.com", category: "Fitness & Gym", location: "India", meta: "Perks: Free Gym Wear Outfit Haul", avatar: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=200", bio: "Fitness apparel brand sponsoring gym creators." },
  { name: "MuscleTech MP Retail", email: "muscletech@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: ₹3,000 Product Hamper", avatar: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&q=80&w=200", bio: "Authentic supplement retailer offering product hampers." },
  { name: "Calisthenics Park MP", email: "calisthenicsmp@demo.com", category: "Fitness & Gym", location: "Indore", meta: "Perks: Sponsored Event Pass + Merch", avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=200", bio: "Outdoor fitness community hosting street workout events." },

  // FOOD BRANDS
  { name: "The Gourmet Cafe", email: "gourmet@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Meal + ₹3,000 Paid Reel", avatar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200", bio: "Aesthetic cafe looking for food & lifestyle creators for reel reviews." },
  { name: "Roast & Brew Coffee", email: "roastbrew@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Brunch Voucher + Coffee Mug", avatar: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200", bio: "Specialty coffee shop sponsoring brunch vloggers." },
  { name: "Indore Bistro & Lounge", email: "indorebistro@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Complimentary Dinner for 2", avatar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200", bio: "Fine dining restaurant inviting local food bloggers." },
  { name: "Chai Kaapi Cafe", email: "chaikaapi@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Snack Platter + ₹1,500 Payout", avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200", bio: "Youthful tea & coffee hangout place in Bhawarkua." },
  { name: "The Waffle House", email: "wafflehouse@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Dessert Box + Story Voucher", avatar: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&q=80&w=200", bio: "Dessert parlor offering Belgian waffle hampers." },
  { name: "Saffron Fine Dining", email: "saffron@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: VIP Tasting Menu Voucher", avatar: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200", bio: "Authentic Indian cuisine restaurant inviting family vloggers." },
  { name: "Burger Craft Indore", email: "burgercraft@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Gourmet Burger Combo + Cash Perk", avatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200", bio: "Gourmet burger joint running reel promotion deals." },
  { name: "Slice & Co Pizza Bar", email: "sliceco@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Free Pizza Feast + Sponsored Reel", avatar: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=200", bio: "Woodfired pizza place collaborating with food reviewers." },
  { name: "The Green Bowl", email: "greenbowl@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: 1-Week Free Healthy Lunch", avatar: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200", bio: "Healthy salad bar partnering with fit food vloggers." },
  { name: "Sweet Tooth Bakery", email: "sweettooth@demo.com", category: "Food & Cafes", location: "Indore", meta: "Perks: Custom Birthday Cake + ₹2,000 Perk", avatar: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200", bio: "Artisanal cake shop seeking dessert reviewers." },

  // TECH BRANDS
  { name: "Indore Mobile Hub", email: "mobilehub@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Unboxing Unit + ₹2,000 Commission", avatar: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200", bio: "Retail store offering phone units for unboxing reels." },
  { name: "Gizmo Gadget Store", email: "gizmo@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Free Wireless Earbuds + Review Budget", avatar: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200", bio: "Electronics shop sponsoring audio gadget reviewers." },
  { name: "PC World Bhawarkua", email: "pcworld@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Accessories Bundle + Sponsored Video", avatar: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=200", bio: "Computer store sponsoring gaming & PC setup creators." },
  { name: "SmartTech Electronics", email: "smarttech@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Free Smartwatch for Review", avatar: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200", bio: "Wearable tech brand sponsoring tech vloggers." },
  { name: "Camera Rental Indore", email: "camerarental@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Free 2-Day Lens Rental Pass", avatar: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200", bio: "Equipment rental service offering passes for creator photography." },
  { name: "SoundBass Audio", email: "soundbass@demo.com", category: "Tech & Gadgets", location: "India", meta: "Perks: Free Bluetooth Speaker + Paid Reel", avatar: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=200", bio: "Audio brand sponsoring music & tech influencers." },
  { name: "Case & Cover Studio", email: "casecover@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: 5 Custom Phone Cases + Affiliate Link", avatar: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=200", bio: "Mobile accessories shop providing custom phone covers." },
  { name: "iZone Service", email: "izone@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Free Screen Guard + ₹1,000 Voucher", avatar: "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?auto=format&fit=crop&q=80&w=200", bio: "Repair & accessories hub promoting screen protection." },
  { name: "Gaming Rig MP", email: "gamingrig@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: Sponsored Gaming Chair/Setup", avatar: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?auto=format&fit=crop&q=80&w=200", bio: "Gaming store sponsoring streamer workstation setups." },
  { name: "ElectroHub MP", email: "electrohub@demo.com", category: "Tech & Gadgets", location: "Indore", meta: "Perks: ₹2,500 Product Review Gift Card", avatar: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=200", bio: "Home electronics shop sponsoring gadget reviewers." },

  // FASHION BRANDS
  { name: "Urban Threads Apparel", email: "urbanthreads@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Outfit Haul + ₹2,000 Commission", avatar: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200", bio: "Streetwear brand looking for fashion models & vloggers." },
  { name: "The Streetwear Club", email: "streetwearclub@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Hoodie & Oversized Tees", avatar: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=200", bio: "Oversized graphic apparel brand seeking influencers." },
  { name: "Ethnic Vogue Indore", email: "ethnicvogue@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Complimentary Festive Kurta Set", avatar: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200", bio: "Ethnic fashion store providing outfits for festive reels." },
  { name: "Kicks & Soles", email: "kickssoles@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Sneaker Care Kit + Discount Code", avatar: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=200", bio: "Sneaker boutique sponsoring urban fashion creators." },
  { name: "Velvet & Lace", email: "velvetlace@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Outfit for Reel Shoot", avatar: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=200", bio: "Womenswear boutique providing dresses for lookbooks." },
  { name: "Denim Culture MP", email: "denimculture@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Jacket & Jeans Pair", avatar: "https://images.unsplash.com/photo-1542272604-780c36856842?auto=format&fit=crop&q=80&w=200", bio: "Denim store collaborating with lifestyle vloggers." },
  { name: "Loom & Weave Handloom", email: "loomweave@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Traditional Saree Hamper", avatar: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=200", bio: "Handloom store partnering with saree styling vloggers." },
  { name: "Trendz Casual Wear", email: "trendz@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: ₹3,000 Gift Card", avatar: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=200", bio: "Casual wear clothing store sponsoring college creators." },
  { name: "Shades & Frames Eyewear", email: "shadesframes@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: 2 Free Sunglasses Pairs", avatar: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=200", bio: "Sunglasses retail shop sponsoring fashion influencers." },
  { name: "Chic Accessories Indore", email: "chicaccessories@demo.com", category: "Fashion & Lifestyle", location: "Indore", meta: "Perks: Free Jewelry Gift Box + Cash Perk", avatar: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=200", bio: "Fashion jewelry shop offering gift boxes for reels." }
];

async function seedDB() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🍃 Connected successfully!');

    // Clean old clutter from test runs
    await User.deleteMany({});
    await Deal.deleteMany({});
    await Creator.deleteMany({});
    await Brand.deleteMany({});

    // Populate collections
    await User.insertMany(dummyUsers);
    await Deal.insertMany(sampleDeals);
    await Creator.insertMany(nanoCreators);
    await Brand.insertMany(brandPartners);

    console.log(`🎉 Seeded Users, Sample Deals, ${nanoCreators.length} Creators (including Gagan Bagga), and ${brandPartners.length} Brands into MongoDB Atlas!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDB();