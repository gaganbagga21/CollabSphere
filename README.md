# CollabSphere

A full-stack collaboration platform connecting brands with content creators for influencer marketing, campaign matchmaking, and performance tracking.

---

## 🌟 Features

* **🤝 Brand-Creator Matchmaker (`matchmaker.html`)**: Connects brands with creators based on niche, target audience, and campaign requirements.
* **📊 Campaign Dashboard (`dashboard.html`)**: Provides a centralized hub to monitor active sponsorships, pending pitches, and media kits.
* **⏱️ Collaboration Tracker (`tracker.html`)**: Tracks campaign deliverables, content deadlines, and deal milestones.
* **👤 Creator & Brand Profiles (`profile.html`)**: Allows creators to highlight their portfolio/stats and brands to list their campaign needs.
* **🔐 Secure Backend & Authentication (`server.js`)**: Node.js/Express server handling session management and environment configuration.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ORM)
* **Configuration**: `.env` environment setup & `seed.js` database seeding script

---

## 📁 Repository Structure
.
├── backend/
│   ├── node_modules/       # Node.js dependencies
│   ├── .env                # Environment variables
│   ├── package.json        # Backend dependencies & scripts
│   ├── package-lock.json   # Lockfile for dependency tree
│   ├── seed.js             # Database seeding script
│   └── server.js           # Express server entry point
└── frontend/
├── css/                # Stylesheets
├── js/                 # Client-side scripts
├── dashboard.html      # User dashboard view
├── index.html          # Landing page
├── login.html          # Authentication page
├── matchmaker.html     # Matchmaking interface
├── profile.html        # User profile page
└── tracker.html        # Activity tracker page

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* `npm`

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/gaganbagga21/CollabSphere.git](https://github.com/gaganbagga21/CollabSphere.git)
   cd CollabSphere

2. **Configure the Backend**:
   ```bash
   cd backend
   npm install

3. **Run the Backend Server**:
   ```bash
   node server.js

4. **Launch the FrontEnd**:
    Open frontend/login.html in your web browser (or use the VS Code Live Server extension).

✍️ Author
Gagan Preet Singh Bagga
[GitHub Profile](https://github.com/gaganbagga21)
