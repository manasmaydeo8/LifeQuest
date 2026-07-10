// Demo auth (sessionStorage, no backend) + localStorage notes per user.
(() => {
  const SESSION_KEY = 'notebox-user';
  const user = sessionStorage.getItem(SESSION_KEY);
  const page = location.pathname.split('/').pop();

  // ---- Login page ----
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      if (!username || !password) {
        document.getElementById('loginError').classList.remove('d-none');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, username);
      location.href = 'home.html';
    });
    return; // nothing else to do on the login page
  }

  // ---- Auth guard for home/notes pages ----
  if (!user) { location.href = 'login.html'; return; }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'login.html';
  });

  // ---- Home page ----
  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName) welcomeName.textContent = user;

  // ---- Notes page ----
  const notesList = document.getElementById('notesList');
  if (notesList) {
    const notesKey = `notebox-notes-${user}`;
    const load = () => JSON.parse(localStorage.getItem(notesKey) || '[]');
    const save = (notes) => localStorage.setItem(notesKey, JSON.stringify(notes));

    function render() {
      const notes = load();
      notesList.innerHTML = notes.length
        ? notes.map((n, i) => `
          <div class="card border-0 shadow-sm">
            <div class="card-body d-flex justify-content-between align-items-start py-2">
              <div>${escapeHtml(n)}</div>
              <button class="btn btn-sm btn-outline-danger" data-i="${i}">✕</button>
            </div>
          </div>`).join('')
        : '<p class="text-muted">No notes yet — add one above.</p>';

      notesList.querySelectorAll('button[data-i]').forEach(btn => {
        btn.onclick = () => {
          const notes = load();
          notes.splice(Number(btn.dataset.i), 1);
          save(notes);
          render();
        };
      });
    }

    document.getElementById('noteForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('noteInput');
      const text = input.value.trim();
      if (!text) return;
      const notes = load();
      notes.push(text);
      save(notes);
      input.value = '';
      render();
    });

    render();
  }

  // ---- Calendar page ----
  const calendarGrid = document.getElementById('calendarGrid');
  if (calendarGrid) {
    const monthLabel = document.getElementById('monthLabel');
    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth(); // 0-11

    function renderCalendar() {
      const first = new Date(viewYear, viewMonth, 1);
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const startDow = first.getDay(); // 0 = Sun

      monthLabel.textContent = first.toLocaleString('default', { month: 'long', year: 'numeric' });

      const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="dow">${d}</div>`).join('');
      const blanks = Array.from({ length: startDow }, () => '<div class="day blank"></div>').join('');
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
        return `<div class="day${isToday ? ' today' : ''}">${d}</div>`;
      }).join('');

      calendarGrid.innerHTML = dows + blanks + days;
    }

    document.getElementById('prevMonth').addEventListener('click', () => {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    });

    renderCalendar();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
