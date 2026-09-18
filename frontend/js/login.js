document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const demoCreatorBtn = document.getElementById('demoCreatorBtn');
  const demoBusinessBtn = document.getElementById('demoBusinessBtn');

  if (demoCreatorBtn) {
    demoCreatorBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'creator@collabsphere.com';
      document.getElementById('loginPassword').value = '123456';
    });
  }

  if (demoBusinessBtn) {
    demoBusinessBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'business@collabsphere.com';
      document.getElementById('loginPassword').value = '123456';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success && data.user) {
          localStorage.setItem('user_session', JSON.stringify(data.user));
          localStorage.setItem('user_role', data.user.role);

          Toastify({
            text: `Welcome back, ${data.user.name}! Redirecting...`,
            duration: 2000,
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

          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);

        } else {
          Toastify({
            text: `${data.error || 'Invalid credentials.'}`,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            style: {
              background: "linear-gradient(to right, #dc2626, #ef4444)",
              borderRadius: "12px",
              fontSize: "13px"
            }
          }).showToast();
        }
      } catch (err) {
        console.error('Login Error:', err);

        Toastify({
          text: "Unable to connect to server. Ensure backend is running.",
          duration: 3500,
          gravity: "bottom",
          position: "right",
          style: {
            background: "linear-gradient(to right, #dc2626, #ef4444)",
            borderRadius: "12px",
            fontSize: "13px"
          }
        }).showToast();
      }
    });
  }
});