document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('user_session');
  if (!sessionStr) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(sessionStr);

  document.getElementById('inputName').value = user.name || '';
  document.getElementById('inputEmail').value = user.email || '';
  document.getElementById('inputCategory').value = user.category || '';
  document.getElementById('inputMeta').value = user.meta || '';
  document.getElementById('inputBio').value = user.bio || '';

  document.getElementById('profileDisplayName').textContent = user.name || 'User';
  document.getElementById('profileSubText').textContent = `${user.category || 'Niche'} • Indore`;
  document.getElementById('profileMeta').textContent = user.meta || '@handle';

  if (user.avatar) {
    document.getElementById('profileAvatar').src = user.avatar;
  }

  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      user.name = document.getElementById('inputName').value.trim();
      user.category = document.getElementById('inputCategory').value.trim();
      user.meta = document.getElementById('inputMeta').value.trim();
      user.bio = document.getElementById('inputBio').value.trim();

      localStorage.setItem('user_session', JSON.stringify(user));

      Toastify({
        text: "Profile updated successfully!",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "linear-gradient(to right, #059669, #10b981)",
          borderRadius: "12px",
          fontWeight: "600",
          fontSize: "13px",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
        }
      }).showToast();

      document.getElementById('profileDisplayName').textContent = user.name;
      document.getElementById('profileSubText').textContent = `${user.category} • Indore`;
      document.getElementById('profileMeta').textContent = user.meta;
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }
});