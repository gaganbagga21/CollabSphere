document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);
  injectQrModalHtml(); // Inject Payment QR Modal into DOM
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
      <div class="card-surface p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-lg">
        <div>
          <div class="flex items-center justify-between mb-2 gap-2">
            <h3 class="font-bold text-emerald-50 text-sm truncate">${deal.title}</h3>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
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

          <p class="text-xs text-slate-300 bg-[#080e10] p-3 rounded-xl border border-[#213236] my-2 italic break-words">
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
                <div class="flex flex-col sm:flex-row gap-2">
                  <input type="url" id="proofInput-${deal._id}" value="${deal.proofUrl || ''}" placeholder="https://instagram.com/reel/..." class="input-field flex-1 rounded-xl px-3 py-1.5 text-xs" />
                  <button class="submit-proof-btn btn-mint px-3 py-1.5 rounded-xl text-xs font-bold" data-id="${deal._id}">Submit</button>
                </div>
              ` : `
                <div class="flex items-center justify-between text-xs gap-2">
                  <a href="${deal.proofUrl || '#'}" target="_blank" class="text-emerald-400 hover:underline truncate max-w-[180px]">
                    ${deal.proofUrl ? deal.proofUrl : 'No link submitted yet'}
                  </a>
                  ${deal.proofUrl && deal.proofStatus !== 'verified' ? `
                    <button class="verify-proof-btn bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0" data-id="${deal._id}">
                      Verify Proof
                    </button>
                  ` : deal.proofStatus === 'verified' ? `
                    <span class="text-emerald-400 font-bold text-[10px] flex items-center gap-1 shrink-0"><i data-lucide="check" class="w-3 h-3"></i> Verified</span>
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
            <div class="flex flex-col sm:flex-row items-center gap-2 mt-2">
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
              <!-- OPTION 1: DIRECT RELEASE FROM TRACKER TRIGGERS PAYMENT QR MODAL -->
              <button class="release-payout-qr-btn w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer" 
                data-id="${deal._id}" 
                data-amount="${deal.escrowAmount || 5000}" 
                data-recipient="${deal.creatorName}">
                <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Release Escrow Payout (Scan QR)
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

  // ATTACH QR PAYMENT MODAL TO RELEASE BUTTON
  container.querySelectorAll('.release-payout-qr-btn').forEach(btn => {
    btn.onclick = (e) => {
      const buttonEl = e.currentTarget;
      const id = buttonEl.getAttribute('data-id');
      const amount = buttonEl.getAttribute('data-amount');
      const recipient = buttonEl.getAttribute('data-recipient');
      openPaymentQrModal(id, amount, recipient, user);
    };
  });

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

      if (typeof Toastify !== 'undefined') {
        Toastify({
          text: "💸 Payment release requested from brand!",
          duration: 3000,
          style: { background: "linear-gradient(to right, #059669, #10b981)" }
        }).showToast();
      }

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

// INJECT MODAL HTML INTO DOM
function injectQrModalHtml() {
  if (document.getElementById('qrPaymentModal')) return;

  const modalHtml = `
    <div id="qrPaymentModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden p-4">
      <div class="bg-[#080e10] border border-[#213236] p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl relative">
        <button id="closeQrModalBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold">✕</button>
        
        <div class="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="qr-code" class="w-6 h-6"></i>
        </div>

        <h3 class="font-black text-lg text-emerald-50">Release Escrow Payout</h3>
        <p class="text-xs text-slate-400 mt-1" id="qrRecipientText">Payout to Creator</p>

        <div class="bg-white p-4 rounded-2xl my-4 inline-block shadow-inner">
          <img id="upiQrImage" src="" class="w-44 h-44 mx-auto rounded-lg" alt="UPI Payment QR Code" />
        </div>

        <div class="bg-[#030809] border border-[#213236] p-3 rounded-xl mb-4">
          <p class="text-[10px] text-slate-500 uppercase font-bold">Fixed Escrow Amount</p>
          <p class="text-xl font-black text-emerald-400" id="qrAmountText">₹5,000</p>
        </div>

        <button id="confirmQrPayoutBtn" class="w-full btn-mint py-3 rounded-xl text-xs font-black tracking-wide shadow-lg active:scale-95 transition">
          ✅ Confirm Payout & Release Funds
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('closeQrModalBtn').onclick = () => {
    document.getElementById('qrPaymentModal').classList.add('hidden');
  };
}

// OPEN QR POPUP & GENERATE DYNAMIC DEDICATED UPI QR
function openPaymentQrModal(dealId, amount, recipientName, user) {
  const modal = document.getElementById('qrPaymentModal');
  const qrImage = document.getElementById('upiQrImage');
  const amountText = document.getElementById('qrAmountText');
  const recipientText = document.getElementById('qrRecipientText');
  const confirmBtn = document.getElementById('confirmQrPayoutBtn');

  if (!modal) return;

  const upiId = "collabsphere@upi"; // Replace with your merchant/escrow UPI ID
  const formattedAmount = Number(amount || 5000);
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&am=${formattedAmount}&cu=INR&tn=Escrow%20Payout`;
  
  // Uses free QR Code API to generate a scanable UPI QR
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  amountText.textContent = `₹${formattedAmount.toLocaleString('en-IN')}`;
  recipientText.textContent = `Payee: ${recipientName}`;

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();

  confirmBtn.onclick = async () => {
    confirmBtn.innerHTML = `Releasing Payout...`;
    await changeDealStatus(dealId, 'completed', user);
    modal.classList.add('hidden');
    confirmBtn.innerHTML = `✅ Confirm Payout & Release Funds`;
  };
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
      if (typeof Toastify !== 'undefined') {
        Toastify({
          text: `🎉 Escrow Payout Released & Campaign Completed!`,
          duration: 3000,
          gravity: "bottom",
          position: "right",
          style: { background: "linear-gradient(to right, #059669, #10b981)", borderRadius: "12px" }
        }).showToast();
      }

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
      if (typeof Toastify !== 'undefined') {
        Toastify({
          text: "🗑️ Deal request cancelled.",
          duration: 2500,
          gravity: "bottom",
          position: "right",
          style: { background: "linear-gradient(to right, #dc2626, #ef4444)", borderRadius: "12px" }
        }).showToast();
      }

      loadTrackerDeals(user);
    }
  } catch (err) {
    console.error('Error deleting deal:', err);
  }
}