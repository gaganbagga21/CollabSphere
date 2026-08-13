document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);
  loadTrackerDeals(user);
});

async function loadTrackerDeals(user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals?userEmail=${encodeURIComponent(user.email)}`);
    const data = await res.json();

    if (data.success) {
      const deals = data.deals || [];

      const pending = deals.filter(d => d.status === 'pending');
      const active = deals.filter(d => d.status === 'accepted');
      const completed = deals.filter(d => d.status === 'completed');

      const pCount = document.getElementById('pendingCount');
      const aCount = document.getElementById('activeCount');
      const cCount = document.getElementById('completedCount');

      if (pCount) pCount.textContent = pending.length;
      if (aCount) aCount.textContent = active.length;
      if (cCount) cCount.textContent = completed.length;

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

          <p class="text-xs text-slate-300 bg-[#080e10] p-3 rounded-xl border border-[#213236] my-2 italic">
            "${deal.perks}"
          </p>

          <div class="bg-[#080e10] p-2.5 rounded-xl border border-[#213236] my-3">
            <div class="flex justify-between items-center text-[11px] mb-1">
              <span class="text-slate-400 font-bold flex items-center gap-1">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i> Escrow Vault: ₹${deal.escrowAmount || 5000}
              </span>
              <span class="text-emerald-300 font-bold uppercase text-[10px]">${deal.escrowStatus || 'funded'}</span>
            </div>
            <div class="w-full bg-[#142124] h-1.5 rounded-full overflow-hidden border border-[#213236]">
              <div class="bg-emerald-400 h-full ${
                deal.escrowStatus === 'released' ? 'w-full' : 
                deal.escrowStatus === 'requested' ? 'w-3/4' : 'w-1/2'
              } transition-all duration-500"></div>
            </div>
          </div>

          ${type === 'active' ? `
            <div class="bg-[#080e10] p-3 rounded-xl border border-[#213236] mb-3">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <i data-lucide="link" class="w-3 h-3 text-emerald-400"></i> Deliverable Proof Link
              </p>
              ${user.role === 'creator' ? `
                <div class="flex gap-2">
                  <input type="url" id="proofInput-${deal._id}" value="${deal.proofUrl || ''}" placeholder="https://instagram.com/reel/..." class="input-field flex-1 rounded-xl px-3 py-1.5 text-xs" />
                  <button class="submit-proof-btn btn-mint px-3 py-1.5 rounded-xl text-xs font-bold" data-id="${deal._id}">Submit</button>
                </div>
              ` : `
                <div class="flex items-center justify-between text-xs">
                  <a href="${deal.proofUrl || '#'}" target="_blank" class="text-emerald-400 hover:underline truncate max-w-[200px]">
                    ${deal.proofUrl ? deal.proofUrl : 'No link submitted yet'}
                  </a>
                  ${deal.proofUrl && deal.proofStatus !== 'verified' ? `
                    <button class="verify-proof-btn bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold" data-id="${deal._id}">
                      Verify Proof
                    </button>
                  ` : deal.proofStatus === 'verified' ? `
                    <span class="text-emerald-400 font-bold text-[10px] flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Verified</span>
                  ` : ''}
                </div>
              `}
            </div>
          ` : ''}
        </div>

        ${type === 'pending' ? (
          isSender ? `
            <div class="flex items-center gap-2 mt-2">
              <div class="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                Pending Approval
              </div>
              <button type="button" class="delete-deal-btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold py-2 px-3 rounded-xl text-xs transition active:scale-95 flex items-center gap-1 cursor-pointer" data-id="${deal._id}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i> Cancel
              </button>
            </div>
          ` : `
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
          <div class="space-y-2 mt-2">
            ${user.role === 'creator' ? `
              ${deal.escrowStatus === 'released' ? `
                <button class="creator-review-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1" data-id="${deal._id}" data-partner="${deal.businessId}">
                  <i data-lucide="star" class="w-3.5 h-3.5"></i> Review Partner & Finish Deal
                </button>
              ` : `
                <button class="request-payment-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5" data-id="${deal._id}">
                  <i data-lucide="arrow-down-left" class="w-3.5 h-3.5"></i> Request Payment Release
                </button>
              `}
            ` : `
              <button class="tracker-action-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1" data-id="${deal._id}" data-status="completed" data-partner="${deal.creatorId}">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Release Escrow Payout
              </button>
            `}
          </div>
        ` : `
          <div class="text-center text-[11px] text-emerald-300 font-semibold mt-2 flex items-center justify-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-teal-400"></i> Campaign Completed & Escrow Released
          </div>
        `}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();

  container.querySelectorAll('.tracker-action-btn').forEach(btn => {
    btn.onclick = (e) => {
      const buttonEl = e.currentTarget;
      const id = buttonEl.getAttribute('data-id');
      const nextStatus = buttonEl.getAttribute('data-status');
      changeDealStatus(id, nextStatus, user);
    };
  });

  container.querySelectorAll('.request-payment-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const dealId = e.currentTarget.getAttribute('data-id');
      await fetch(`http://localhost:5000/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowStatus: 'requested' })
      });

      Toastify({
        text: "💸 Payment release requested!",
        duration: 3000,
        style: { background: "linear-gradient(to right, #059669, #10b981)" }
      }).showToast();

      loadTrackerDeals(user);
    };
  });

  container.querySelectorAll('.delete-deal-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const dealId = e.currentTarget.getAttribute('data-id');
      if (dealId) {
        deleteDealRequest(dealId, user);
      }
    };
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
        duration: 2500,
        gravity: "bottom",
        position: "right",
        style: {
          background: status === 'declined' ? "linear-gradient(to right, #dc2626, #ef4444)" : "linear-gradient(to right, #059669, #10b981)",
          borderRadius: "12px"
        }
      }).showToast();

      loadTrackerDeals(user);
    }
  } catch (err) {
    console.error('Error changing status:', err);
  }
}

async function deleteDealRequest(dealId, user) {
  try {
    const res = await fetch(`http://localhost:5000/api/deals/${dealId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      Toastify({
        text: "🗑️ Deal request cancelled.",
        duration: 2500,
        gravity: "bottom",
        position: "right",
        style: { background: "linear-gradient(to right, #dc2626, #ef4444)", borderRadius: "12px" }
      }).showToast();

      loadTrackerDeals(user);
    }
  } catch (err) {
    console.error('Error deleting deal:', err);
  }
}