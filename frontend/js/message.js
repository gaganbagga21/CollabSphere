// Base API endpoint resolution for Render deployment
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
  let activeDealId = null;
  let messagePollInterval = null;

  renderEmptyState();
  loadInbox(user);
  fetchNavMessageBadge(user);

  // Poll for navbar & unread message count every 4 seconds
  setInterval(() => {
    fetchNavMessageBadge(user);
    loadInbox(user, true);
  }, 4000);

  // Send Message Form
  const form = document.getElementById('messagesForm');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!activeDealId) return;

      const input = document.getElementById('messageTextInput');
      const attachInput = document.getElementById('fileAttachmentInput');
      const text = input ? input.value.trim() : '';
      const fileUrl = attachInput ? attachInput.value.trim() : '';

      if (!text) return;

      try {
        const res = await fetch(`${API_BASE}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: activeDealId,
            senderEmail: user.email,
            senderName: user.name || user.email.split('@')[0],
            text,
            fileUrl
          })
        });

        const data = await res.json();
        if (data.success) {
          if (input) input.value = '';
          if (attachInput) attachInput.value = '';
          fetchMessages(activeDealId, user);
          loadInbox(user, true);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    };
  }

  // Load Inbox List
  async function loadInbox(user, isSilent = false) {
    const list = document.getElementById('conversationsList');
    if (!list) return;

    try {
      const res = await fetch(`${API_BASE}/api/deals?userEmail=${encodeURIComponent(user.email)}&inboxOnly=true`);
      const data = await res.json();

      const deals = data.deals || [];
      const activeDeals = deals.filter(d => d.status !== 'completed');
      const previousDeals = deals.filter(d => d.status === 'completed');

      if (deals.length === 0) {
        list.innerHTML = `<div class="p-5 text-slate-500 text-xs text-center">No deal conversations found.</div>`;
        return;
      }

      let inboxHtml = '';

      // Active Campaigns
      inboxHtml += `
        <div class="px-4 py-2 bg-[#0e1719] border-b border-[#213236]">
          <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <i data-lucide="zap" class="w-3 h-3"></i> Active Campaigns (${activeDeals.length})
          </span>
        </div>
      `;
      inboxHtml += activeDeals.length > 0 ? activeDeals.map(d => renderChatItem(d, user, false)).join('') : `<div class="p-3 text-slate-500 text-[11px] italic text-center">No active deals.</div>`;

      // Previous Campaigns
      inboxHtml += `
        <div class="px-4 py-2 bg-[#0e1719] border-t border-b border-[#213236] mt-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <i data-lucide="archive" class="w-3 h-3"></i> Previous Chats (${previousDeals.length})
          </span>
        </div>
      `;
      inboxHtml += previousDeals.length > 0 ? previousDeals.map(d => renderChatItem(d, user, true)).join('') : `<div class="p-3 text-slate-500 text-[11px] italic text-center">No past conversations.</div>`;

      list.innerHTML = inboxHtml;
      if (window.lucide) lucide.createIcons();

      if (activeDealId) {
        const currentActiveEl = document.querySelector(`.chat-item[data-id="${activeDealId}"]`);
        if (currentActiveEl) {
          currentActiveEl.classList.add('bg-[#1c2e32]', 'border-l-4', 'border-emerald-400');
        }
      }

      // Event Delegation
      document.querySelectorAll('.chat-item').forEach(item => {
        item.onclick = (e) => {
          const deleteBtn = e.target.closest('.delete-chat-btn');
          if (deleteBtn) {
            e.stopPropagation();
            const dealId = deleteBtn.getAttribute('data-deal-id');
            const isPast = deleteBtn.getAttribute('data-is-past') === 'true';
            deleteChatMessagesOnly(dealId, user, isPast);
            return;
          }

          document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('bg-[#1c2e32]', 'border-l-4', 'border-emerald-400', 'bg-emerald-950/20'));
          item.classList.add('bg-[#1c2e32]', 'border-l-4', 'border-emerald-400');

          activeDealId = item.getAttribute('data-id');
          const title = item.getAttribute('data-title');
          const partner = item.getAttribute('data-partner');

          const titleEl = document.getElementById('chatTitle');
          const subTitleEl = document.getElementById('chatSubTitle');
          if (titleEl) titleEl.textContent = partner;
          if (subTitleEl) subTitleEl.textContent = title;

          const textInput = document.getElementById('messageTextInput');
          const sendBtn = document.getElementById('sendMessageBtn');
          if (textInput) {
            textInput.disabled = false;
            textInput.placeholder = `Message ${partner}...`;
            textInput.focus();
          }
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }

          fetchMessages(activeDealId, user);

          if (messagePollInterval) clearInterval(messagePollInterval);
          messagePollInterval = setInterval(() => {
            if (activeDealId) fetchMessages(activeDealId, user, true);
          }, 3000);
        };
      });

    } catch (e) {
      console.error('Error loading inbox:', e);
    }
  }

  function renderChatItem(d, user, isPast = false) {
    const partnerName = user.role === 'creator' ? d.businessName : d.creatorName;
    const hasUnread = d.unreadCount > 0;

    return `
      <div 
        class="chat-item group p-3.5 cursor-pointer border-b border-[#213236] transition flex justify-between items-center ${
          hasUnread 
            ? 'bg-emerald-950/40 border-l-4 border-l-emerald-400 shadow-md' 
            : 'hover:bg-[#1c2e32]'
        }" 
        data-id="${d._id}" 
        data-title="${d.title}" 
        data-partner="${partnerName}"
      >
        <div class="flex-1 min-w-0 pr-2">
          <div class="flex items-center justify-between gap-1">
            <h4 class="font-bold text-xs ${hasUnread ? 'text-emerald-300 font-extrabold' : 'text-emerald-50'} truncate">
              ${partnerName}
            </h4>
            ${hasUnread ? `
              <span class="bg-emerald-400 text-slate-950 text-[10px] font-black rounded-full px-1.5 py-0.2 shadow-md">
                ${d.unreadCount}
              </span>
            ` : ''}
          </div>
          <p class="text-[11px] ${hasUnread ? 'text-emerald-200/90 font-medium' : 'text-slate-400'} truncate mt-0.5">
            ${d.title}
          </p>
        </div>
        
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
            d.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-300' :
            d.status === 'completed' ? 'bg-teal-400/10 text-teal-300' :
            'bg-amber-400/10 text-amber-300'
          }">
            ${d.status}
          </span>

          <button 
            type="button"
            class="delete-chat-btn text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition" 
            data-deal-id="${d._id}" 
            data-is-past="${isPast}"
            title="${isPast ? 'Remove Past Conversation' : 'Clear Chat Messages'}"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Fetch Messages & auto-clear unread badge
  async function fetchMessages(dealId, user, isSilent = false) {
    const log = document.getElementById('messagesLog');
    if (!log) return;

    try {
      const res = await fetch(`${API_BASE}/api/messages/${dealId}?userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();

      if (data.success && data.messages && data.messages.length > 0) {
        log.innerHTML = data.messages.map(m => {
          const isMe = m.senderEmail && user.email && m.senderEmail.toLowerCase() === user.email.toLowerCase();

          return `
            <div class="w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3">
              <span class="text-[9px] text-slate-400 mb-1 px-1 font-medium">${m.senderName || 'User'}</span>
              
              <div class="flex items-center gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}">
                <div class="${
                  isMe 
                    ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-50 rounded-2xl rounded-tr-none' 
                    : 'bg-[#1c2e32] border border-[#2c4247] text-slate-100 rounded-2xl rounded-tl-none'
                } p-3.5 shadow-md text-xs leading-relaxed break-words">
                  <p>${m.text}</p>
                  ${m.fileUrl ? `
                    <a href="${m.fileUrl}" target="_blank" class="text-[10px] text-emerald-300 underline block mt-2 flex items-center gap-1 font-bold">
                      <i data-lucide="paperclip" class="w-3 h-3"></i> View Attachment
                    </a>
                  ` : ''}
                </div>

                ${isMe ? `
                  <button 
                    type="button"
                    class="delete-msg-btn text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition shrink-0" 
                    data-msg-id="${m._id}"
                    title="Delete message"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');

        log.querySelectorAll('.delete-msg-btn').forEach(btn => {
          btn.onclick = async (e) => {
            const msgId = e.target.closest('button').getAttribute('data-msg-id');
            await deleteSingleMessage(msgId, dealId, user);
          };
        });

        if (!isSilent) {
          log.scrollTop = log.scrollHeight;
        }

      } else {
        log.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-2 text-xs py-12">
            <i data-lucide="message-square" class="w-8 h-8 text-slate-600"></i>
            <p>No messages yet. Send a message below to start chatting!</p>
          </div>
        `;
      }

      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Error fetching messages thread:', err);
    }
  }

  // Fetch Total Unread Messages for Navbar Badge
  async function fetchNavMessageBadge(user) {
    try {
      const res = await fetch(`${API_BASE}/api/messages/unread/total?userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();

      let navMsgLink = document.querySelector('a[href="message.html"]') || document.querySelector('a[href="messages.html"]');
      if (!navMsgLink) return;

      let badgeEl = document.getElementById('navMsgBadge');

      if (data.success && data.totalUnread > 0) {
        if (!badgeEl) {
          badgeEl = document.createElement('span');
          badgeEl.id = 'navMsgBadge';
          badgeEl.className = 'ml-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2 shadow-lg animate-pulse';
          navMsgLink.appendChild(badgeEl);
        }
        badgeEl.textContent = data.totalUnread;
      } else if (badgeEl) {
        badgeEl.remove();
      }
    } catch (err) {
      console.error('Error fetching nav message badge:', err);
    }
  }

  function renderEmptyState() {
    const log = document.getElementById('messagesLog');
    const textInput = document.getElementById('messageTextInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const titleEl = document.getElementById('chatTitle');
    const subTitleEl = document.getElementById('chatSubTitle');

    if (titleEl) titleEl.textContent = 'Select a conversation';
    if (subTitleEl) subTitleEl.textContent = 'Click any active campaign on the left to start messaging';

    if (textInput) {
      textInput.disabled = true;
      textInput.placeholder = 'Select a chat from the left sidebar...';
    }
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    if (log) {
      log.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-20 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <i data-lucide="messages-square" class="w-8 h-8 text-emerald-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-sm text-slate-300">CollabSphere Chat</h3>
            <p class="text-xs text-slate-500 mt-1 max-w-xs">Select a campaign from the sidebar to open messages and communicate with your partner.</p>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  async function deleteSingleMessage(messageId, dealId, user) {
    try {
      const res = await fetch(`${API_BASE}/api/messages/${messageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        Toastify({
          text: "🗑️ Message deleted",
          duration: 2000,
          gravity: "bottom",
          position: "right",
          style: { background: "linear-gradient(to right, #dc2626, #ef4444)", borderRadius: "10px", fontSize: "12px" }
        }).showToast();

        fetchMessages(dealId, user);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  }

  async function deleteChatMessagesOnly(dealId, user, isPast = false) {
    const confirmPrompt = isPast 
      ? 'Remove this past conversation from your inbox?' 
      : 'Clear all chat messages for this campaign? (Your deal status and history will remain saved in Tracker)';

    if (!confirm(confirmPrompt)) return;

    try {
      let res;
      if (isPast) {
        res = await fetch(`${API_BASE}/api/deals/hide-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId, userRole: user.role })
        });
      } else {
        res = await fetch(`${API_BASE}/api/messages/clear-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealId })
        });
      }

      const data = await res.json();
      if (data.success) {
        Toastify({
          text: isPast ? "🗑️ Past conversation removed" : "🗑️ Chat messages cleared",
          duration: 2500,
          gravity: "bottom",
          position: "right",
          style: { background: "linear-gradient(to right, #dc2626, #ef4444)", borderRadius: "10px", fontSize: "12px" }
        }).showToast();

        if (activeDealId === dealId) {
          activeDealId = null;
          renderEmptyState();
        }
        loadInbox(user);
      }
    } catch (err) {
      console.error('Error clearing chat messages:', err);
    }
  }
});