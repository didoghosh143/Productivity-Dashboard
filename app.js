/* ============================================================
   app.js — Productivity Dashboard
   All logic: theme, clock, weather, todo, planner,
              goals, pomodoro, motivation quotes
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────
//  UTILITY
// ─────────────────────────────────────────────

/** Safely escape HTML to prevent XSS when inserting user text. */
function escHtml(text) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(text)));
  return d.innerHTML;
}

/** Generate a numeric timestamp-based unique id. */
function uid() { return Date.now() + Math.random(); }

// ─────────────────────────────────────────────
//  THEME
// ─────────────────────────────────────────────

const THEMES = ['dark-black', 'dark-navy', 'dark-graphite', 'light'];
let themeIndex = 0;

function initTheme() {
  const saved = localStorage.getItem('dashboardTheme') || 'dark-black';
  themeIndex = THEMES.indexOf(saved);
  if (themeIndex === -1) themeIndex = 0;
  applyTheme();
}

function applyTheme() {
  document.body.className = THEMES[themeIndex];
  document.getElementById('theme-label').textContent = THEMES[themeIndex];
  localStorage.setItem('dashboardTheme', THEMES[themeIndex]);
}

function cycleTheme() {
  themeIndex = (themeIndex + 1) % THEMES.length;
  applyTheme();
}

// ─────────────────────────────────────────────
//  CLOCK
// ─────────────────────────────────────────────

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  document.getElementById('date').textContent = now.toLocaleDateString([], {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ─────────────────────────────────────────────
//  WEATHER
// ─────────────────────────────────────────────

async function fetchWeather() {
  const apiKey  = localStorage.getItem('weatherApiKey');
  const city    = localStorage.getItem('weatherCity') || 'Bankura';
  const textEl  = document.getElementById('weather-text');
  const loaderEl= document.getElementById('weather-loader');

  loaderEl.style.display = 'inline-block';
  textEl.textContent = 'Fetching…';

  if (apiKey) {
    try {
      const res  = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(city)}&aqi=no`
      );
      if (!res.ok) throw new Error('WeatherAPI error');
      const data = await res.json();
      loaderEl.style.display = 'none';
      textEl.textContent =
        `${data.current.temp_c}°C ${data.current.condition.text} — ${city}`;
      return;
    } catch (_) { /* fall through to Open-Meteo */ }
  }

  // Open-Meteo fallback
  try {
    const geoRes  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) throw new Error('City not found');

    const { latitude, longitude } = geoData.results[0];
    const wRes  = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const wData = await wRes.json();
    loaderEl.style.display = 'none';
    textEl.textContent =
      `${wData.current_weather.temperature}°C (Open-Meteo) — ${city}`;
  } catch (_) {
    loaderEl.style.display = 'none';
    textEl.textContent = 'Weather unavailable';
  }
}

// ─────────────────────────────────────────────
//  TO-DO STUDIO
// ─────────────────────────────────────────────

let tasks = [];
let todoFilter = 'all';

function loadTasks() {
  try { tasks = JSON.parse(localStorage.getItem('currentTask') || '[]'); } catch (_) { tasks = []; }
}

function saveTasks() {
  localStorage.setItem('currentTask', JSON.stringify(tasks));
}

function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  const visible = tasks.filter(t => {
    if (todoFilter === 'focus') return t.focus && !t.done;
    if (todoFilter === 'done')  return t.done;
    return true;
  });

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.8rem;padding:16px 0;';
    empty.textContent = todoFilter === 'done' ? 'No completed tasks yet.' :
                        todoFilter === 'focus' ? 'No focus tasks.' :
                        'Add your first task above!';
    list.appendChild(empty);
  }

  visible.forEach(t => {
    const li = document.createElement('li');
    li.className = `task-item${t.done ? ' done' : ''}${t.focus ? ' focus' : ''}`;
    li.innerHTML =
      `<input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})">
       <span class="task-text">${escHtml(t.text)}</span>
       ${t.focus ? '<span class="focus-badge" title="Focus task"><i class="ri-focus-3-line"></i></span>' : ''}
       <button class="task-delete" onclick="deleteTask(${t.id})" title="Delete"><i class="ri-delete-bin-line"></i></button>`;
    list.appendChild(li);
  });

  updateTodoMeta();
}

function updateTodoMeta() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const focus = tasks.filter(t => t.focus && !t.done).length;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  document.getElementById('todo-progress-bar').style.width = `${pct}%`;
  document.getElementById('todo-stats').textContent = `${done}/${total} done · ${focus} focus`;
}

function addTask() {
  const input  = document.getElementById('task-input');
  const isFocus= document.getElementById('task-focus-toggle').checked;
  const text   = input.value.trim();
  if (!text) return;

  tasks.push({ id: uid(), text, done: false, focus: isFocus });
  saveTasks();
  input.value = '';
  document.getElementById('task-focus-toggle').checked = false;
  renderTasks();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) t.done = !t.done;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function setTodoFilter(filter) {
  todoFilter = filter;
  document.querySelectorAll('.todo-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTasks();
}

// ─────────────────────────────────────────────
//  DAILY PLANNER  (6:00 – 24:00 = 19 slots)
// ─────────────────────────────────────────────

const PLANNER_START = 6;
const PLANNER_END   = 24;   // 24 is displayed as 00:00 (midnight boundary)
const PLANNER_TOTAL = PLANNER_END - PLANNER_START + 1; // 19 slots

let plannerData = {};

function loadPlanner() {
  try { plannerData = JSON.parse(localStorage.getItem('dayplanData') || '{}'); } catch (_) { plannerData = {}; }
}

function savePlanner() {
  localStorage.setItem('dayplanData', JSON.stringify(plannerData));
}

function renderPlanner() {
  const container = document.getElementById('planner-timeline');
  container.innerHTML = '';

  const now = new Date();
  const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
  let filledCount = 0;
  let nextAnchor  = null;

  for (let h = PLANNER_START; h <= PLANNER_END; h++) {
    // h=24 maps to key/display "00:00" (midnight)
    const key     = `${String(h === 24 ? 0 : h).padStart(2, '0')}:00`;
    const display = key;
    const value   = plannerData[key] || '';

    if (value) filledCount++;

    // "next anchor" = first upcoming filled slot after current time
    if (!nextAnchor && value && h > currentDecimalHour) {
      nextAnchor = { display, text: value };
    }

    const slot = document.createElement('div');
    slot.className = `planner-slot${h === Math.floor(currentDecimalHour) ? ' current-hour' : ''}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'planner-time';
    timeSpan.textContent = display;

    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.className   = 'planner-input';
    inp.value       = value;
    inp.placeholder = 'Add event…';
    inp.setAttribute('data-key', key);
    inp.addEventListener('input', () => updatePlannerSlot(key, inp.value));

    slot.appendChild(timeSpan);
    slot.appendChild(inp);
    container.appendChild(slot);
  }

  document.getElementById('planner-filled').textContent =
    `${filledCount} / ${PLANNER_TOTAL} blocks filled`;

  const nextEl     = document.getElementById('planner-next');
  const nextTextEl = document.getElementById('planner-next-text');
  if (nextAnchor) {
    nextTextEl.textContent = `${nextAnchor.display} — ${nextAnchor.text}`;
    nextEl.style.display = 'flex';
  } else {
    nextEl.style.display = 'none';
  }
}

function updatePlannerSlot(key, rawValue) {
  const val = rawValue.trim();
  if (val) {
    plannerData[key] = val;
  } else {
    delete plannerData[key];
  }
  savePlanner();

  // Update stats without full re-render (preserves input focus)
  const filled = Object.keys(plannerData).length;
  document.getElementById('planner-filled').textContent =
    `${filled} / ${PLANNER_TOTAL} blocks filled`;
}

// ─────────────────────────────────────────────
//  DAILY GOALS
// ─────────────────────────────────────────────

const RADIAL_CIRCUM = 2 * Math.PI * 32; // r = 32

let goalsData = [];

function loadGoals() {
  try { goalsData = JSON.parse(localStorage.getItem('dailyGoalsData') || '[]'); } catch (_) { goalsData = []; }
}

function saveGoals() {
  localStorage.setItem('dailyGoalsData', JSON.stringify(goalsData));
}

function renderGoals() {
  // Spotlight = first incomplete goal, or last goal, or fallback message
  const spotGoal = goalsData.find(g => !g.done) || goalsData[goalsData.length - 1];
  document.getElementById('goals-spotlight').textContent =
    spotGoal ? spotGoal.text : 'No goals set. Add one below!';

  // Radial progress
  const total   = goalsData.length;
  const done    = goalsData.filter(g => g.done).length;
  const pct     = total > 0 ? done / total : 0;
  const offset  = RADIAL_CIRCUM * (1 - pct);
  document.getElementById('radial-progress-circle').style.strokeDashoffset = offset;
  document.getElementById('radial-progress-text').textContent = `${Math.round(pct * 100)}%`;
  document.getElementById('goals-stats').textContent = `${done}/${total} goals achieved`;

  // List
  const list = document.getElementById('goals-list');
  list.innerHTML = '';

  if (goalsData.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:var(--text-muted);font-size:0.8rem;padding:12px 0;';
    empty.textContent = 'No goals yet — add one above!';
    list.appendChild(empty);
    return;
  }

  goalsData.forEach(g => {
    const div = document.createElement('div');
    div.className = `goal-item priority-${g.priority || 'medium'}${g.done ? ' done' : ''}`;
    const momentum = g.done ? 100 : (g.progress || 0);
    div.innerHTML =
      `<div class="goal-header">
         <input type="checkbox" ${g.done ? 'checked' : ''} onchange="toggleGoal(${g.id})">
         <span class="goal-text">${escHtml(g.text)}</span>
         <span class="priority-chip priority-${g.priority || 'medium'}">${g.priority || 'medium'}</span>
         <button class="goal-delete" onclick="deleteGoal(${g.id})" title="Delete"><i class="ri-delete-bin-line"></i></button>
       </div>
       <div class="momentum-bar">
         <div class="momentum-fill" style="width:${momentum}%"></div>
       </div>`;
    list.appendChild(div);
  });
}

function addGoal() {
  const input    = document.getElementById('goal-input');
  const priority = document.getElementById('goal-priority').value;
  const text     = input.value.trim();
  if (!text) return;

  goalsData.push({ id: uid(), text, done: false, priority, progress: 0 });
  saveGoals();
  input.value = '';
  renderGoals();
}

function toggleGoal(id) {
  const g = goalsData.find(g => g.id === id);
  if (g) { g.done = !g.done; g.progress = g.done ? 100 : 0; }
  saveGoals();
  renderGoals();
}

function deleteGoal(id) {
  goalsData = goalsData.filter(g => g.id !== id);
  saveGoals();
  renderGoals();
}

function resetGoals() {
  goalsData.forEach(g => { g.done = false; g.progress = 0; });
  saveGoals();
  renderGoals();
}

// ─────────────────────────────────────────────
//  POMODORO TIMER
// ─────────────────────────────────────────────

const POMO_WORK  = 25 * 60;
const POMO_BREAK =  5 * 60;

const pomo = {
  mode:     'work',
  timeLeft: POMO_WORK,
  running:  false,
  sessions: 0,
  interval: null,
};

function renderPomodoro() {
  const mins = String(Math.floor(pomo.timeLeft / 60)).padStart(2, '0');
  const secs = String(pomo.timeLeft % 60).padStart(2, '0');

  document.getElementById('pomo-display').textContent = `${mins}:${secs}`;
  document.getElementById('pomo-mode').textContent =
    pomo.mode === 'work' ? 'Work Session' : 'Break Time';
  document.getElementById('pomo-sessions').textContent = `Sessions: ${pomo.sessions}`;

  const startBtn = document.getElementById('pomo-start');
  startBtn.innerHTML = pomo.running
    ? '<i class="ri-pause-line"></i> Pause'
    : '<i class="ri-play-line"></i> Start';

  // Progress bar
  const total = pomo.mode === 'work' ? POMO_WORK : POMO_BREAK;
  const pct   = ((total - pomo.timeLeft) / total) * 100;
  document.getElementById('pomo-progress-bar').style.width = `${pct}%`;

  // Update tab title with timer
  document.title = `${mins}:${secs} — Productivity Dashboard`;
}

function startPausePomodoro() {
  if (pomo.running) {
    clearInterval(pomo.interval);
    pomo.running = false;
  } else {
    pomo.running = true;
    pomo.interval = setInterval(() => {
      pomo.timeLeft--;
      if (pomo.timeLeft < 0) {
        if (pomo.mode === 'work') {
          pomo.sessions++;
          pomo.mode     = 'break';
          pomo.timeLeft = POMO_BREAK;
        } else {
          pomo.mode     = 'work';
          pomo.timeLeft = POMO_WORK;
        }
        // Brief browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro', {
            body: pomo.mode === 'work' ? 'Break over — back to work!' : 'Work session done — take a break!',
          });
        }
      }
      renderPomodoro();
    }, 1000);
  }
  renderPomodoro();
}

function resetPomodoro() {
  clearInterval(pomo.interval);
  pomo.running  = false;
  pomo.mode     = 'work';
  pomo.timeLeft = POMO_WORK;
  renderPomodoro();
}

// ─────────────────────────────────────────────
//  MOTIVATIONAL QUOTES
// ─────────────────────────────────────────────

const QUOTE_CACHE_DURATION_MS = 3_600_000; // 1 hour

const FALLBACK_QUOTES = [
  { q: 'The secret of getting ahead is getting started.',          a: 'Mark Twain' },
  { q: "Don't watch the clock; do what it does. Keep going.",      a: 'Sam Levenson' },
  { q: "It always seems impossible until it's done.",              a: 'Nelson Mandela' },
  { q: 'Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.',
                                                                    a: 'Paul J. Meyer' },
  { q: 'Focus on being productive instead of busy.',               a: 'Tim Ferriss' },
  { q: 'Action is the foundational key to all success.',           a: 'Pablo Picasso' },
  { q: 'Either you run the day, or the day runs you.',             a: 'Jim Rohn' },
];

function displayQuote(quote) {
  const textEl   = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  textEl.style.opacity   = '0';
  authorEl.style.opacity = '0';
  setTimeout(() => {
    textEl.textContent   = `"${quote.q}"`;
    authorEl.textContent = `— ${quote.a}`;
    textEl.style.transition   = 'opacity 0.5s';
    authorEl.style.transition = 'opacity 0.5s';
    textEl.style.opacity   = '1';
    authorEl.style.opacity = '1';
  }, 200);
}

async function fetchQuote() {
  const CACHE_KEY = 'motivationalQuoteCache';
  const cached    = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  const now       = Date.now();

  // Use cache if < 1 hour old
  if (cached && (now - cached.timestamp) < QUOTE_CACHE_DURATION_MS) {
    displayQuote(cached.quote);
    return;
  }

  try {
    const res  = await fetch('https://dummyjson.com/quotes/random');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const quote = { q: data.quote, a: data.author };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ quote, timestamp: now }));
    displayQuote(quote);
  } catch (_) {
    const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    displayQuote(fallback);
  }
}

function refreshQuote() {
  localStorage.removeItem('motivationalQuoteCache');
  fetchQuote();
}

// ─────────────────────────────────────────────
//  INITIALISATION
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Theme
  initTheme();
  document.getElementById('theme-btn').addEventListener('click', cycleTheme);

  // Clock — immediate + every second
  updateClock();
  setInterval(updateClock, 1000);

  // Weather — immediate + every 10 min
  fetchWeather();
  setInterval(fetchWeather, 600_000);

  // To-Do
  loadTasks();
  renderTasks();
  document.getElementById('add-task-btn').addEventListener('click', addTask);
  document.getElementById('task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
  document.querySelectorAll('.todo-filter').forEach(btn => {
    btn.addEventListener('click', () => setTodoFilter(btn.dataset.filter));
  });

  // Daily Planner
  loadPlanner();
  renderPlanner();

  // Daily Goals
  loadGoals();
  renderGoals();
  document.getElementById('add-goal-btn').addEventListener('click', addGoal);
  document.getElementById('goal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addGoal();
  });
  document.getElementById('reset-goals-btn').addEventListener('click', resetGoals);

  // Pomodoro
  renderPomodoro();
  document.getElementById('pomo-start').addEventListener('click', startPausePomodoro);
  document.getElementById('pomo-reset').addEventListener('click', resetPomodoro);

  // Motivation
  fetchQuote();
  document.getElementById('refresh-quote-btn').addEventListener('click', refreshQuote);

  // Request notification permission for Pomodoro alerts (optional)
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
