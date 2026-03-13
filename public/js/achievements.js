import { apiFetch } from './api.js';

export async function renderRewardsSection(container) {
  container.innerHTML = `
    <div class="stack">
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title" id="rewards-title">Achievements</h3>
            <p class="card-subtitle" id="rewards-subtitle">Celebrate the quiet wins.</p>
          </div>
        </header>

        <div class="stack">
          <div class="rewards-toggle stack-row">
            <button class="btn small primary" data-tab="achievements">Achievements</button>
            <button class="btn small ghost" data-tab="prizes">Prizes</button>
          </div>

          <div id="tab-achievements" class="rewards-content stack"></div>
          <div id="tab-prizes" class="rewards-content stack" hidden></div>
        </div>
      </section>
    </div>
  `;

  container.classList.add('section-visible');

  const tabButtons = container.querySelectorAll('[data-tab]');
  const achievementsTab = container.querySelector('#tab-achievements');
  const prizesTab = container.querySelector('#tab-prizes');
  const titleEl = container.querySelector('#rewards-title');
  const subtitleEl = container.querySelector('#rewards-subtitle');

  function setTab(name) {
    tabButtons.forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('primary', active);
      btn.classList.toggle('ghost', !active);
    });
    achievementsTab.hidden = name !== 'achievements';
    prizesTab.hidden = name !== 'prizes';

    if (name === 'achievements') {
      titleEl.textContent = 'Achievements';
      subtitleEl.textContent = 'Notice and name the wins you care about.';
    } else {
      titleEl.textContent = 'Prizes';
      subtitleEl.textContent = 'Decide how you’ll reward yourself when habits stick.';
    }
  }

  tabButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      setTab(btn.dataset.tab);
    })
  );

  await Promise.all([renderAchievements(achievementsTab), renderPrizes(prizesTab)]);
  setTab('achievements');
}

async function renderAchievements(container) {
  container.innerHTML = `
    <form id="achievement-form" class="stack">
      <div class="stack-row achievement-title-row">
        <div class="form-group achievement-title-group">
          <label for="ach-title">Title</label>
          <input id="ach-title" name="title" type="text" required />
        </div>
        <div class="form-group achievement-icon-group">
          <label for="ach-icon">Icon</label>
          <input id="ach-icon" name="icon" type="text" placeholder="🌱" maxlength="4" />
        </div>
      </div>
      <div class="form-group">
        <label for="ach-desc">Description</label>
        <input id="ach-desc" name="description" type="text" />
      </div>
      <p class="form-error" id="ach-error"></p>
      <button type="submit" class="btn primary full-width" id="ach-submit">
        <span class="btn-label">Add achievement</span>
        <span class="btn-spinner" aria-hidden="true"></span>
        <span class="btn-check" aria-hidden="true">✓</span>
      </button>
    </form>
    <div class="stack" id="ach-list"></div>
  `;

  const form = container.querySelector('#achievement-form');
  const errorEl = container.querySelector('#ach-error');
  const submitBtn = container.querySelector('#ach-submit');
  const listEl = container.querySelector('#ach-list');

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

  async function loadAchievements() {
    listEl.textContent = 'Loading...';
    try {
      const { achievements } = await apiFetch('/achievements');
      if (!achievements.length) {
        listEl.textContent = 'No achievements yet. Add your first one.';
        return;
      }
      listEl.innerHTML = achievements
        .map(
          (a) => `
          <article class="card">
            <header class="card-header">
              <div>
                <h4 class="card-title">${a.icon || '🌱'} ${a.title}</h4>
                <p class="card-subtitle">${a.description || ''}</p>
              </div>
              <span class="badge">${new Date(a.unlocked_at).toLocaleDateString()}</span>
            </header>
          </article>
        `
        )
        .join('');
    } catch {
      listEl.textContent = 'Could not load achievements.';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const formData = new FormData(form);
    const title = formData.get('title')?.toString().trim();

    if (!title) {
      errorEl.textContent = 'Title is required.';
      return;
    }

    const payload = {
      title,
      description: formData.get('description') || null,
      icon: formData.get('icon') || null
    };

    setButtonState('loading');
    try {
      await apiFetch('/achievements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadAchievements();
      form.reset();
      setButtonState('success');
    } catch (err) {
      errorEl.textContent = err.message || 'Could not save achievement.';
      setButtonState('idle');
    }
  });

  await loadAchievements();
}

async function renderPrizes(container) {
  container.innerHTML = `
    <form id="prize-form" class="stack">
      <div class="form-group">
        <label for="prize-title">Prize</label>
        <input id="prize-title" name="title" type="text" placeholder="New shoes after 30 workouts" required />
      </div>
      <div class="form-group">
        <label for="prize-desc">Description</label>
        <input id="prize-desc" name="description" type="text" />
      </div>
      <div class="form-group">
        <label for="prize-points">Points required (optional)</label>
        <input id="prize-points" name="points_required" type="number" />
      </div>
      <p class="form-error" id="prize-error"></p>
      <button type="submit" class="btn primary full-width" id="prize-submit">
        <span class="btn-label">Save prize</span>
        <span class="btn-spinner" aria-hidden="true"></span>
        <span class="btn-check" aria-hidden="true">✓</span>
      </button>
    </form>
    <div class="stack" id="prize-list"></div>
  `;

  const form = container.querySelector('#prize-form');
  const errorEl = container.querySelector('#prize-error');
  const submitBtn = container.querySelector('#prize-submit');
  const listEl = container.querySelector('#prize-list');

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

  async function loadPrizes() {
    listEl.textContent = 'Loading...';
    try {
      const { prizes } = await apiFetch('/prizes');
      if (!prizes.length) {
        listEl.textContent = 'No prizes yet. Add something you’d like to earn.';
        return;
      }
      listEl.innerHTML = prizes
        .map(
          (p) => `
          <article class="card" data-prize-id="${p.id}">
            <header class="card-header">
              <div>
                <h4 class="card-title">${p.title}</h4>
                <p class="card-subtitle">${p.description || ''}</p>
              </div>
              <div class="stack" style="align-items:flex-end;">
                ${
                  p.points_required
                    ? `<span class="badge">${p.points_required} pts</span>`
                    : ''
                }
                <button class="btn small ghost" data-claim-id="${p.id}">
                  ${p.is_claimed ? 'Claimed' : 'Mark claimed'}
                </button>
              </div>
            </header>
          </article>
        `
        )
        .join('');

      listEl.addEventListener('click', async (e) => {
        const claimBtn = e.target.closest('[data-claim-id]');
        if (!claimBtn) return;
        const id = claimBtn.dataset.claimId;
        const card = listEl.querySelector(`[data-prize-id="${id}"]`);
        const isClaimed = claimBtn.textContent === 'Claimed';

        claimBtn.textContent = isClaimed ? 'Mark claimed' : 'Claimed';

        try {
          await apiFetch(`/prizes/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_claimed: isClaimed ? 0 : 1 })
          });
        } catch {
          claimBtn.textContent = isClaimed ? 'Claimed' : 'Mark claimed';
        }
      });
    } catch {
      listEl.textContent = 'Could not load prizes.';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const formData = new FormData(form);
    const title = formData.get('title')?.toString().trim();
    if (!title) {
      errorEl.textContent = 'Title is required.';
      return;
    }

    const payload = {
      title,
      description: formData.get('description') || null,
      points_required: formData.get('points_required')
        ? Number(formData.get('points_required'))
        : null
    };

    setButtonState('loading');
    try {
      await apiFetch('/prizes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadPrizes();
      form.reset();
      setButtonState('success');
    } catch (err) {
      errorEl.textContent = err.message || 'Could not save prize.';
      setButtonState('idle');
    }
  });

  await loadPrizes();
}

