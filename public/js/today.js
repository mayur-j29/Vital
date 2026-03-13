import { apiFetch } from './api.js';
import { getESTDateString } from './date-utils.js';

const QUOTES = [
  'Small steps, steady days.',
  'Today counts more than yesterday.',
  'Gentle effort beats perfect plans.',
  'You are building a quieter life.',
  'Take care of the next hour only.',
  'Move, drink water, breathe.',
  'Your future self is grateful.',
  'Do one small kind thing for yourself.',
  'Consistency is a kindness.',
  'You can restart at any moment.',
  'Be where your feet are.',
  'You don’t have to chase everything.',
  'Slow is still progress.',
  'Today is enough.',
  'Take notes, not pressure.',
  'You’re allowed to go gently.',
  'Collect calm moments, not streaks.',
  'One honest log beats ten perfect ones.',
  'Sip, stretch, look away from screens.',
  'Health is a hundred small choices.',
  'Write what’s true, not what’s impressive.',
  'You’re allowed to enjoy this.',
  'Better breathing is better thinking.',
  'No rush. Just rhythm.',
  'Your body remembers your kindness.',
  'Track what matters, ignore the rest.',
  'Every log is a vote for your future.',
  'Let today be lighter.',
  'Clarity over intensity.',
  'You’re doing more than you think.'
];

function todayISO() {
  return getESTDateString();
}

function randomQuote() {
  const index = new Date().getDate() % QUOTES.length;
  return QUOTES[index];
}

const MOOD_SUGGESTIONS = {
  Happy: [
    'Share the joy: reach out to friends or family, or simply spread positivity to others.',
    'Be active & creative: dance, sing, create art, or lean into a hobby you enjoy.',
    'Engage in self-care: treat yourself to favorite food, a bath, or music you love.',
    'Do good deeds: volunteer or help someone else to extend the joy.',
    'Document the moment: take photos or write in a journal to remember this time.'
  ],
  Stressed: [
    'Try box breathing: inhale 4 seconds, hold 4, exhale 4 — repeat a few times.',
    'Move your body: a short walk, jog, or dance can release stress.',
    'Listen to calming music or a favorite playlist.',
    'Get some nature time: even 10 minutes in a green space can help.',
    'Stretch slowly or try progressive muscle relaxation.'
  ],
  Angry: [
    'Take a timeout: step away from the trigger to get perspective.',
    'Channel it physically: walk fast, run, or do an intense workout.',
    'Use slow breathing to bring your heart rate down.',
    'Use water: splash your face or take a shower to reset.',
    'Release tension safely: punch a pillow or tear up scrap paper.'
  ],
  Sad: [
    'Get into nature: a gentle walk in a park or outside can help.',
    'Cozy up with a blanket and a comforting movie or show.',
    'Take a warm bath or shower to soothe your body.',
    'Listen to music that lets you feel or express your emotions.',
    'Make or enjoy simple comfort food, tea, or a favorite snack.'
  ],
  Bored: [
    'Read a few pages of a book or article.',
    'Start a small movie or series session.',
    'Try a new recipe or snack idea.',
    'Go for a walk or explore a nearby area you don’t know well.',
    'Rearrange one drawer, shelf, or small corner.',
    'Journal your thoughts or write a short note to a friend.',
    'Do a puzzle: crossword, jigsaw, or Sudoku.',
    'Call or video chat with a friend or family member.',
    'Follow a quick YouTube yoga or workout video.',
    'Make a playlist for a specific mood or activity.',
    'Meditate for 5–10 minutes, even if it’s just breathing.',
    'Sketch, doodle, or try a tiny art experiment.',
    'Bake something simple and share it with someone.',
    'Declutter a small space to refresh your environment.',
    'Look at old photos and organize or favorite a few.',
    'Plan a future day trip or vacation idea.',
    'Learn a few basics of a new language.',
    'Spend time in nature, even just sitting outside.',
    'Take a short nap to reset your energy.'
  ]
};

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function renderTodaySection(container) {
  container.innerHTML = `
    <div class="stack">
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Quick log</h3>
            <p class="card-subtitle">Pick what you want to track, then fill in the details.</p>
          </div>
        </header>
        <div class="quick-strip" id="quick-strip">
          <button class="quick-chip" data-type="water">💧 <span>Water</span></button>
          <button class="quick-chip" data-type="steps">👣 <span>Steps</span></button>
          <button class="quick-chip" data-type="calories">🍲 <span>Calories / meal</span></button>
          <button class="quick-chip" data-type="sleep">😴 <span>Sleep</span></button>
          <button class="quick-chip" data-type="mood">🙂 <span>Mood</span></button>
        </div>
        <div class="quick-panel" id="quick-panel"></div>
      </section>

      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Today’s goals</h3>
            <p class="card-subtitle">A light checklist of what matters</p>
          </div>
        </header>
        <div id="today-goals" class="list"></div>
      </section>

      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Today’s log</h3>
            <p class="card-subtitle">Everything you’ve written down today</p>
          </div>
        </header>
        <div id="today-logs" class="list"></div>
      </section>

      <section>
        <p class="card-subtitle">${randomQuote()}</p>
      </section>
    </div>
  `;

  container.classList.add('section-visible');

  const quickStrip = container.querySelector('#quick-strip');
  const quickPanel = container.querySelector('#quick-panel');

  quickStrip.addEventListener('click', (e) => {
    const chip = e.target.closest('.quick-chip');
    if (!chip) return;

    chip.classList.remove('quick-add-press');
    void chip.offsetWidth;
    chip.classList.add('quick-add-press');

    const type = chip.dataset.type;
    renderQuickPanel(type, quickPanel, container);
  });

  await Promise.all([loadGoals(container), loadLogs(container)]);
}

function renderQuickPanel(type, panel, container) {
  if (type === 'water') {
    panel.innerHTML = `
      <div class="quick-panel-row">
        <div class="quick-panel-label">How many glasses of water?</div>
        <input type="range" id="water-range" min="0" max="20" value="1" />
        <div class="quick-slider-value"><span id="water-value">1</span> glass(es)</div>
        <button class="btn small primary" id="water-log-btn">Log water</button>
      </div>
    `;
    const range = panel.querySelector('#water-range');
    const valueEl = panel.querySelector('#water-value');
    const btn = panel.querySelector('#water-log-btn');
    range.addEventListener('input', () => {
      valueEl.textContent = range.value;
    });
    btn.addEventListener('click', () => {
      const amount = Number(range.value);
      if (!amount) return;
      quickLog(container, {
        category: 'water',
        label: 'Water (glasses)',
        value: amount
      });
    });
    return;
  }

  if (type === 'steps') {
    panel.innerHTML = `
      <div class="quick-panel-row">
        <div class="quick-panel-label">How many steps?</div>
        <input type="number" id="steps-input" min="0" step="100" value="1000" />
        <button class="btn small primary" id="steps-log-btn">Log steps</button>
      </div>
    `;
    const input = panel.querySelector('#steps-input');
    const btn = panel.querySelector('#steps-log-btn');
    btn.addEventListener('click', () => {
      const value = Number(input.value);
      if (!value) return;
      quickLog(container, {
        category: 'steps',
        label: 'Steps',
        value
      });
    });
    return;
  }

  if (type === 'calories') {
    panel.innerHTML = `
      <div class="quick-panel-row">
        <div class="quick-panel-label">Track calories or a meal.</div>
        <div class="stack-row">
          <button class="btn small primary" data-mode="calories" id="calories-mode-cal">Calories</button>
          <button class="btn small ghost" data-mode="meal" id="calories-mode-meal">Meal</button>
        </div>
        <div id="calories-body"></div>
      </div>
    `;
    const body = panel.querySelector('#calories-body');
    const calBtn = panel.querySelector('#calories-mode-cal');
    const mealBtn = panel.querySelector('#calories-mode-meal');

    function setMode(mode) {
      const activeIsCalories = mode === 'calories';
      calBtn.classList.toggle('primary', activeIsCalories);
      calBtn.classList.toggle('ghost', !activeIsCalories);
      mealBtn.classList.toggle('primary', !activeIsCalories);
      mealBtn.classList.toggle('ghost', activeIsCalories);

      if (activeIsCalories) {
        body.innerHTML = `
          <div class="stack">
            <input type="number" id="calories-input" min="0" step="10" placeholder="Calories" />
            <button class="btn small primary" id="calories-log-btn">Log calories</button>
          </div>
        `;
        const input = body.querySelector('#calories-input');
        const btn = body.querySelector('#calories-log-btn');
        btn.addEventListener('click', () => {
          const value = Number(input.value);
          if (!value) return;
          quickLog(container, {
            category: 'calories',
            label: 'Calories',
            value
          });
        });
      } else {
        body.innerHTML = `
          <div class="stack">
            <input type="text" id="meal-input" placeholder="Describe the meal" />
            <button class="btn small primary" id="meal-log-btn">Log meal</button>
          </div>
        `;
        const input = body.querySelector('#meal-input');
        const btn = body.querySelector('#meal-log-btn');
        btn.addEventListener('click', () => {
          const text = input.value.trim();
          if (!text) return;
          quickLog(container, {
            category: 'meal',
            label: `Meal: ${text}`,
            value: null
          });
        });
      }
    }

    calBtn.addEventListener('click', () => setMode('calories'));
    mealBtn.addEventListener('click', () => setMode('meal'));
    setMode('calories');
    return;
  }

  if (type === 'sleep') {
    panel.innerHTML = `
      <div class="quick-panel-row">
        <div class="quick-panel-label">How much sleep did you get last night (into this morning)?</div>
        <div class="stack-row">
          <div class="form-group" style="flex:1;">
            <label for="sleep-hours">Hours</label>
            <input type="number" id="sleep-hours" min="0" max="24" step="1" value="7" />
          </div>
          <div class="form-group" style="flex:1;">
            <label for="sleep-minutes">Minutes</label>
            <input type="number" id="sleep-minutes" min="0" max="55" step="5" value="0" />
          </div>
        </div>
        <p class="quick-panel-note">This is the sleep from last night into this morning — how rested you feel starting today.</p>
        <button class="btn small primary" id="sleep-log-btn">Log sleep</button>
      </div>
    `;
    const hoursEl = panel.querySelector('#sleep-hours');
    const minutesEl = panel.querySelector('#sleep-minutes');
    const btn = panel.querySelector('#sleep-log-btn');
    btn.addEventListener('click', () => {
      const hours = Number(hoursEl.value) || 0;
      const minutes = Number(minutesEl.value) || 0;
      const total = hours + minutes / 60;
      if (!total) return;
      quickLog(container, {
        category: 'sleep',
        label: 'Sleep (last night)',
        value: Number(total.toFixed(2))
      });
    });
    return;
  }

  if (type === 'mood') {
    panel.innerHTML = `
      <div class="quick-panel-row">
        <div class="quick-panel-label">How do you feel right now?</div>
        <div class="stack-row">
          <button class="btn small ghost" data-mood="Happy">Happy</button>
          <button class="btn small ghost" data-mood="Stressed">Stressed</button>
          <button class="btn small ghost" data-mood="Angry">Angry</button>
          <button class="btn small ghost" data-mood="Sad">Sad</button>
          <button class="btn small ghost" data-mood="Bored">Bored</button>
        </div>
        <div id="mood-dialog"></div>
      </div>
    `;
    const dialogContainer = panel.querySelector('#mood-dialog');

    panel.querySelectorAll('[data-mood]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mood = btn.dataset.mood;
        quickLog(container, {
          category: 'mood',
          label: `Mood: ${mood}`,
          value: null
        });

        const suggestions = shuffle(MOOD_SUGGESTIONS[mood] || []).slice(0, 5);
        dialogContainer.innerHTML = `
          <div class="mood-dialog">
            <h4 class="mood-dialog-title">${mood}</h4>
            <ul class="mood-dialog-list">
              ${suggestions.map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        `;
      });
    });
  }
}

async function quickLog(container, { category, label, value }) {
  const log_date = todayISO();
  const optimistic = {
    id: `temp-${Date.now()}`,
    log_date,
    category,
    label,
    value,
    created_at: new Date().toISOString()
  };
  appendLog(container, optimistic);

  try {
    const body = { log_date, category, label };
    if (value != null) body.value = value;
    const { log } = await apiFetch('/logs', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    replaceTempLog(container, optimistic.id, log);
  } catch (err) {
    removeLog(container, optimistic.id);
  }
}

async function loadGoals(container) {
  const listEl = container.querySelector('#today-goals');
  listEl.textContent = 'Loading...';

  try {
    const { goals } = await apiFetch('/goals');
    const active = goals.filter((g) => !g.is_completed);
    if (active.length === 0) {
      listEl.textContent = 'No goals yet. Add some in the Goals tab.';
      return;
    }
    listEl.innerHTML = active
      .map(
        (g) => `
      <div class="list-item">
        <div>
          <div class="goal-title">${g.title}</div>
          <div class="list-meta">${g.category || 'general'}${
          g.deadline ? ` · due ${g.deadline}` : ''
        }</div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    listEl.textContent = 'Could not load goals.';
  }
}

async function loadLogs(container) {
  const listEl = container.querySelector('#today-logs');
  listEl.textContent = 'Loading...';
  try {
    const { logs } = await apiFetch(`/logs?date=${todayISO()}`);
    if (!logs.length) {
      listEl.textContent = 'Nothing logged yet today.';
      return;
    }
    listEl.innerHTML = logs.map((log) => logRow(log)).join('');
  } catch (err) {
    listEl.textContent = 'Could not load logs.';
  }
}

function logRow(log) {
  return `
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

function appendLog(container, log) {
  const listEl = container.querySelector('#today-logs');
  if (listEl.textContent === 'Loading...' || listEl.textContent.startsWith('Nothing')) {
    listEl.textContent = '';
  }
  listEl.insertAdjacentHTML('afterbegin', logRow(log));
}

function replaceTempLog(container, tempId, persisted) {
  const listEl = container.querySelector('#today-logs');
  const temp = listEl.querySelector(`[data-log-id="${tempId}"]`);
  if (!temp) return;
  temp.outerHTML = logRow(persisted);
}

function removeLog(container, id) {
  const listEl = container.querySelector('#today-logs');
  const el = listEl.querySelector(`[data-log-id="${id}"]`);
  if (el) el.remove();
}

