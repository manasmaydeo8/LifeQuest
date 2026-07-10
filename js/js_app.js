// Habit tracker: store in localStorage, render cards, toggle today's completion,
// year-in-pixels heatmaps, JSON export/import, and "break a habit" mode.
(() => {
  const KEY = 'habits-v2';
  const OLD_KEY = 'habits-v1';

  const defaultHabits = [
    { id: crypto.randomUUID(), title: 'Read 20 pages', color: '#0d6efd', type: 'build', goal: 4, history: [] },
    { id: crypto.randomUUID(), title: 'Exercise 20 min', color: '#198754', type: 'build', goal: 3, history: [] }
  ];

  // ---------- Utils ----------
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.floor((b - a) / (1000 * 60 * 60 * 24));

  function migrateOldData() {
    // v1 habits had no `type` field — treat them all as "build" habits.
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    try {
      const old = JSON.parse(raw);
      if (!Array.isArray(old)) return null;
      return old.map(h => ({ ...h, type: h.type || 'build' }));
    } catch { return null; }
  }

  const load = () => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
    return migrateOldData() || defaultHabits;
  };
  const save = (h) => localStorage.setItem(KEY, JSON.stringify(h));

  // ---------- DOM refs ----------
  const grid = document.getElementById('habitsGrid');
  const todayProgress = document.getElementById('todayProgress');
  const breakStreaksWrap = document.getElementById('breakStreaksWrap');
  const form = document.getElementById('habitForm');
  const searchInput = document.getElementById('searchInput');
  const filterAll = document.getElementById('filterAll');
  const filterActive = document.getElementById('filterActive');
  const filterDone = document.getElementById('filterDone');

  const habitTypeSelect = document.getElementById('habitType');
  const goalField = document.getElementById('goalField');
  const startDateField = document.getElementById('startDateField');
  const titleLabel = document.getElementById('titleLabel');
  const titleHint = document.getElementById('titleHint');
  const goalInput = document.getElementById('goal');
  const startDateInput = document.getElementById('startDate');
  const colorInput = document.getElementById('color');
  const titleInput = document.getElementById('title');
  const habitIdInput = document.getElementById('habitId');
  const habitModalEl = document.getElementById('habitModal');

  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const importStatus = document.getElementById('importStatus');

  const heatmapModalEl = document.getElementById('heatmapModal');
  const heatmapContainer = document.getElementById('heatmapContainer');
  const heatmapModalTitle = document.getElementById('heatmapModalTitle');
  const heatmapSubtitle = document.getElementById('heatmapSubtitle');
  const heatmapLegend = document.getElementById('heatmapLegend');

  let habits = load();
  let filter = 'all';
  let search = '';

  // ---------- Render ----------
  function render() {
    save(habits);
    renderTodayProgress();
    renderBreakStreaks();

    const filtered = habits
      .filter(h => h.title.toLowerCase().includes(search.toLowerCase()))
      .filter(h => {
        if (h.type === 'break') return true; // done/not-done filters don't apply to break habits
        const done = h.history.includes(todayKey());
        if (filter === 'done') return done;
        if (filter === 'active') return !done;
        return true;
      });

    grid.innerHTML = filtered.map(h => habitCardHtml(h)).join('') ||
      '<div class="col-12"><div class="text-muted">No habits yet — add one!</div></div>';
    attachCardListeners();
  }

  function renderTodayProgress() {
    const buildHabits = habits.filter(h => h.type !== 'break');
    const total = buildHabits.length || 1;
    const done = buildHabits.filter(h => h.history.includes(todayKey())).length;
    const pct = Math.round((done / total) * 100);
    todayProgress.innerHTML = `
      <div class="progress-wrap">
        <svg viewBox="0 0 36 36" class="w-100 h-100">
          <path d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="#eee" stroke-width="3.5"/>
          <path d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#0d6efd'}"
            stroke-width="3.5" stroke-dasharray="${pct} 100" stroke-linecap="round"/>
          <text x="18" y="20.35" class="small-muted" text-anchor="middle" font-size="7">${pct}%</text>
        </svg>
      </div>
      <div>
        <div class="fw-bold">${done}/${buildHabits.length}</div>
        <div class="small-muted">habits done today</div>
      </div>`;
  }

  function renderBreakStreaks() {
    const breakHabits = habits.filter(h => h.type === 'break');
    if (!breakHabits.length) { breakStreaksWrap.innerHTML = ''; return; }
    breakStreaksWrap.innerHTML = `
      <div class="small-muted mb-1">Clean streaks</div>
      ${breakHabits.map(h => `
        <div class="break-row">
          <span>${escapeHtml(h.title)}</span>
          <span class="fw-semibold" style="color:${h.color}">${breakStreakDays(h)}d</span>
        </div>`).join('')}`;
  }

  function habitCardHtml(h) {
    if (h.type === 'break') return breakCardHtml(h);

    const done = h.history.includes(todayKey());
    const completedClass = done ? 'btn-success' : 'btn-outline-primary';
    const badge = `<span class="badge" style="background:${h.color};width:10px;height:10px;border-radius:4px;display:inline-block;margin-right:8px"></span>`;
    const progress = weeklyProgress(h);
    return `
      <div class="col-12 col-sm-6">
        <div class="p-3 habit-card">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <div class="habit-title">${badge}${escapeHtml(h.title)}</div>
              <div class="small-muted">Goal: ${h.goal}/wk • Streak: ${streak(h)}d</div>
            </div>
            <div class="text-end">
              <div class="mb-2 small-muted">${progress}% this week</div>
              <button class="btn btn-sm ${completedClass} btn-complete" data-action="toggle" data-id="${h.id}" aria-label="${done ? 'Mark not done' : 'Mark done'} for ${escapeHtml(h.title)}">
                <i class="bi ${done ? 'bi-check2' : 'bi-circle'}"></i>
              </button>
            </div>
          </div>
          <div class="mt-3 small-muted">Last: ${lastDone(h) || '—'}</div>
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" data-action="heatmap" data-id="${h.id}" aria-label="View year heatmap for ${escapeHtml(h.title)}"><i class="bi bi-grid-3x3-gap"></i> Heatmap</button>
            <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-id="${h.id}" aria-label="Edit ${escapeHtml(h.title)}"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${h.id}" aria-label="Delete ${escapeHtml(h.title)}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`;
  }

  function breakCardHtml(h) {
    const badge = `<span class="badge" style="background:${h.color};width:10px;height:10px;border-radius:4px;display:inline-block;margin-right:8px"></span>`;
    const cleanDays = breakStreakDays(h);
    const longest = longestCleanStreak(h);
    return `
      <div class="col-12 col-sm-6">
        <div class="p-3 habit-card break-mode">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <div class="habit-title">${badge}${escapeHtml(h.title)}</div>
              <div class="small-muted">Quitting since ${h.startDate} • Best streak: ${longest}d</div>
            </div>
            <div class="text-end">
              <span class="clean-pill" style="background:${h.color}22;color:${h.color}">${cleanDays}d clean</span>
            </div>
          </div>
          <div class="mt-3 d-flex gap-2 flex-wrap">
            <button class="btn btn-outline-danger btn-sm" data-action="slip" data-id="${h.id}" aria-label="Log a slip for ${escapeHtml(h.title)}">
              <i class="bi bi-exclamation-triangle me-1"></i>I slipped today
            </button>
            <button class="btn btn-outline-secondary btn-sm" data-action="heatmap" data-id="${h.id}" aria-label="View year heatmap for ${escapeHtml(h.title)}"><i class="bi bi-grid-3x3-gap"></i> Heatmap</button>
            <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-id="${h.id}" aria-label="Edit ${escapeHtml(h.title)}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${h.id}" aria-label="Delete ${escapeHtml(h.title)}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`;
  }

  // ---------- Derived stats ----------
  function weeklyProgress(h) {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const weekKeys = h.history.filter(d => new Date(d) >= weekAgo);
    return Math.round(Math.min(100, (weekKeys.length / h.goal) * 100));
  }

  function lastDone(h) { return h.history.slice(-1)[0]; }

  // Fixed: today counts as a "grace" day so an active streak doesn't drop to
  // zero just because you haven't checked in yet today.
  function streak(h) {
    const days = new Set(h.history);
    let d = new Date();
    let s = 0;
    if (!days.has(todayKey())) d.setDate(d.getDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) {
      s++; d.setDate(d.getDate() - 1);
    }
    return s;
  }

  function lastRelapseDate(h) {
    if (!h.relapses || !h.relapses.length) return null;
    return h.relapses.slice(-1)[0];
  }

  function breakStreakDays(h) {
    const anchor = lastRelapseDate(h) || h.startDate;
    if (!anchor) return 0;
    return Math.max(0, daysBetween(new Date(anchor), new Date(todayKey())));
  }

  function longestCleanStreak(h) {
    if (!h.startDate) return 0;
    const points = [h.startDate, ...(h.relapses || []), todayKey()].map(d => new Date(d));
    let longest = 0;
    for (let i = 0; i < points.length - 1; i++) {
      longest = Math.max(longest, daysBetween(points[i], points[i + 1]));
    }
    return longest;
  }

  // ---------- Actions ----------
  function toggleToday(id) {
    const h = habits.find(x => x.id === id);
    if (!h || h.type === 'break') return;
    const key = todayKey();
    if (h.history.includes(key)) {
      h.history = h.history.filter(d => d !== key);
    } else {
      h.history.push(key);
    }
    render();
  }

  function logSlip(id) {
    const h = habits.find(x => x.id === id);
    if (!h || h.type !== 'break') return;
    if (!confirm(`Log a slip for "${h.title}" today? This resets your clean streak.`)) return;
    h.relapses = h.relapses || [];
    const key = todayKey();
    if (!h.relapses.includes(key)) h.relapses.push(key);
    render();
  }

  function addOrUpdateHabit({ id, title, color, type, goal, startDate }) {
    if (id) {
      const h = habits.find(x => x.id === id);
      if (!h) return;
      h.title = title; h.color = color; h.type = type;
      if (type === 'build') { h.goal = goal; h.history = h.history || []; }
      else { h.startDate = startDate || h.startDate || todayKey(); h.relapses = h.relapses || []; }
    } else {
      const base = { id: crypto.randomUUID(), title, color, type };
      if (type === 'build') habits.push({ ...base, goal, history: [] });
      else habits.push({ ...base, startDate: startDate || todayKey(), relapses: [] });
    }
    render();
  }

  function editHabit(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    habitIdInput.value = h.id;
    titleInput.value = h.title;
    colorInput.value = h.color || '#0d6efd';
    habitTypeSelect.value = h.type || 'build';
    goalInput.value = h.goal || 3;
    startDateInput.value = h.startDate || todayKey();
    syncTypeFields();
    document.querySelector('#habitModal .modal-title').textContent = 'Edit Habit';
    new bootstrap.Modal(habitModalEl).show();
  }

  function deleteHabit(id) {
    if (!confirm('Delete this habit?')) return;
    habits = habits.filter(h => h.id !== id);
    render();
  }

  // ---------- Form / type-field toggling ----------
  function syncTypeFields() {
    const isBreak = habitTypeSelect.value === 'break';
    goalField.classList.toggle('d-none', isBreak);
    startDateField.classList.toggle('d-none', !isBreak);
    titleLabel.textContent = isBreak ? 'What are you quitting?' : 'Habit';
    titleInput.placeholder = isBreak ? 'e.g., Smoking' : 'e.g., Read 20 pages';
    titleHint.textContent = isBreak
      ? 'Tip: Name the thing you\'re avoiding (e.g., "Smoking", "Soda").'
      : 'Tip: Enter a clear, actionable habit (e.g., "Read 20 pages").';
    if (isBreak && !startDateInput.value) startDateInput.value = todayKey();
  }
  habitTypeSelect.addEventListener('change', syncTypeFields);

  function resetForm() {
    form.reset();
    habitIdInput.value = '';
    habitTypeSelect.value = 'build';
    startDateInput.value = todayKey();
    syncTypeFields();
    document.querySelector('#habitModal .modal-title').textContent = 'Add Habit';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    addOrUpdateHabit({
      id: habitIdInput.value,
      title: titleInput.value.trim(),
      color: colorInput.value,
      type: habitTypeSelect.value,
      goal: Math.max(1, Number(goalInput.value) || 1),
      startDate: startDateInput.value
    });
    bootstrap.Modal.getInstance(habitModalEl).hide();
  });

  // Fixed: reset the form/title/hidden id whenever the modal closes, however
  // it was closed (Save, Cancel, backdrop click, Esc) — not just on submit.
  habitModalEl.addEventListener('hidden.bs.modal', resetForm);

  // ---------- Card listeners ----------
  function attachCardListeners() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'toggle') toggleToday(id);
        if (action === 'edit') editHabit(id);
        if (action === 'delete') deleteHabit(id);
        if (action === 'slip') logSlip(id);
        if (action === 'heatmap') openHeatmap(id);
      };
    });
  }

  // ---------- Search & filters ----------
  searchInput.addEventListener('input', e => { search = e.target.value; render(); });
  [filterAll, filterActive, filterDone].forEach(btn => {
    btn.addEventListener('click', () => {
      [filterAll, filterActive, filterDone].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.id === 'filterAll' ? 'all' : (btn.id === 'filterActive' ? 'active' : 'done');
      render();
    });
  });

  // ---------- Export / Import ----------
  function exportData() {
    const blob = new Blob([JSON.stringify(habits, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitly-export-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function validateImported(data) {
    if (!Array.isArray(data)) return 'File must contain a list of habits.';
    for (const h of data) {
      if (!h || typeof h !== 'object') return 'Found an invalid habit entry.';
      if (typeof h.title !== 'string') return 'Every habit needs a title.';
      if (h.type && h.type !== 'build' && h.type !== 'break') return `Unknown habit type: ${h.type}`;
    }
    return null;
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const err = validateImported(data);
        if (err) { importStatus.textContent = `Import failed: ${err}`; importStatus.classList.add('text-danger'); return; }
        if (!confirm(`Import ${data.length} habit(s)? This replaces your current data (export first if unsure).`)) return;
        habits = data.map(h => ({
          id: h.id || crypto.randomUUID(),
          title: h.title,
          color: h.color || '#0d6efd',
          type: h.type || 'build',
          goal: h.goal || 3,
          history: Array.isArray(h.history) ? h.history : [],
          startDate: h.startDate || todayKey(),
          relapses: Array.isArray(h.relapses) ? h.relapses : []
        }));
        importStatus.classList.remove('text-danger');
        importStatus.textContent = `Imported ${habits.length} habit(s).`;
        render();
      } catch {
        importStatus.classList.add('text-danger');
        importStatus.textContent = 'Import failed: not valid JSON.';
      }
    };
    reader.readAsText(file);
  }

  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importData(file);
    importFile.value = '';
  });

  // ---------- Year-in-pixels heatmap ----------
  function openHeatmap(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    heatmapModalTitle.textContent = `${h.title} — year in pixels`;
    const year = new Date().getFullYear();
    heatmapSubtitle.textContent = `${year}`;
    heatmapLegend.innerHTML = h.type === 'break'
      ? `<span class="me-2"><span class="badge" style="background:#e0e0e0">&nbsp;</span> before start</span>
         <span class="me-2"><span class="badge" style="background:${h.color}">&nbsp;</span> clean</span>
         <span><span class="badge" style="background:#dc3545">&nbsp;</span> slip</span>`
      : `<span class="me-2"><span class="badge" style="background:#e0e0e0">&nbsp;</span> not done</span>
         <span><span class="badge" style="background:${h.color}">&nbsp;</span> done</span>`;
    heatmapContainer.innerHTML = buildHeatmapSvg(h, year);
    new bootstrap.Modal(heatmapModalEl).show();
  }

  function buildHeatmapSvg(h, year) {
    const cell = 11, gap = 3, radius = 2;
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    // Align the grid so weeks run Sun-Sat, matching GitHub-style heatmaps.
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const doneSet = h.type === 'break' ? null : new Set(h.history);
    const relapseSet = h.type === 'break' ? new Set(h.relapses || []) : null;
    const startDate = h.type === 'break' ? new Date(h.startDate) : null;

    let col = 0, row = 0;
    const rects = [];
    const monthLabels = [];
    let lastMonth = -1;
    let d = new Date(gridStart);

    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      const inYear = d >= start && d <= end;
      if (inYear) {
        let fill = '#ebedf0';
        if (h.type === 'break') {
          if (d >= startDate) fill = relapseSet.has(key) ? '#dc3545' : h.color;
        } else {
          if (doneSet.has(key)) fill = h.color;
        }
        const x = col * (cell + gap);
        const y = row * (cell + gap) + 14;
        rects.push(`<rect class="heatmap-cell" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${radius}" fill="${fill}"><title>${key}</title></rect>`);
        if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
          monthLabels.push(`<text class="heatmap-month-label" x="${x}" y="8">${d.toLocaleString('default', { month: 'short' })}</text>`);
          lastMonth = d.getMonth();
        }
      }
      row++;
      if (row === 7) { row = 0; col++; }
      d.setDate(d.getDate() + 1);
    }

    const width = (col + 1) * (cell + gap);
    const height = 7 * (cell + gap) + 14;
    return `<svg class="heatmap-grid" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${monthLabels.join('')}${rects.join('')}</svg>`;
  }

  // ---------- Small helpers ----------
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Init ----------
  resetForm();
  render();
})();