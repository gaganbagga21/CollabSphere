document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) return;

  const user = JSON.parse(sessionStr);

  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      sessionStorage.clear();
      window.location.href = 'login.html';
    });
  }

  initGlobalNotifications(user);
});

function initGlobalNotifications(user) {
  const checkNotifications = async () => {
    try {
      // 1. Fetch Deal / Tracker Notifications
      const resDeals = await fetch(`http://localhost:5000/api/deals/notifications?userEmail=${encodeURIComponent(user.email)}&userRole=${user.role}`);
      const dataDeals = await resDeals.json();

      // 2. Fetch Total Unread Messages Count
      const resMsgs = await fetch(`http://localhost:5000/api/messages/unread/total?userEmail=${encodeURIComponent(user.email)}`);
      const dataMsgs = await resMsgs.json();

      if (dataDeals.success) {
        const trackerCount = Number(dataDeals.count) || 0;
        const previousNotified = Number(sessionStorage.getItem('last_notified_count') || -1);

        const unreadMsgCount = (dataMsgs && dataMsgs.success) ? Number(dataMsgs.totalUnread) || 0 : 0;

        // Update Tracker & Messages badges independently
        updateGlobalNavbarBadges(trackerCount, unreadMsgCount);

        // Toast alert strictly for new pending tracker offers
        if (trackerCount > 0 && trackerCount > previousNotified) {
          sessionStorage.setItem('last_notified_count', trackerCount);

          Toastify({
            text: `🔔 You have ${trackerCount} pending campaign request(s)!`,
            duration: 4000,
            gravity: "top",
            position: "right",
            style: { 
              background: "linear-gradient(to right, #059669, #10b981)", 
              borderRadius: "12px", 
              fontWeight: "600"
            }
          }).showToast();
        } else if (trackerCount === 0) {
          sessionStorage.setItem('last_notified_count', 0);
        }
      }
    } catch (err) {
      console.error('Error in global notifications polling:', err);
    }
  };

  setTimeout(checkNotifications, 500);
  setInterval(checkNotifications, 5000); // Poll every 5 seconds globally
}

function updateGlobalNavbarBadges(trackerCount, unreadMsgCount) {
  // A. TRACKER NAVBAR BADGE
  const trackerNavs = document.querySelectorAll('a[href*="tracker"]');
  trackerNavs.forEach(nav => {
    let badge = nav.querySelector('.nav-notif-badge');
    if (trackerCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-notif-badge bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1.5 animate-pulse inline-block';
        nav.appendChild(badge);
      }
      badge.textContent = trackerCount;
    } else if (badge) {
      badge.remove();
    }
  });

  // B. MESSAGES NAVBAR BADGE (UNREAD CHATS)
  const messageNavs = document.querySelectorAll('a[href*="message"]');
  messageNavs.forEach(nav => {
    let badge = nav.querySelector('.nav-msg-badge');
    if (unreadMsgCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-msg-badge bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1.5 animate-pulse inline-block shadow-lg';
        nav.appendChild(badge);
      }
      badge.textContent = unreadMsgCount;
    } else if (badge) {
      badge.remove();
    }
  });
}