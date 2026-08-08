document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) return;

  const user = JSON.parse(sessionStr);

  // 1. Setup Navigation Role Badge
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  // 2. Global Sign Out
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }

  // 3. Global Notification Polling & Badge Updater
  initGlobalNotifications(user);
});

let globalLastCount = -1;

function initGlobalNotifications(user) {
  const checkNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/deals/notifications?userEmail=${user.email}&userRole=${user.role}`);
      const data = await res.json();

      if (data.success) {
        const count = data.count || 0;

        // Update Tracker & Messages badges across all pages
        updateGlobalNavbarBadges(count);

        // Show toast notification whenever count > 0 and count changes
        if (count > 0 && (globalLastCount === -1 || count > globalLastCount)) {
          
          // Sound trigger (plays if user interacted with page)
          try {
            const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            chime.play().catch(() => {});
          } catch(e) {}

          Toastify({
            text: `🔔 Action Required! You have ${count} pending campaign notification(s).`,
            duration: 4500,
            gravity: "top",
            position: "right",
            style: { 
              background: "linear-gradient(to right, #059669, #10b981)", 
              borderRadius: "12px", 
              fontWeight: "600",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)" 
            }
          }).showToast();
        }

        globalLastCount = count;
      }
    } catch (err) {
      console.error('Notification Polling Error:', err);
    }
  };

  // Run immediately within 500ms of loading ANY page, then poll every 4 seconds
  setTimeout(checkNotifications, 500);
  setInterval(checkNotifications, 4000);
}

function updateGlobalNavbarBadges(count) {
  // Update Tracker links across all pages
  const trackerNavs = document.querySelectorAll('a[href="tracker.html"]');
  trackerNavs.forEach(nav => {
    let badge = nav.querySelector('.nav-notif-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-notif-badge bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-pulse';
        nav.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  });

  // Update Messages links across all pages
  const messageNavs = document.querySelectorAll('a[href="messages.html"]');
  messageNavs.forEach(nav => {
    let badge = nav.querySelector('.nav-msg-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-msg-badge bg-emerald-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1';
        nav.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  });
}