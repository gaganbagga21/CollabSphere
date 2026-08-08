document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  let activeDealId = null;
  let activeDealTitle = '';

  loadConversations(user);

  // Handle Message Submission
  const messagesForm = document.getElementById('messagesForm');
  if (messagesForm) {
    messagesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeDealId) return;

      const textInput = document.getElementById('messageTextInput');
      const attachInput = document.getElementById('fileAttachmentInput');
      const text = textInput.value.trim();
      const fileUrl = attachInput ? attachInput.value.trim() : '';

      if (!text) return;

      try {
        const res = await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: activeDealId,
            senderEmail: user.email,
            senderName: user.name,
            text,
            fileUrl
          })
        });

        const data = await res.json();
        if (data.success) {
          textInput.value = '';
          if (attachInput) attachInput.value = '';
          loadMessagesThread(activeDealId, user);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });
  }

  async function loadConversations(user) {
    const listContainer = document.getElementById('conversationsList');
    if (!listContainer) return;

    try {
      const res = await fetch(`http://localhost:5000/api/deals?userEmail=${user.email}`);
      const data = await res.json();

      if (data.success) {
        const activeDeals = (data.deals || []).filter(d => d.status === 'accepted' || d.status === 'completed' || d.status === 'pending');

        if (activeDeals.length === 0) {
          listContainer.innerHTML = `
            <div class="p-6 text-center text-slate-500 text-xs">
              No active conversations yet. Send or accept a deal request in the Tracker to start chatting!
            </div>
          `;
          return;
        }

        listContainer.innerHTML = activeDeals.map(deal => {
          const partnerName = user.role === 'creator' ? deal.businessName : deal.creatorName;

          return `
            <div 
              class="conversation-item p-4 hover:bg-[#1c2e32] cursor-pointer transition flex items-center justify-between"
              data-deal-id="${deal._id}"
              data-title="${deal.title}"
              data-partner="${partnerName}"
            >
              <div>
                <h4 class="font-bold text-xs text-emerald-50">${partnerName}</h4>
                <p class="text-[11px] text-slate-400 truncate max-w-[180px]">${deal.title}</p>
              </div>
              <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                deal.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' : 
                deal.status === 'pending' ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' :
                'bg-teal-400/10 text-teal-300'
              }">
                ${deal.status}
              </span>
            </div>
          `;
        }).join('');

        // Attach click listeners to sidebar conversations
        document.querySelectorAll('.conversation-item').forEach(item => {
          item.addEventListener('click', () => {
            document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('bg-[#1c2e32]', 'border-l-4', 'border-emerald-400'));
            item.classList.add('bg-[#1c2e32]', 'border-l-4', 'border-emerald-400');

            activeDealId = item.getAttribute('data-deal-id');
            activeDealTitle = item.getAttribute('data-title');
            const partnerName = item.getAttribute('data-partner');

            document.getElementById('chatTitle').textContent = partnerName;
            document.getElementById('chatSubTitle').textContent = activeDealTitle;

            const textInput = document.getElementById('messageTextInput');
            const sendBtn = document.getElementById('sendMessageBtn');
            textInput.disabled = false;
            textInput.placeholder = `Message ${partnerName}...`;
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');

            loadMessagesThread(activeDealId, user);
          });
        });

        // Auto click first conversation
        const firstItem = document.querySelector('.conversation-item');
        if (firstItem) firstItem.click();
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }

  async function loadMessagesThread(dealId, user) {
    const messagesLog = document.getElementById('messagesLog');
    if (!messagesLog) return;

    try {
      const res = await fetch(`http://localhost:5000/api/messages/${dealId}`);
      const data = await res.json();

      if (data.success && data.messages.length > 0) {
        messagesLog.innerHTML = data.messages.map(msg => {
          const isMe = msg.senderEmail === user.email;
          return `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
              <span class="text-[10px] text-slate-500 mb-1">${msg.senderName}</span>
              <div class="${isMe ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-100' : 'bg-[#080e10] border border-[#213236] text-slate-200'} p-3 rounded-2xl max-w-[70%] shadow-sm">
                <p class="leading-relaxed">${msg.text}</p>
                ${msg.fileUrl ? `
                  <a href="${msg.fileUrl}" target="_blank" class="text-[11px] text-emerald-400 underline block mt-2 flex items-center gap-1 font-semibold">
                    <i data-lucide="paperclip" class="w-3.5 h-3.5"></i> View Attachment
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      } else {
        messagesLog.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <i data-lucide="message-square" class="w-8 h-8 text-slate-600"></i>
            <p>No messages in this campaign yet. Type a message below to start chatting!</p>
          </div>
        `;
      }

      messagesLog.scrollTop = messagesLog.scrollHeight;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Error loading thread:', err);
    }
  }
});