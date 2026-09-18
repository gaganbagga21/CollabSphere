// Base API & WebSocket endpoint configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://collabsphere-rldj.onrender.com';

const WS_BASE = window.location.protocol === 'https:'
  ? 'wss://collabsphere-rldj.onrender.com'
  : `ws://${window.location.hostname || 'localhost'}:5000`;

let socket = null;

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name || 'User';

  injectQrModalHtml();
  loadDashboardData(user);

  // Initialize Real-Time WebSocket Connection
  initWebSocket(user);

  // AI Assistant Drawer Controls
  const openAiBotBtn = document.getElementById('openAiBotBtn');
  const closeAiBotBtn = document.getElementById('closeAiBotBtn');
  const aiBotModal = document.getElementById('aiBotModal');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatLog = document.getElementById('aiChatLog');

  if (openAiBotBtn && aiBotModal) {
    openAiBotBtn.onclick = () => aiBotModal.classList.toggle('hidden');
  }

  if (closeAiBotBtn && aiBotModal) {
    closeAiBotBtn.onclick = () => aiBotModal.classList.add('hidden');
  }

  if (aiChatForm) {
    aiChatForm.onsubmit = async (e) => {
      e.preventDefault();
      const inputEl = document.getElementById('aiInput');
      const query = inputEl ? inputEl.value.trim() : '';
      if (!query) return;

      const userBubble = document.createElement('div');
      userBubble.className = 'bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-200 text-right font-medium mb-2.5 text-xs';
      userBubble.textContent = query;
      aiChatLog.appendChild(userBubble);

      inputEl.value = '';
      aiChatLog.scrollTop = aiChatLog.scrollHeight;

      const loadingId = `load-${Date.now()}`;
      aiChatLog.innerHTML += `
        <div id="${loadingId}" class="bg-[#080e10] p-3 rounded-xl border border-[#213236] text-slate-400 flex items-center gap-2 mb-2.5 text-xs">
          <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin text-emerald-400"></i> Formulating strategy...
        </div>
      `;
      if (window.lucide) lucide.createIcons();

      try {
        const res = await fetch(`${API_BASE}/api/ai-assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            userRole: user.role,
            category: user.category
          })
        });

        const data = await res.json();
        document.getElementById(loadingId)?.remove();

        if (data && data.answer) {
          const formattedAnswer = data.answer
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300">$1</strong>')
            .replace(/\n/g, '<br/>');

          aiChatLog.innerHTML += `
            <div class="bg-[#080e10] p-3.5 rounded-xl border border-[#213236] text-slate-200 leading-relaxed mb-2.5 text-xs">
              ${formattedAnswer}
            </div>
          `;
        }
      } catch (err) {
        document.getElementById(loadingId)?.remove();
        console.error('AI assistant fetch error:', err);
      }

      aiChatLog.scrollTop = aiChatLog.scrollHeight;
      if (window.lucide) lucide.createIcons();
    };
  }
});

/**
 * Real-Time WebSocket Initialization & Handler
 */
function initWebSocket(user) {
  socket = new WebSocket(WS_BASE);

  socket.onopen = () => {
    console.log('⚡ Connected to Real-time Notification Engine');
    // Register user details for targeting updates
    socket.send(JSON.stringify({
      type: 'IDENTIFY_USER',
      payload: { email: user.email, role: user.role }
    }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleRealtimeEvent(data, user);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  socket.onclose = () => {
    console.warn('WebSocket disconnected. Reconnecting in 5s...');
    setTimeout(() => initWebSocket(user), 5000);
  };

  socket.onerror = (err) => {
    console.error('WebSocket Error:', err);
  };
}

function handleRealtimeEvent(eventData, user) {
  const notificationsContainer = document.getElementById('notificationsContainer');
  if (!notificationsContainer) return;

  // Clear "all clear" state if present
  const defaultCard = notificationsContainer.querySelector('.card-surface');
  if (defaultCard) defaultCard.remove();

  if (eventData.type === 'PAYMENT_REQUESTED') {
    const req = eventData.payload;
    const cardHtml = `
      <div id="notif-card-${req._id}" class="bg-gradient-to-r from-amber-950/90 to-[#080e10] border border-amber-400/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl mb-3 transition-all duration-300 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
            <i data-lucide="dollar-sign" class="w-5 h-5 text-amber-400 animate-bounce"></i>
          </div>
          <div>
            <h3 class="font-bold text-sm text-amber-100">Payment Release Requested</h3>
            <p class="text-xs text-amber-200/80">Creator requested escrow payout for "${req.title}".</p>
          </div>
        </div>
        <div class="flex items-center gap-2 self-end sm:self-auto">
          <button type="button" class="open-qr-dashboard-btn bg-amber-400 text-slate-950 hover:bg-amber-300 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5" 
            data-id="${req._id}" 
            data-amount="${req.escrowAmount || 5000}" 
            data-recipient="${req.creatorName}">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Release Payout →
          </button>
          <button type="button" class="dismiss-notif-btn text-amber-300 hover:text-white p-2 rounded-lg hover:bg-amber-500/20 text-xs font-bold cursor-pointer" data-id="${req._id}">✕</button>
        </div>
      </div>
    `;

    notificationsContainer.insertAdjacentHTML('afterbegin', cardHtml);
    attachCardListeners(req._id, user);
  }

  if (eventData.type === 'PAYMENT_RELEASED') {
    const rel = eventData.payload;
    const cardHtml = `
      <div id="notif-card-${rel._id}" class="bg-gradient-to-r from-emerald-400 via-lime-400 to-green-300 p-1 rounded-2xl shadow-2xl shadow-emerald-500/40 mb-3 transition-all duration-300">
        <div class="bg-[#031d14] p-4 sm:p-5 rounded-[13px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg">
              <i data-lucide="check-circle-2" class="w-7 h-7 text-slate-950"></i>
            </div>
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1 shadow-sm">
                💰 PAYOUT RECEIVED & ESCROW CLEARED
              </span>
              <h3 class="font-black text-base text-emerald-100 tracking-tight">
                ₹${rel.escrowAmount || 5000} Received for "${rel.title}"
              </h3>
              <p class="text-xs font-semibold text-emerald-300/90 mt-0.5">Funds have been released into your account balance.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <a href="tracker.html" class="bg-gradient-to-r from-emerald-400 to-lime-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg hover:brightness-110 transition active:scale-95 cursor-pointer">
              View Tracker →
            </a>
            <button type="button" class="dismiss-notif-btn text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-500/20 text-xs font-bold cursor-pointer" data-id="${rel._id}">✕</button>
          </div>
        </div>
      </div>
    `;

    notificationsContainer.insertAdjacentHTML('afterbegin', cardHtml);
    attachCardListeners(rel._id, user);
  }

  // Refresh counters
  if (eventData.stats) {
    const statTotal = document.getElementById('statTotalDeals');
    const statActive = document.getElementById('statActiveDeals');
    const statCompleted = document.getElementById('statCompletedDeals');

    if (statTotal) statTotal.textContent = eventData.stats.total || 0;
    if (statActive) statActive.textContent = eventData.stats.active || 0;
    if (statCompleted) statCompleted.textContent = eventData.stats.completed || 0;
  }

  if (window.lucide) lucide.createIcons();
}

function attachCardListeners(id, user) {
  const card = document.getElementById(`notif-card-${id}`);
  if (!card) return;

  const qrBtn = card.querySelector('.open-qr-dashboard-btn');
  if (qrBtn) {
    qrBtn.onclick = (e) => {
      const buttonEl = e.currentTarget;
      const id = buttonEl.getAttribute('data-id');
      const amount = buttonEl.getAttribute('data-amount');
      const recipient = buttonEl.getAttribute('data-recipient');
      openPaymentQrModal(id, amount, recipient, user);
    };
  }

  const dismissBtn = card.querySelector('.dismiss-notif-btn');
  if (dismissBtn) {
    dismissBtn.onclick = async () => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.remove(), 200);

      try {
        await fetch(`${API_BASE}/api/deals/${id}/dismiss-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userRole: user.role })
        });
      } catch (err) {
        console.error('Error dismissing notification:', err);
      }
    };
  }
}

async function loadDashboardData(user) {
  const notificationsContainer = document.getElementById('notificationsContainer');

  try {
    const res = await fetch(`${API_BASE}/api/deals/notifications?userEmail=${encodeURIComponent(user.email)}&userRole=${user.role}`);
    const data = await res.json();

    if (data.success) {
      if (data.stats) {
        const statTotal = document.getElementById('statTotalDeals');
        const statActive = document.getElementById('statActiveDeals');
        const statCompleted = document.getElementById('statCompletedDeals');

        if (statTotal) statTotal.textContent = data.stats.total || 0;
        if (statActive) statActive.textContent = data.stats.active || 0;
        if (statCompleted) statCompleted.textContent = data.stats.completed || 0;
      }

      if (notificationsContainer) {
        let alertHtml = '';

        if (data.paymentRequestedCount > 0 && data.paymentRequests) {
          data.paymentRequests.forEach(req => {
            alertHtml += `
              <div id="notif-card-${req._id}" class="bg-gradient-to-r from-amber-950/90 to-[#080e10] border border-amber-400/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl mb-3 transition-all duration-300">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                    <i data-lucide="dollar-sign" class="w-5 h-5 text-amber-400 animate-bounce"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-sm text-amber-100">Payment Release Requested</h3>
                    <p class="text-xs text-amber-200/80">Creator requested escrow payout for "${req.title}".</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-auto">
                  <button type="button" class="open-qr-dashboard-btn bg-amber-400 text-slate-950 hover:bg-amber-300 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5" 
                    data-id="${req._id}" 
                    data-amount="${req.escrowAmount || 5000}" 
                    data-recipient="${req.creatorName}">
                    <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Release Payout →
                  </button>
                  <button type="button" class="dismiss-notif-btn text-amber-300 hover:text-white p-2 rounded-lg hover:bg-amber-500/20 text-xs font-bold cursor-pointer" data-id="${req._id}">✕</button>
                </div>
              </div>
            `;
          });
        }

        if (data.paymentReleasedCount > 0 && data.paymentReleases) {
          data.paymentReleases.forEach(rel => {
            alertHtml += `
              <div id="notif-card-${rel._id}" class="bg-gradient-to-r from-emerald-400 via-lime-400 to-green-300 p-1 rounded-2xl shadow-2xl shadow-emerald-500/40 mb-3 transition-all duration-300">
                <div class="bg-[#031d14] p-4 sm:p-5 rounded-[13px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg">
                      <i data-lucide="check-circle-2" class="w-7 h-7 text-slate-950"></i>
                    </div>
                    <div>
                      <span class="inline-block px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1 shadow-sm">
                        💰 PAYOUT RECEIVED & ESCROW CLEARED
                      </span>
                      <h3 class="font-black text-base text-emerald-100 tracking-tight">
                        ₹${rel.escrowAmount || 5000} Received for "${rel.title}"
                      </h3>
                      <p class="text-xs font-semibold text-emerald-300/90 mt-0.5">Funds have been released into your account balance.</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <a href="tracker.html" class="bg-gradient-to-r from-emerald-400 to-lime-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg hover:brightness-110 transition active:scale-95 cursor-pointer">
                      View Tracker →
                    </a>
                    <button type="button" class="dismiss-notif-btn text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-500/20 text-xs font-bold cursor-pointer" data-id="${rel._id}">✕</button>
                  </div>
                </div>
              </div>
            `;
          });
        }

        if (data.pendingCount > 0) {
          alertHtml += `
            <div class="bg-gradient-to-r from-emerald-950/80 to-[#080e10] border border-emerald-500/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <i data-lucide="bell" class="w-5 h-5 text-emerald-400 animate-bounce"></i>
                </div>
                <div>
                  <h3 class="font-bold text-sm text-emerald-50">You have ${data.pendingCount} pending campaign offer(s)</h3>
                  <p class="text-xs text-slate-400">Review partner pitches and approve campaign offers in your Tracker.</p>
                </div>
              </div>
              <a href="tracker.html" class="btn-mint px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                Go to Tracker <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </a>
            </div>
          `;
        }

        if (!alertHtml) {
          alertHtml = `
            <div class="card-surface p-4 sm:p-5 rounded-2xl text-slate-400 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span class="flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
                All clear! No pending notifications right now.
              </span>
              <a href="matchmaker.html" class="text-emerald-400 font-semibold hover:underline">Find new partnerships →</a>
            </div>
          `;
        }

        notificationsContainer.innerHTML = alertHtml;
        if (window.lucide) lucide.createIcons();

        notificationsContainer.querySelectorAll('.open-qr-dashboard-btn').forEach(btn => {
          btn.onclick = (e) => {
            const buttonEl = e.currentTarget;
            const id = buttonEl.getAttribute('data-id');
            const amount = buttonEl.getAttribute('data-amount');
            const recipient = buttonEl.getAttribute('data-recipient');
            openPaymentQrModal(id, amount, recipient, user);
          };
        });

        notificationsContainer.querySelectorAll('.dismiss-notif-btn').forEach(btn => {
          btn.onclick = async (e) => {
            const buttonEl = e.currentTarget;
            const id = buttonEl ? buttonEl.getAttribute('data-id') : null;

            const cardEl = document.getElementById(`notif-card-${id}`);
            if (cardEl) {
              cardEl.style.opacity = '0';
              cardEl.style.transform = 'scale(0.95)';
              setTimeout(() => cardEl.remove(), 200);
            }

            if (id) {
              try {
                await fetch(`${API_BASE}/api/deals/${id}/dismiss-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userRole: user.role })
                });
              } catch (err) {
                console.error('Error dismissing notification:', err);
              }
            }
          };
        });
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard notifications:', err);
  }
}

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

function openPaymentQrModal(dealId, amount, recipientName, user) {
  const modal = document.getElementById('qrPaymentModal');
  const qrImage = document.getElementById('upiQrImage');
  const amountText = document.getElementById('qrAmountText');
  const recipientText = document.getElementById('qrRecipientText');
  const confirmBtn = document.getElementById('confirmQrPayoutBtn');

  if (!modal) return;

  const upiId = "collabsphere@upi";
  const formattedAmount = Number(amount || 5000);
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&am=${formattedAmount}&cu=INR&tn=Escrow%20Payout`;
  
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
  amountText.textContent = `₹${formattedAmount.toLocaleString('en-IN')}`;
  recipientText.textContent = `Payee: ${recipientName}`;

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `Releasing Payout...`;
    
    try {
      const response = await fetch(`${API_BASE}/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) {
        throw new Error('Failed to update deal status');
      }

      modal.classList.add('hidden');
      loadDashboardData(user);
    } catch (err) {
      console.error('Error releasing payout:', err);
      alert('Could not complete payout release. Please try again.');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `✅ Confirm Payout & Release Funds`;
    }
  };
}