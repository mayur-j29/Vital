import { apiFetch } from './api.js';

export async function renderGoalsSection(container) {
  container.innerHTML = `
    <div class="stack">
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Goals</h3>
            <p class="card-subtitle">Define what “good enough” looks like.</p>
          </div>
          <button class="btn small primary" id="toggle-goal-form">Add goal</button>
        </header>
        <div class="stack" id="goals-list"></div>
      </section>

      <section class="card goal-form-card" id="goal-form-card" hidden>
        <div class="slide-panel-header">
          <h4 class="slide-panel-title">New goal</h4>
        </div>
        <form id="goal-form" class="stack" novalidate>
          <div class="form-group">
            <label for="goal-title">Title</label>
            <input id="goal-title" name="title" type="text" required />
          </div>
          <div class="form-group">
            <label for="goal-category">Category</label>
            <select id="goal-category" name="category">
              <option value="">Select category</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="daily">Daily</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group" id="goal-category-other-group" hidden>
            <label for="goal-category-other">Specify category (1–2 words)</label>
            <input id="goal-category-other" name="category_other" type="text" placeholder="e.g. Mindset" />
          </div>
          <div class="form-group">
            <label for="goal-deadline">Deadline</label>
            <input id="goal-deadline" name="deadline" type="date" />
          </div>
          <div class="form-group">
            <label for="goal-description">Description</label>
            <textarea id="goal-description" name="description" rows="3" placeholder="Add any helpful details for this goal."></textarea>
          </div>
          <p class="form-error" id="goal-error"></p>
          <button type="submit" class="btn primary full-width" id="goal-submit">
            <span class="btn-label">Save goal</span>
            <span class="btn-spinner" aria-hidden="true"></span>
            <span class="btn-check" aria-hidden="true">✓</span>
          </button>
        </form>
      </section>
    </div>
  `;

  container.classList.add('section-visible');

  const formCard = container.querySelector('#goal-form-card');
  const toggleBtn = container.querySelector('#toggle-goal-form');
  const form = container.querySelector('#goal-form');
  const errorEl = container.querySelector('#goal-error');
  const submitBtn = container.querySelector('#goal-submit');
  const categorySelect = container.querySelector('#goal-category');
  const categoryOtherGroup = container.querySelector('#goal-category-other-group');
  const categoryOtherInput = container.querySelector('#goal-category-other');

  function toggleFormVisibility() {
    const isHidden = formCard.hasAttribute('hidden');
    if (isHidden) {
      formCard.removeAttribute('hidden');
      toggleBtn.textContent = 'Close';
    } else {
      formCard.setAttribute('hidden', '');
      toggleBtn.textContent = 'Add goal';
    }
  }

  toggleBtn.addEventListener('click', toggleFormVisibility);

  categorySelect.addEventListener('change', () => {
    const isOther = categorySelect.value === 'other';
    if (isOther) {
      categoryOtherGroup.removeAttribute('hidden');
      categoryOtherInput.focus();
    } else {
      categoryOtherGroup.setAttribute('hidden', '');
      categoryOtherInput.value = '';
    }
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

    const formData = new FormData(form);
    const title = formData.get('title')?.toString().trim();

    if (!title) {
      errorEl.textContent = 'Title is required.';
      return;
    }

    let category = formData.get('category') || null;
    const otherCategory = formData.get('category_other')?.toString().trim();
    if (category === 'other' && otherCategory) {
      category = otherCategory;
    }

    const payload = {
      title,
      category,
      description: formData.get('description')?.toString().trim() || null,
      deadline: formData.get('deadline') || null
    };

    setButtonState('loading');
    try {
      const { goal } = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      prependGoal(container, goal);
      form.reset();
      setButtonState('success');
      setTimeout(() => {
        setButtonState('idle');
        toggleFormVisibility();
      }, 400);
    } catch (err) {
      errorEl.textContent = err.message || 'Could not save goal.';
      setButtonState('idle');
    }
  });

  await loadGoals(container);
}

async function loadGoals(container) {
  const list = container.querySelector('#goals-list');
  list.textContent = 'Loading...';

  try {
    const { goals } = await apiFetch('/goals');
    if (!goals.length) {
      list.textContent = 'No goals yet. Add one to get started.';
      return;
    }
    list.innerHTML = goals.map(goalCard).join('');

    list.addEventListener('click', async (e) => {
      const completeBtn = e.target.closest('[data-complete-id]');
      if (!completeBtn) return;
      const id = completeBtn.dataset.completeId;
      const card = list.querySelector(`[data-goal-id="${id}"]`);
      const already = card.classList.contains('goal-completed');

      card.classList.toggle('goal-completed', !already);

      try {
        await apiFetch(`/goals/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_completed: already ? 0 : 1 })
        });
      } catch {
        card.classList.toggle('goal-completed', already);
      }
    });
  } catch (err) {
    list.textContent = 'Could not load goals.';
  }
}

function goalCard(goal) {
  const completed = !!goal.is_completed;
  const hasDescription = goal.description && goal.description.trim();
  return `
    <article class="card ${completed ? 'goal-completed' : ''}" data-goal-id="${goal.id}">
      <header class="card-header">
        <div>
          <h4 class="goal-title">${goal.title}</h4>
          <p class="card-subtitle">
            ${goal.category || 'general'}${
    goal.deadline ? ` · due <span class="mono">${goal.deadline}</span>` : ''
  }
          </p>
        </div>
        <button class="btn small ghost" data-complete-id="${goal.id}">
          ${completed ? 'Mark active' : 'Mark done'}
        </button>
      </header>
      ${hasDescription ? `<div class="list-meta">${goal.description.trim()}</div>` : ''}
    </article>
  `;
}

function prependGoal(container, goal) {
  const list = container.querySelector('#goals-list');
  if (!list.innerHTML || list.textContent.startsWith('No goals')) {
    list.innerHTML = '';
  }
  list.insertAdjacentHTML('afterbegin', goalCard(goal));
}

