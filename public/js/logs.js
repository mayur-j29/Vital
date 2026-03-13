import { apiFetch } from './api.js';
import { getESTDateString } from './date-utils.js';

function formatISO(date) {
  return date.toISOString().slice(0, 10);
}

export async function renderLogSection(container) {
  const todayEST = getESTDateString();
  container.innerHTML = `
    <div class="stack">
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Daily log</h3>
            <p class="card-subtitle">Browse your days one at a time.</p>
          </div>
        </header>
        <div class="stack">
          <div class="stack-row" style="align-items:center; justify-content:space-between;">
            <div class="stack-row" style="align-items:center;">
              <button class="btn ghost small" id="log-prev">←</button>
              <input type="date" id="log-date" value="${todayEST}" />
              <button class="btn ghost small" id="log-next">→</button>
            </div>
            <span class="badge" id="log-date-label">Today</span>
          </div>

          <form id="log-form" class="stack">
            <div class="stack-row">
              <div class="form-group" style="flex:1;">
                <label for="log-category">Category</label>
                <select id="log-category" name="category" required>
                  <option value="">Select</option>
                  <option value="calories">Calories</option>
                  <option value="water">Water</option>
                  <option value="steps">Steps</option>
                  <option value="sleep">Sleep</option>
                  <option value="mood">Mood</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="form-group" id="log-category-other-group" hidden>
              <label for="log-category-other">Specify category (1–2 words)</label>
              <input id="log-category-other" name="category_other" type="text" placeholder="e.g. Focus" />
            </div>
            <div class="stack-row">
              <div class="form-group" style="flex:1;">
                <label for="log-value">Value</label>
                <input id="log-value" name="value" type="number" step="0.01" />
              </div>
              <div class="form-group" style="flex:1;">
                <label for="log-unit">Unit</label>
                <input id="log-unit" name="unit" type="text" placeholder="e.g. glasses, kcal, min" />
              </div>
            </div>
            <div class="form-group">
              <label for="log-note">Note</label>
              <input id="log-note" name="note" type="text" />
            </div>
            <p class="form-error" id="log-error"></p>
            <button type="submit" class="btn primary full-width" id="log-submit">
              <span class="btn-label">Add entry</span>
              <span class="btn-spinner" aria-hidden="true"></span>
              <span class="btn-check" aria-hidden="true">✓</span>
            </button>
          </form>

          <div class="list" id="logs-list"></div>
        </div>
      </section>
    </div>
  `;

  container.classList.add('section-visible');

  const dateInput = container.querySelector('#log-date');
  const prevBtn = container.querySelector('#log-prev');
  const nextBtn = container.querySelector('#log-next');
  const dateLabel = container.querySelector('#log-date-label');
  const form = container.querySelector('#log-form');
  const errorEl = container.querySelector('#log-error');
  const submitBtn = container.querySelector('#log-submit');
  const listEl = container.querySelector('#logs-list');
  const categorySelect = container.querySelector('#log-category');
  const categoryOtherGroup = container.querySelector('#log-category-other-group');
  const categoryOtherInput = container.querySelector('#log-category-other');

  function isToday(dateStr) {
    return dateStr === getESTDateString();
  }

  function updateDateLabel() {
    const value = dateInput.value;
    if (isToday(value)) {
      dateLabel.textContent = 'Today';
    } else {
      dateLabel.textContent = value;
    }
  }

  async function loadLogsForDate() {
    listEl.textContent = 'Loading...';
    try {
      const { logs } = await apiFetch(`/logs?date=${dateInput.value}`);
      if (!logs.length) {
        listEl.textContent = 'Nothing logged for this date.';
        return;
      }
      listEl.innerHTML = logs
        .map(
          (log) => `
        <div class="list-item" data-log-id="${log.id}">
          <div>
            <div>${log.label}</div>
            <div class="list-meta">${log.category}${
            log.value != null ? ` · <span class="mono">${log.value}</span>` : ''
          }</div>
          </div>
        </div>
      `
        )
        .join('');
    } catch {
      listEl.textContent = 'Could not load logs.';
    }
  }

  prevBtn.addEventListener('click', () => {
    const d = new Date(dateInput.value);
    d.setDate(d.getDate() - 1);
    dateInput.value = formatISO(d);
    updateDateLabel();
    loadLogsForDate();
  });

  nextBtn.addEventListener('click', () => {
    const d = new Date(dateInput.value);
    d.setDate(d.getDate() + 1);
    dateInput.value = formatISO(d);
    updateDateLabel();
    loadLogsForDate();
  });

  dateInput.addEventListener('change', () => {
    updateDateLabel();
    loadLogsForDate();
  });

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
    let category = formData.get('category')?.toString().trim();
    const categoryOther = formData.get('category_other')?.toString().trim();
    if (category === 'other' && categoryOther) {
      category = categoryOther;
    }
    const valueRaw = formData.get('value');
    const value = valueRaw !== '' && valueRaw != null ? Number(valueRaw) : null;
    const unit = formData.get('unit')?.toString().trim() || '';
    const note = formData.get('note')?.toString().trim() || null;

    if (!category) {
      errorEl.textContent = 'Category is required.';
      return;
    }

    const labelParts = [category];
    if (value != null) labelParts.push(String(value));
    if (unit) labelParts.push(unit);
    const label = labelParts.join(' ');

    const payload = {
      log_date: dateInput.value,
      category,
      label,
      value,
      note: note || null
    };

    const optimistic = {
      id: `temp-${Date.now()}`,
      ...payload
    };

    const isPast = new Date(dateInput.value + 'T12:00:00') < new Date(getESTDateString() + 'T12:00:00');

    if (isPast) {
      errorEl.textContent = 'Past dates are read-only.';
      return;
    }

    if (listEl.textContent.startsWith('Nothing')) {
      listEl.textContent = '';
    }
    listEl.insertAdjacentHTML(
      'afterbegin',
      `
      <div class="list-item" data-log-id="${optimistic.id}">
        <div>
          <div>${optimistic.label}</div>
          <div class="list-meta">${optimistic.category}${
        optimistic.value != null ? ` · <span class="mono">${optimistic.value}</span>` : ''
      }</div>
        </div>
      </div>
    `
    );

    setButtonState('loading');

    try {
      const { log } = await apiFetch('/logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const tempEl = listEl.querySelector(`[data-log-id="${optimistic.id}"]`);
      if (tempEl) {
        tempEl.outerHTML = `
          <div class="list-item" data-log-id="${log.id}">
            <div>
              <div>${log.label}</div>
              <div class="list-meta">${log.category}${
          log.value != null ? ` · <span class="mono">${log.value}</span>` : ''
        }</div>
            </div>
          </div>
        `;
      }
      form.reset();
      setButtonState('success');
    } catch (err) {
      errorEl.textContent = err.message || 'Could not save log.';
      const tempEl = listEl.querySelector(`[data-log-id="${optimistic.id}"]`);
      if (tempEl) tempEl.remove();
      setButtonState('idle');
    }
  });

  updateDateLabel();
  await loadLogsForDate();
}

