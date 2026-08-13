document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name || 'User';

  loadDashboardData(user);

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

      // Append User Question
      aiChatLog.innerHTML += `
        <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-200 text-right font-medium mb-2.5 text-xs">
          ${query}
        </div>
      `;

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
        const res = await fetch('http://localhost:5000/api/ai-assistant', {
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
          // Format markdown bolding and line breaks cleanly
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
        aiChatLog.innerHTML += `
          <div class="bg-[#080e10] p-3.5 rounded-xl border border-[#213236] text-slate-200 leading-relaxed mb-2.5 text-xs">
            💡 <strong class="text-emerald-300">Strategy Tips for "${query}"</strong>:<br/><br/>
            1. <strong class="text-emerald-300">Hook viewers in 3s</strong>: Use strong text overlays or a problem statement.<br/>
            2. <strong class="text-emerald-300">Clear Deliverable</strong>: Highlight the brand value clearly mid-video.<br/>
            3. <strong class="text-emerald-300">Strong CTA</strong>: Direct viewers to save/share the post.
          </div>
        `;
      }

      aiChatLog.scrollTop = aiChatLog.scrollHeight;
      if (window.lucide) lucide.createIcons();
    };
  }
});

async function loadDashboardData(user) {
  const notificationsContainer = document.getElementById('notificationsContainer');

  try {
    const res = await fetch(`http://localhost:5000/api/deals/notifications?userEmail=${encodeURIComponent(user.email)}&userRole=${user.role}`);
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

        // BRAND PAYMENT REQUEST ALERT
        if (data.paymentRequestedCount > 0 && data.paymentRequests) {
          data.paymentRequests.forEach(req => {
            alertHtml += `
              <div id="notif-card-${req._id}" class="bg-gradient-to-r from-amber-950/90 to-[#080e10] border border-amber-400/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl mb-3 transition-all duration-300">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
                    <i data-lucide="dollar-sign" class="w-5 h-5 text-amber-400 animate-bounce"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-sm text-amber-100">Payment Release Requested</h3>
                    <p class="text-xs text-amber-200/80">Creator requested escrow payout release for "${req.title}".</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="view-tracker-btn bg-amber-400 text-slate-950 hover:bg-amber-300 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer" data-id="${req._id}">
                    Release Payout →
                  </button>
                  <button type="button" class="dismiss-notif-btn text-amber-300 hover:text-white p-2 rounded-lg hover:bg-amber-500/20 text-xs font-bold cursor-pointer" data-id="${req._id}">✕</button>
                </div>
              </div>
            `;
          });
        }

        // CREATOR: GLOWING GREEN PAYMENT RELEASED BADGE
        if (data.paymentReleasedCount > 0 && data.paymentReleases) {
          data.paymentReleases.forEach(rel => {
            alertHtml += `
              <div id="notif-card-${rel._id}" class="bg-gradient-to-r from-emerald-400 via-lime-400 to-green-300 p-1 rounded-2xl shadow-2xl shadow-emerald-500/40 mb-3 transition-all duration-300">
                <div class="bg-[#031d14] p-5 rounded-[13px] flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  <div class="flex items-center gap-2 shrink-0">
                    <button type="button" class="view-tracker-btn bg-gradient-to-r from-emerald-400 to-lime-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg hover:brightness-110 transition active:scale-95 cursor-pointer" data-id="${rel._id}">
                      View Tracker →
                    </button>
                    <button type="button" class="dismiss-notif-btn text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-500/20 text-xs font-bold cursor-pointer" data-id="${rel._id}">✕</button>
                  </div>
                </div>
              </div>
            `;
          });
        }

        // PENDING OFFERS
        if (data.pendingCount > 0) {
          alertHtml += `
            <div class="bg-gradient-to-r from-emerald-950/80 to-[#080e10] border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <i data-lucide="bell" class="w-5 h-5 text-emerald-400 animate-bounce"></i>
                </div>
                <div>
                  <h3 class="font-bold text-sm text-emerald-50">You have ${data.pendingCount} pending campaign offer(s)</h3>
                  <p class="text-xs text-slate-400">Review partner pitches and approve campaign offers in your Tracker.</p>
                </div>
              </div>
              <a href="tracker.html" class="btn-mint px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5">
                Go to Tracker <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </a>
            </div>
          `;
        }

        if (!alertHtml) {
          alertHtml = `
            <div class="card-surface p-5 rounded-2xl text-slate-400 text-xs flex items-center justify-between">
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

        // VIEW TRACKER AND DISMISS
        notificationsContainer.querySelectorAll('.view-tracker-btn').forEach(btn => {
          btn.onclick = async (e) => {
            const buttonEl = e.target.closest('button');
            const id = buttonEl ? buttonEl.getAttribute('data-id') : null;
            
            const cardEl = document.getElementById(`notif-card-${id}`);
            if (cardEl) cardEl.remove();

            if (id) {
              try {
                await fetch(`http://localhost:5000/api/deals/${id}/dismiss-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userRole: user.role })
                });
              } catch (err) {}
            }
            window.location.href = 'tracker.html';
          };
        });

        // DISMISS BUTTON ('✕') LISTENER
        notificationsContainer.querySelectorAll('.dismiss-notif-btn').forEach(btn => {
          btn.onclick = async (e) => {
            const buttonEl = e.target.closest('button');
            const id = buttonEl ? buttonEl.getAttribute('data-id') : null;

            const cardEl = document.getElementById(`notif-card-${id}`);
            if (cardEl) {
              cardEl.style.opacity = '0';
              cardEl.style.transform = 'scale(0.95)';
              setTimeout(() => cardEl.remove(), 200);
            }

            if (id) {
              try {
                await fetch(`http://localhost:5000/api/deals/${id}/dismiss-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userRole: user.role })
                });
              } catch (err) {}
            }
          };
        });
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard notifications:', err);
  }
}