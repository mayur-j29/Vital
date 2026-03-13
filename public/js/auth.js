import { apiFetch, setToken, getToken } from './api.js';

const form = document.getElementById('auth-form');
const nameGroup = document.getElementById('name-group');
const errorEl = document.getElementById('auth-error');
const submitBtn = document.getElementById('auth-submit');
const btnLabel = submitBtn.querySelector('.btn-label');
const toggleButtons = document.querySelectorAll('.auth-toggle-btn');
const toggleIndicator = document.querySelector('.auth-toggle-indicator');

let mode = 'login';

if (getToken()) {
  window.location.href = '/app.html';
}

function setMode(nextMode) {
  mode = nextMode;
  toggleButtons.forEach((btn, index) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    if (active) {
      const offset = index * submitBtn.offsetWidth; // just to trigger paint
      toggleIndicator.style.transform = `translateX(${index * 100}%)`;
    }
  });
  nameGroup.hidden = mode !== 'register';
  btnLabel.textContent = mode === 'login' ? 'Login' : 'Create account';
  errorEl.textContent = '';
}

toggleButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

function setButtonState(state) {
  submitBtn.classList.remove('btn-loading', 'btn-success');
  if (state === 'loading') {
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
  } else if (state === 'success') {
    submitBtn.disabled = false;
    submitBtn.classList.add('btn-success');
  } else {
    submitBtn.disabled = false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const name = form.name?.value.trim();

  if (!email || !password || (mode === 'register' && !name)) {
    errorEl.textContent = 'Please fill in all required fields.';
    return;
  }

  setButtonState('loading');

  try {
    const payload = { email, password };
    if (mode === 'register') payload.name = name;

    const data = await apiFetch(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    setButtonState('success');

    setTimeout(() => {
      window.location.href = '/app.html';
    }, 800);
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || 'Incorrect email or password. Please try again.';
    setButtonState('idle');
    errorEl.setAttribute('aria-live', 'polite');
  }
});

setMode('login');

