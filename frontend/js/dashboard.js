document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  const userNameEl = document.getElementById('userName');
  const roleBadge = document.getElementById('userRoleBadge');
  if (userNameEl) userNameEl.textContent = user.name;
  
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  loadDashboardData(user);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }
});

async function loadDashboardData(user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals/notifications?userEmail=${user.email}&userRole=${user.role}`);
    const data = await res.json();

    if (data.success) {
      if (data.stats) {
        document.getElementById('statTotalDeals').textContent = data.stats.total || 0;
        document.getElementById('statActiveDeals').textContent = data.stats.active || 0;
        document.getElementById('statCompletedDeals').textContent = data.stats.completed || 0;
      }

      const notifContainer = document.getElementById('notificationsContainer');
      if (!notifContainer) return;

      if (data.deals && data.deals.length > 0) {
        notifContainer.innerHTML = `
          <div class="card-surface p-6 rounded-2xl border border-amber-500/30">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-bold text-amber-300 flex items-center gap-2">
                <i data-lucide="bell" class="w-4 h-4 text-amber-300"></i>
                Pending Actions (${data.deals.length})
              </h2>
              <a href="tracker.html" class="text-[11px] text-slate-400 hover:text-white underline">View all in Tracker</a>
            </div>

            <div class="space-y-3">
              ${data.deals.map(deal => `
                <div class="bg-[#080e10] p-4 rounded-xl border border-[#213236] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 class="font-bold text-emerald-50 text-xs">${deal.title}</h3>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      From: <span class="text-emerald-300 font-semibold">${user.role === 'creator' ? deal.businessName : deal.creatorName}</span>
                    </p>
                    <p class="text-[11px] text-slate-300 mt-1 italic">"${deal.perks}"</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button class="accept-btn bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1" data-id="${deal._id}">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i> Accept
                    </button>
                    <button class="decline-btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1" data-id="${deal._id}">
                      <i data-lucide="x" class="w-3.5 h-3.5"></i> Decline
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        if (window.lucide) lucide.createIcons();

        document.querySelectorAll('.accept-btn').forEach(btn => {
          btn.addEventListener('click', (e) => updateDealStatus(e.target.closest('button').getAttribute('data-id'), 'accepted', user));
        });

        document.querySelectorAll('.decline-btn').forEach(btn => {
          btn.addEventListener('click', (e) => updateDealStatus(e.target.closest('button').getAttribute('data-id'), 'declined', user));
        });

      } else {
        notifContainer.innerHTML = `
          <div class="card-surface p-6 rounded-2xl text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
            You're all caught up! No pending deal requests at the moment.
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

async function updateDealStatus(dealId, newStatus, user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (data.success) {
      Toastify({
        text: `Deal status updated to "${newStatus}"!`,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
          background: newStatus === 'accepted' 
            ? "linear-gradient(to right, #059669, #10b981)" 
            : "linear-gradient(to right, #dc2626, #ef4444)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "13px"
        }
      }).showToast();

      loadDashboardData(user);
    }
  } catch (err) {
    console.error('Error updating status:', err);

    Toastify({
      text: "Failed to update deal status.",
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