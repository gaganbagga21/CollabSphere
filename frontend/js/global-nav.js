// Base API and WebSocket configuration pointing to Render backend
const RENDER_DOMAIN = 'collabsphere-rldj.onrender.com';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : `https://${RENDER_DOMAIN}`;

const WS_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'ws://localhost:5000'
  : `wss://${RENDER_DOMAIN}`;

let globalSocket = null;

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) return;

  const user = JSON.parse(sessionStr);

  // Role Badge Setup
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      sessionStorage.clear();
      window.location.href = 'login.html';
    });
  }

  fetchInitialNotificationCounts(user);
  initGlobalWebSocket(user);
});

async function fetchInitialNotificationCounts(user) {
  try {
    const [resDeals, resMsgs] = await Promise.all([
      fetch(`${API_BASE}/api/deals/notifications?userEmail=${encodeURIComponent(user.email)}&userRole=${user.role}`),
      fetch(`${API_BASE}/api/messages/unread/total?userEmail=${encodeURIComponent(user.email)}`)
    ]);

    const dataDeals = await resDeals.json();
    const dataMsgs = await resMsgs.json();

    const trackerCount = dataDeals.success ? (Number(dataDeals.count) || 0) : 0;
    const unreadMsgCount = dataMsgs.success ? (Number(dataMsgs.totalUnread) || 0) : 0;

    updateGlobalNavbarBadges(trackerCount, unreadMsgCount);
  } catch (err) {
    console.error('Error fetching initial notifications from Render:', err);
  }
}

function initGlobalWebSocket(user) {
  globalSocket = new WebSocket(WS_BASE);

  globalSocket.onopen = () => {
    globalSocket.send(JSON.stringify({
      type: 'IDENTIFY_USER',
      payload: { email: user.email, role: user.role }
    }));
  };

  globalSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'NAV_BADGES_UPDATE') {
        const { trackerCount, unreadMsgCount, isNewOffer } = data.payload;
        updateGlobalNavbarBadges(trackerCount, unreadMsgCount);

        if (isNewOffer && trackerCount > 0) {
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
        }
      }
    } catch (err) {
      console.error('WebSocket payload parsing error:', err);
    }
  };

  globalSocket.onclose = () => {
    setTimeout(() => initGlobalWebSocket(user), 5000);
  };
}

function updateGlobalNavbarBadges(trackerCount, unreadMsgCount) {
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