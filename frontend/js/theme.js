const THEME_STORAGE_KEY = 'collabsphere-theme';
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
let currentTheme = savedTheme === 'light' ? 'light' : 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;

  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const label = nextTheme === 'light' ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
  toggle.setAttribute('aria-pressed', String(theme === 'light'));
  toggle.querySelector('.theme-toggle-icon').textContent = nextTheme === 'light' ? '☼' : '☾';
  toggle.querySelector('.theme-toggle-label').textContent = label;
}

applyTheme(currentTheme);

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton && logoutButton.parentElement) {
    toggle.classList.add('in-header');
    logoutButton.parentElement.insertBefore(toggle, logoutButton);
  }

  applyTheme(currentTheme);
  toggle.addEventListener('click', () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
});
