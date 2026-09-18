// Dynamic Base API endpoint resolution
const RENDER_DOMAIN = 'collabsphere-rldj.onrender.com';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : `https://${RENDER_DOMAIN}`;

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  const roleBadge = document.getElementById('userRoleBadge');
  const searchTitle = document.getElementById('searchTitle');
  const searchInput = document.getElementById('searchInput');

  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  if (searchTitle) {
    searchTitle.innerHTML = user.role === 'business'
      ? '<i data-lucide="compass" class="w-6 h-6 text-emerald-400"></i> Discover & Match Creators'
      : '<i data-lucide="compass" class="w-6 h-6 text-emerald-400"></i> Discover & Match Brand Sponsorships';
  }

  runMatchmaker(user, 'all');

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.onclick = () => {
      const query = searchInput ? searchInput.value.trim() : 'all';
      runMatchmaker(user, query || 'all');
    };
  }

  if (searchInput) {
    searchInput.onkeyup = (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        runMatchmaker(user, query || 'all');
      }
    };
  }
});

async function runMatchmaker(user, query) {
  const resultsGrid = document.getElementById('resultsGrid');
  if (resultsGrid) {
    resultsGrid.innerHTML = `
      <div class="col-span-full card-surface p-8 rounded-2xl text-center text-slate-400 text-xs animate-pulse flex flex-col items-center gap-2">
        <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-emerald-400"></i>
        Finding best potential matches for your account...
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch(`${API_BASE}/api/matchmaker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, userRole: user.role })
    });

    const data = await res.json();
    renderResults(data.results || [], user);
  } catch (err) {
    console.error('Matchmaker fetch error:', err);
    if (resultsGrid) {
      resultsGrid.innerHTML = `
        <div class="col-span-full card-surface p-8 rounded-2xl text-center text-rose-400 text-xs flex flex-col items-center gap-2">
          <i data-lucide="alert-circle" class="w-6 h-6 text-rose-400"></i>
          Failed to load directory. Please refresh or check server connection.
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }
}

function renderResults(candidates, user) {
  const resultsGrid = document.getElementById('resultsGrid');
  if (!resultsGrid) return;

  if (candidates.length === 0) {
    resultsGrid.innerHTML = `
      <div class="col-span-full card-surface p-8 rounded-2xl text-center text-slate-400 text-xs flex flex-col items-center gap-2">
        <i data-lucide="search-x" class="w-8 h-8 text-slate-500"></i>
        No profiles found matching your query.
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const defaultBtnText = user.role === 'creator' ? 'Pitch Collaboration' : 'Send Deal Invitation';

  resultsGrid.innerHTML = candidates.map((c, index) => `
    <div class="card-surface p-5 rounded-2xl flex flex-col justify-between shadow-lg">
      <div>
        <div class="flex items-start gap-3.5 mb-3">
          <img src="${c.avatar || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200'}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm" />
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-emerald-50 text-sm">${c.name || 'Partner'}</h3>
              <span class="bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                <i data-lucide="zap" class="w-3 h-3 text-emerald-400"></i>
                ${c.match || 95}% Match
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3 h-3 text-slate-500"></i>
              ${c.category || 'Niche'} • ${c.location || 'Indore'}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 bg-[#080e10] p-2 rounded-xl border border-[#213236] my-3 text-center">
          <div>
            <p class="text-[9px] text-slate-500 uppercase font-bold">Engagement</p>
            <p class="text-xs font-bold text-emerald-400">${c.engagementRate || '4.8%'}</p>
          </div>
          <div>
            <p class="text-[9px] text-slate-500 uppercase font-bold">Avg Likes</p>
            <p class="text-xs font-bold text-slate-200">${c.avgLikes || '1.2k'}</p>
          </div>
          <div>
            <p class="text-[9px] text-slate-500 uppercase font-bold">Audience</p>
            <p class="text-xs font-bold text-teal-300 truncate">${c.topAudience || 'Indore'}</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 bg-[#080e10] p-3 rounded-xl border border-[#213236] mb-4 italic flex items-start gap-2">
          <i data-lucide="quote" class="w-4 h-4 text-emerald-400/60 shrink-0"></i>
          "${c.bio || 'No bio provided.'}"
        </p>
      </div>

      <div class="space-y-2">
        <button 
          type="button"
          class="ai-gen-btn w-full bg-[#080e10] hover:bg-[#1c2e32] text-emerald-300 border border-emerald-400/30 py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          data-index="${index}"
        >
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-400"></i>
          Generate AI ${user.role === 'creator' ? 'Pitch' : 'Brief'}
        </button>

        <button 
          type="button"
          class="deal-action-btn w-full btn-mint py-2 px-3 rounded-xl shadow-md text-xs active:scale-95 flex items-center justify-center gap-2 font-bold cursor-pointer"
          data-index="${index}"
        >
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
          ${c.btnText || defaultBtnText}
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();

  // AI Pitch Generator Button Handler
  document.querySelectorAll('.ai-gen-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const buttonEl = e.currentTarget;
      const idx = buttonEl.getAttribute('data-index');
      const candidate = candidates[idx];

      if (!candidate) return;

      buttonEl.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Generating Pitch...`;
      if (window.lucide) lucide.createIcons();

      try {
        const res = await fetch(`${API_BASE}/api/ai/generate-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: user.role === 'creator' ? 'pitch' : 'brief',
            recipientName: candidate.name || 'Partner',
            category: candidate.category || 'General',
            followerCount: candidate.meta || '2.5k'
          })
        });

        const data = await res.json();
        if (data && data.success && data.text) {
          candidate.aiCustomNotes = data.text;
          
          Toastify({
            text: `✨ AI Pitch Attached! Click Send.`,
            duration: 3000,
            style: { background: "linear-gradient(to right, #059669, #10b981)", borderRadius: "12px" }
          }).showToast();

          buttonEl.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> Pitch Attached`;
          if (window.lucide) lucide.createIcons();
        }
      } catch (err) {
        buttonEl.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Retry AI Generator`;
        if (window.lucide) lucide.createIcons();
      }
    };
  });

  // Deal Action Handler
  document.querySelectorAll('.deal-action-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      const targetAccount = candidates[idx];
      if (targetAccount) {
        sendDealRequest(targetAccount, user);
      }
    };
  });
}

async function sendDealRequest(targetAccount, user) {
  const payload = {
    businessId: user.role === 'business' ? user.email : targetAccount.email,
    businessName: user.role === 'business' ? user.name : targetAccount.name,
    creatorId: user.role === 'creator' ? user.email : targetAccount.email,
    creatorName: user.role === 'creator' ? user.name : targetAccount.name,
    senderRole: user.role,
    title: user.role === 'business' 
      ? `Campaign Offer from ${user.name}`
      : `Collaboration Pitch from ${user.name}`,
    perks: targetAccount.aiCustomNotes || targetAccount.meta || 'Sponsorship Perk',
    notes: `Sent via CollabSphere Matchmaker by ${user.name}`
  };

  try {
    const res = await fetch(`${API_BASE}/api/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      Toastify({
        text: `Deal request sent to ${targetAccount.name}! Check your Tracker.`,
        duration: 3500,
        gravity: "bottom",
        position: "right",
        style: {
          background: "linear-gradient(to right, #059669, #10b981)",
          borderRadius: "12px",
          fontWeight: "600"
        }
      }).showToast();
    }
  } catch (err) {
    console.error('Error sending deal request:', err);
  }
}