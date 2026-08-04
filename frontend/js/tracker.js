document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  // 1. Navigation Role Badge
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  loadTrackerDeals(user);

  // Sign Out
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }
});

async function loadTrackerDeals(user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals?userEmail=${user.email}`);
    const data = await res.json();

    if (data.success) {
      const deals = data.deals || [];

      const pending = deals.filter(d => d.status === 'pending');
      const active = deals.filter(d => d.status === 'accepted');
      const completed = deals.filter(d => d.status === 'completed');

      const pendingCountEl = document.getElementById('pendingCount');
      const activeCountEl = document.getElementById('activeCount');
      const completedCountEl = document.getElementById('completedCount');

      if (pendingCountEl) pendingCountEl.textContent = pending.length;
      if (activeCountEl) activeCountEl.textContent = active.length;
      if (completedCountEl) completedCountEl.textContent = completed.length;

      renderCategory('pendingDealsList', pending, user, 'pending');
      renderCategory('activeDealsList', active, user, 'active');
      renderCategory('completedDealsList', completed, user, 'completed');
    }
  } catch (err) {
    console.error('Error fetching tracker deals:', err);
  }
}

function renderCategory(containerId, dealsList, user, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (dealsList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full card-surface p-5 rounded-2xl text-slate-400 text-xs">
        No deals currently in this status.
      </div>
    `;
    return;
  }

  container.innerHTML = dealsList.map(deal => {
    const isSender = (user.role === deal.senderRole);

    return `
      <div class="card-surface p-5 rounded-2xl flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-emerald-50 text-sm">${deal.title}</h3>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              type === 'pending' ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' :
              type === 'active' ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' :
              'bg-teal-400/10 text-teal-300 border border-teal-400/20'
            }">
              ${deal.status}
            </span>
          </div>

          <p class="text-xs text-slate-400">
            Partner: <span class="text-emerald-300 font-semibold">${user.role === 'creator' ? deal.businessName : deal.creatorName}</span>
          </p>
          <p class="text-xs text-slate-300 bg-[#080e10] p-3 rounded-xl border border-[#213236] my-3 italic">
            "${deal.perks}"
          </p>
        </div>

        ${type === 'pending' ? (
          isSender ? `
            <!-- SENDER VIEW: 'Pending Approval' + 'Cancel Request' Button -->
            <div class="flex items-center gap-2 mt-2">
              <div class="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                Pending Approval
              </div>
              <button class="delete-deal-btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold py-2 px-3 rounded-xl text-xs transition active:scale-95 flex items-center gap-1" data-id="${deal._id}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                Cancel
              </button>
            </div>
          ` : `
            <!-- RECEIVER VIEW: Accept / Decline Buttons -->
            <div class="flex items-center gap-2 mt-2">
              <button class="tracker-action-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1" data-id="${deal._id}" data-status="accepted">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Accept Deal
              </button>
              <button class="tracker-action-btn w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1" data-id="${deal._id}" data-status="declined">
                <i data-lucide="x" class="w-3.5 h-3.5"></i> Decline
              </button>
            </div>
          `
        ) : type === 'active' ? `
          <button class="tracker-action-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 mt-2 flex items-center justify-center gap-1" data-id="${deal._id}" data-status="completed">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Mark Complete
          </button>
        ` : `
          <div class="text-center text-[11px] text-emerald-300 font-semibold mt-2 flex items-center justify-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-teal-400"></i> Campaign Completed
          </div>
        `}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();

  // Attach status change listener (Accept / Decline / Complete)
  document.querySelectorAll('.tracker-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const buttonEl = e.target.closest('button');
      const id = buttonEl.getAttribute('data-id');
      const nextStatus = buttonEl.getAttribute('data-status');
      changeDealStatus(id, nextStatus, user);
    });
  });

  // Attach delete / cancel request listener
  document.querySelectorAll('.delete-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const buttonEl = e.target.closest('button');
      const id = buttonEl.getAttribute('data-id');
      deleteDealRequest(id, user);
    });
  });
}

async function changeDealStatus(dealId, status, user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (data.success) {
      Toastify({
        text: `Deal status updated to "${status}"!`,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
          background: status === 'declined' 
            ? "linear-gradient(to right, #dc2626, #ef4444)" 
            : "linear-gradient(to right, #059669, #10b981)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "13px"
        }
      }).showToast();

      loadTrackerDeals(user);
    }
  } catch (err) {
    console.error('Error changing deal status:', err);
  }
}

async function deleteDealRequest(dealId, user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (data.success) {
      Toastify({
        text: "🗑️ Deal request cancelled and removed.",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "linear-gradient(to right, #dc2626, #ef4444)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "13px"
        }
      }).showToast();

      loadTrackerDeals(user);
    }
  } catch (err) {
    console.error('Error deleting deal:', err);
  }
}