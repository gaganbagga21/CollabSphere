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
  const suggestionsBox = document.getElementById('suggestionsBox');
  const resultsGrid = document.getElementById('resultsGrid');

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

  if (searchInput) {
    searchInput.placeholder = user.role === 'business'
      ? "Filter creators (e.g. 'fitness', 'Gagan', 'food')..."
      : "Filter brands (e.g. 'Flex Gym', 'cafe', 'membership')...";
  }

  runMatchmaker(user, 'all');

  let cachedCandidates = [];

  fetch('http://localhost:5000/api/matchmaker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'all', userRole: user.role })
  })
  .then(res => res.json())
  .then(data => { cachedCandidates = data.results || []; })
  .catch(err => console.error('Error fetching suggestions cache:', err));

  if (searchInput && suggestionsBox) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      if (query.length === 0) {
        suggestionsBox.classList.add('hidden');
        resultsGrid.classList.remove('hidden');
        runMatchmaker(user, 'all');
        return;
      }

      resultsGrid.classList.add('hidden');

      const matches = cachedCandidates.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.category && c.category.toLowerCase().includes(query)) ||
        (c.meta && c.meta.toLowerCase().includes(query))
      ).slice(0, 5);

      if (matches.length > 0) {
        suggestionsBox.innerHTML = matches.map(c => `
          <div 
            class="suggestion-item p-3 hover:bg-[#1c2e32] cursor-pointer transition flex items-center justify-between"
            data-value="${c.name}"
          >
            <div class="flex items-center gap-2.5">
              <img src="${c.avatar || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200'}" class="w-7 h-7 rounded-lg object-cover" />
              <div>
                <p class="text-xs font-bold text-emerald-50">${c.name}</p>
                <p class="text-[10px] text-slate-400">${c.category || 'Niche'}</p>
              </div>
            </div>
            <span class="text-[10px] text-emerald-300 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full">
              ${c.meta || 'Select'}
            </span>
          </div>
        `).join('');

        suggestionsBox.classList.remove('hidden');

        document.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            const selectedVal = item.getAttribute('data-value');
            searchInput.value = selectedVal;
            suggestionsBox.classList.add('hidden');
            resultsGrid.classList.remove('hidden');
            runMatchmaker(user, selectedVal);
          });
        });
      } else {
        suggestionsBox.innerHTML = `
          <div class="p-3 text-xs text-slate-400 text-center italic">
            Press Filter to search for "${e.target.value}"
          </div>
        `;
        suggestionsBox.classList.remove('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
        if (resultsGrid.classList.contains('hidden')) {
          resultsGrid.classList.remove('hidden');
        }
      }
    });
  }

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput ? searchInput.value.trim() : 'all';
      if (suggestionsBox) suggestionsBox.classList.add('hidden');
      if (resultsGrid) resultsGrid.classList.remove('hidden');
      runMatchmaker(user, query || 'all');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }
});

async function runMatchmaker(user, query) {
  try {
    const res = await fetch('http://localhost:5000/api/matchmaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, userRole: user.role })
    });

    const data = await res.json();
    renderResults(data.results || [], user);

  } catch (err) {
    console.error('Matchmaker execution error:', err);
  }
}

function renderResults(candidates, user) {
  const resultsGrid = document.getElementById('resultsGrid');
  if (!resultsGrid) return;

  if (candidates.length === 0) {
    resultsGrid.innerHTML = `
      <div class="col-span-full card-surface p-8 rounded-2xl text-center text-slate-400 text-xs flex flex-col items-center gap-2">
        <i data-lucide="search-x" class="w-8 h-8 text-slate-500"></i>
        No accounts found matching your query.
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
              <h3 class="font-bold text-emerald-50 text-sm">${c.name}</h3>
              <span class="bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                <i data-lucide="zap" class="w-3 h-3 text-emerald-400"></i>
                ${c.match}% Match
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3 h-3 text-slate-500"></i>
              ${c.category || 'Niche'} • ${c.location || 'Indore'}
            </p>
            <p class="text-[11px] font-semibold text-emerald-300 mt-0.5 flex items-center gap-1">
              <i data-lucide="tag" class="w-3 h-3 text-emerald-400"></i>
              ${c.meta || ''}
            </p>
          </div>
        </div>

        <p class="text-xs text-slate-300 bg-[#080e10] p-3 rounded-xl border border-[#213236] mb-4 italic flex items-start gap-2">
          <i data-lucide="quote" class="w-4 h-4 text-emerald-400/60 shrink-0"></i>
          "${c.bio || 'No bio provided.'}"
        </p>
      </div>

      <button 
        class="deal-action-btn w-full btn-mint py-2 px-3 rounded-xl shadow-md text-xs active:scale-95 flex items-center justify-center gap-2"
        data-index="${index}"
      >
        <i data-lucide="send" class="w-3.5 h-3.5"></i>
        ${c.btnText || defaultBtnText}
      </button>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();

  document.querySelectorAll('.deal-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.closest('button').getAttribute('data-index');
      const targetAccount = candidates[idx];
      sendDealRequest(targetAccount, user);
    });
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
    perks: targetAccount.meta || 'Sponsorship Perk',
    notes: `Sent via CollabSphere Matchmaker by ${user.name}`
  };

  try {
    const res = await fetch('http://localhost:5000/api/deals', {
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
          fontWeight: "600",
          fontSize: "13px"
        }
      }).showToast();
    }
  } catch (err) {
    console.error('Error sending deal request:', err);

    Toastify({
      text: "Failed to send deal request. Please try again.",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "linear-gradient(to right, #dc2626, #ef4444)",
        borderRadius: "12px",
        fontSize: "13px"
      }
    }).showToast();
  }
}