import { apiFetch } from './api.js';
import { getESTMonth } from './date-utils.js';

function currentMonth() {
  return getESTMonth();
}

export async function renderExpensesSection(container) {
  const month = currentMonth();

  container.innerHTML = `
    <div class="stack">
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Expenses</h3>
            <p class="card-subtitle">A simple running view of this month.</p>
          </div>
        </header>

        <div class="stack">
          <div class="stack-row" style="align-items:center; justify-content:space-between;">
            <div class="form-group">
              <label for="expense-month">Month</label>
              <input type="month" id="expense-month" value="${month}" />
            </div>
            <div>
              <span class="card-subtitle">Total this month</span>
              <div class="mono" id="expense-total">0.00</div>
            </div>
          </div>

          <form id="expense-form" class="stack">
            <div class="stack-row">
              <div class="form-group" style="flex:1;">
                <label for="expense-amount">Amount</label>
                <input id="expense-amount" name="amount" type="number" step="0.01" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label for="expense-label">Label</label>
                <input id="expense-label" name="label" type="text" required />
              </div>
            </div>
            <div class="stack-row">
              <div class="form-group" style="flex:1;">
                <label for="expense-category">Category</label>
                <select id="expense-category" name="category">
                  <option value="">Select</option>
                  <option value="Food">Food</option>
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label for="expense-date">Date</label>
                <input id="expense-date" name="date" type="date" required />
              </div>
            </div>
            <p class="form-error" id="expense-error"></p>
            <button type="submit" class="btn primary full-width" id="expense-submit">
              <span class="btn-label">Add expense</span>
              <span class="btn-spinner" aria-hidden="true"></span>
              <span class="btn-check" aria-hidden="true">✓</span>
            </button>
          </form>

          <div class="stack" id="expenses-list"></div>
        </div>
      </section>
    </div>
  `;

  container.classList.add('section-visible');

  const monthInput = container.querySelector('#expense-month');
  const dateInput = container.querySelector('#expense-date');
  const totalEl = container.querySelector('#expense-total');
  const listEl = container.querySelector('#expenses-list');
  const form = container.querySelector('#expense-form');
  const errorEl = container.querySelector('#expense-error');
  const submitBtn = container.querySelector('#expense-submit');
  const categorySelect = container.querySelector('#expense-category');
  const dateMonthSync = () => {
    if (!dateInput.value) return;
    const [y, m, d] = dateInput.value.split('-');
    const [my, mm] = monthInput.value.split('-');
    if (y !== my || m !== mm) {
      dateInput.value = `${my}-${mm}-${d || '01'}`;
    }
  };

  dateInput.value = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

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

  async function loadExpenses() {
    listEl.textContent = 'Loading...';
    try {
      const { expenses, total } = await apiFetch(
        `/expenses?month=${monthInput.value}`
      );
      totalEl.textContent = total.toFixed(2);
      if (!expenses.length) {
        listEl.textContent = 'No expenses logged this month.';
        return;
      }
      const grouped = expenses.reduce((acc, e) => {
        acc[e.date] = acc[e.date] || [];
        acc[e.date].push(e);
        return acc;
      }, {});
      listEl.innerHTML = Object.entries(grouped)
        .map(
          ([date, items]) => `
          <div class="stack">
            <div class="badge">${date}</div>
            <div class="list">
              ${items
                .map(
                  (e) => `
                <div class="list-item" data-expense-id="${e.id}">
                  <div>
                    <div>${e.label || e.category || 'Expense'}</div>
                    <div class="list-meta">${e.category || 'Uncategorized'}</div>
                  </div>
                  <div class="mono">${e.amount.toFixed(2)}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
        )
        .join('');
    } catch (err) {
      listEl.textContent = 'Could not load expenses.';
    }
  }

  monthInput.addEventListener('change', () => {
    // keep date in the same chosen month to avoid confusion
    dateMonthSync();
    loadExpenses();
  });

  dateInput.addEventListener('change', () => {
    // if user changes date manually, keep month picker in sync
    if (!dateInput.value) return;
    const [y, m] = dateInput.value.split('-');
    monthInput.value = `${y}-${m}`;
  });

  categorySelect.addEventListener('change', () => {
    const isOther = categorySelect.value === 'Other';
    let customInput = container.querySelector('#expense-category-custom');
    if (isOther) {
      if (!customInput) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.hidden = true;
        wrapper.innerHTML = `
          <label for="expense-category-custom">Specify category (1–2 words)</label>
          <input id="expense-category-custom" name="category_custom" type="text" placeholder="e.g. Travel" />
        `;
        categorySelect.closest('.form-group').after(wrapper);
        customInput = wrapper.querySelector('input');
      }
      customInput.parentElement.hidden = false;
      customInput.focus();
    } else if (customInput) {
      customInput.value = '';
      customInput.parentElement.hidden = true;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const formData = new FormData(form);
    const amount = Number(formData.get('amount'));
    const label = formData.get('label')?.toString().trim();
    const date = formData.get('date')?.toString();

    if (!amount || !label || !date) {
      errorEl.textContent = 'Amount, label, and date are required.';
      return;
    }

    let category = formData.get('category') || null;
    const customCategory = formData.get('category_custom')?.toString().trim();
    if (category === 'Other' && customCategory) {
      category = customCategory;
    }

    const payload = {
      amount,
      label,
      category,
      date
    };

    setButtonState('loading');
    try {
      await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadExpenses();
      form.reset();
      dateInput.value = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      setButtonState('success');
    } catch (err) {
      errorEl.textContent = err.message || 'Could not save expense.';
      setButtonState('idle');
    }
  });

  await loadExpenses();
}

