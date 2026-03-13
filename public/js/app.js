import { apiFetch, clearToken, getToken } from './api.js';
import { getESTHour, formatESTDate } from './date-utils.js';
import { renderTodaySection } from './today.js';
import { renderGoalsSection } from './goals.js';
import { renderLogSection } from './logs.js';
import { renderExpensesSection } from './expenses.js';
import { renderRewardsSection } from './achievements.js';

const sectionContainer = document.getElementById('section-container');
const greetingEl = document.getElementById('greeting');
const mainTitleEl = document.getElementById('main-title');
const mainDateEl = document.getElementById('main-date');
const userNameEl = document.getElementById('sidebar-user-name');
const logoutBtn = document.getElementById('logout-btn');

const navItems = document.querySelectorAll('.nav-item');
const tabItems = document.querySelectorAll('.tab-item');
const navIndicator = document.querySelector('.nav-active-indicator');

if (!getToken()) {
  window.location.replace('/index.html');
}

function setGreeting(name) {
  const hour = getESTHour();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  greetingEl.textContent = `${timeGreeting}, ${name || 'friend'}`;
}

function setMainDate() {
  mainDateEl.textContent = formatESTDate();
}

async function loadUser() {
  try {
    const { user } = await apiFetch('/auth/me');
    userNameEl.textContent = user.name;
    setGreeting(user.name);
  } catch {
    // handled by apiFetch redirect
  }
}

logoutBtn.addEventListener('click', () => {
  clearToken();
  window.location.replace('/index.html');
});

function setActiveNav(section) {
  navItems.forEach((item) => {
    const active = item.dataset.section === section;
    item.classList.toggle('active', active);
    if (active) {
      const rect = item.getBoundingClientRect();
      const parentRect = item.parentElement.getBoundingClientRect();
      navIndicator.style.top = `${rect.top - parentRect.top}px`;
    }
  });
  tabItems.forEach((item) => {
    const active = item.dataset.section === section;
    item.classList.toggle('active', active);
  });
}

async function renderSection(section) {
  mainTitleEl.textContent = section === 'today' ? 'Today' : section[0].toUpperCase() + section.slice(1);
  sectionContainer.classList.remove('section-visible');
  sectionContainer.innerHTML = '';

  window.location.hash = `#${section}`;

  if (section === 'today') {
    await renderTodaySection(sectionContainer);
  } else if (section === 'goals') {
    await renderGoalsSection(sectionContainer);
  } else if (section === 'log') {
    await renderLogSection(sectionContainer);
  } else if (section === 'expenses') {
    await renderExpensesSection(sectionContainer);
  } else if (section === 'rewards') {
    await renderRewardsSection(sectionContainer);
  }
}

function initNav() {
  [...navItems, ...tabItems].forEach((el) => {
    el.addEventListener('click', () => {
      const section = el.dataset.section;
      setActiveNav(section);
      renderSection(section);
    });
  });
}

function initialSection() {
  const hash = window.location.hash.replace('#', '');
  const valid = ['today', 'goals', 'log', 'expenses', 'rewards'];
  return valid.includes(hash) ? hash : 'today';
}

function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

window.addEventListener('hashchange', () => {
  const section = initialSection();
  setActiveNav(section);
  renderSection(section);
});

document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  initNav();
  setMainDate();
  await loadUser();
  const section = initialSection();
  setActiveNav(section);
  renderSection(section);
});

