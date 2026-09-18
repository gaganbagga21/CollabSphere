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

  // Populate form fields
  const nameInput = document.getElementById('inputName');
  const emailInput = document.getElementById('inputEmail');
  const categoryInput = document.getElementById('inputCategory');
  const metaInput = document.getElementById('inputMeta');
  const bioInput = document.getElementById('inputBio');

  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (categoryInput) categoryInput.value = user.category || '';
  if (metaInput) metaInput.value = user.meta || '';
  if (bioInput) bioInput.value = user.bio || '';

  // Display user information
  const displayNameEl = document.getElementById('profileDisplayName');
  const subTextEl = document.getElementById('profileSubText');
  const metaEl = document.getElementById('profileMeta');
  const avatarEl = document.getElementById('profileAvatar');

  if (displayNameEl) displayNameEl.textContent = user.name || 'User';
  if (subTextEl) subTextEl.textContent = `${user.category || 'Niche'} • Indore`;
  if (metaEl) metaEl.textContent = user.meta || '@handle';
  if (avatarEl && user.avatar) avatarEl.src = user.avatar;

  // Role Badge setup
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = user.role === 'business' ? 'BUSINESS MODE' : 'CREATOR MODE';
    roleBadge.className = user.role === 'business'
      ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
      : 'bg-teal-400/10 text-teal-300 border border-teal-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider';
  }

  // Handle Profile Form Submission
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const updatedData = {
        email: user.email,
        name: nameInput ? nameInput.value.trim() : user.name,
        category: categoryInput ? categoryInput.value.trim() : user.category,
        meta: metaInput ? metaInput.value.trim() : user.meta,
        bio: bioInput ? bioInput.value.trim() : user.bio
      };

      try {
        // Send updates to the Render backend database
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        const data = await res.json();

        if (data.success || res.ok) {
          // Merge updated properties into local session
          Object.assign(user, updatedData);
          localStorage.setItem('user_session', JSON.stringify(user));

          // Update UI labels
          if (displayNameEl) displayNameEl.textContent = user.name;
          if (subTextEl) subTextEl.textContent = `${user.category} • Indore`;
          if (metaEl) metaEl.textContent = user.meta;

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
        } else {
          throw new Error(data.message || 'Failed to update profile on server.');
        }
      } catch (err) {
        console.error('Error updating profile:', err);

        // Fallback: Save locally if API endpoint isn't listening yet
        Object.assign(user, updatedData);
        localStorage.setItem('user_session', JSON.stringify(user));

        if (displayNameEl) displayNameEl.textContent = user.name;
        if (subTextEl) subTextEl.textContent = `${user.category} • Indore`;
        if (metaEl) metaEl.textContent = user.meta;

        Toastify({
          text: "Profile saved locally!",
          duration: 3000,
          gravity: "bottom",
          position: "right",
          style: {
            background: "linear-gradient(to right, #d97706, #f59e0b)",
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "13px"
          }
        }).showToast();
      }
    });
  }

  // Logout Action
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user_session');
      localStorage.removeItem('user_role');
      window.location.href = 'login.html';
    });
  }
});