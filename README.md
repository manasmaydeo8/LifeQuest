# NoteBox + Habitly

A simple, beautiful, offline-first personal productivity web app built with vanilla HTML, CSS, and JavaScript.

Combines **Note-taking**, **Calendar**, and a full-featured **Habit Tracker** in one cohesive experience.

<img width="1918" height="907" alt="Habit Tracker" src="https://github.com/user-attachments/assets/d9567b2b-3c8c-4861-ac68-55acadc8f87b" />

## ✨ Features

### 🔐 Authentication
- Simple demo login (any username + password works)
- Session-based (persists during browser session)
- Multi-user support via localStorage

### 📝 Notes
- Add, view, and delete personal notes
- Notes are saved per user in localStorage
- Clean, minimal interface

### 📅 Calendar
- Monthly calendar view
- Highlights current day
- Navigation between months

### 🔥 Habit Tracker (Habitly)
- **Build Habits** (Do something regularly)
  - Weekly goals
  - Daily completion toggle
  - Current streak tracking
  - Weekly progress percentage
- **Break Habits** (Quit something)
  - Track clean days
  - Log slips/relapses
  - Longest streak history
- Beautiful **Year-in-Pixels** heatmap (like GitHub)
- Search + filters (All / Not done / Done)
- Export / Import data (JSON)
- Color customization

### 🎨 Design
- Modern Bootstrap 5 UI
- Responsive layout
- Smooth animations and hover effects
- Clean cards and visual feedback

## 🛠️ Tech Stack

- **HTML5** + **CSS3** + **Vanilla JavaScript**
- **Bootstrap 5.3** (UI + Modals)
- **Font Awesome** icons
- **localStorage** + **sessionStorage** (no backend)
- Fully client-side

## 🚀 How to Run

1. Download or clone the project
2. Place all files in the same folder:
   - `index.html` (Habit Tracker)
   - `home.html`
   - `notes.html`
   - `calendar.html` (or `calender.html`)
   - `login.html`
   - `app.js`
   - `js/js_app.js`
   - `css/css_styles.css`
3. Open `login.html` in your browser

> No installation or build step required!

## 📁 Project Structure
/
├── login.html
├── home.html
├── notes.html
├── calendar.html
├── index.html          ← Habit Tracker (main page)
├── app.js              ← Shared logic (auth, notes, calendar)
├── js/
│   └── js_app.js       ← Habit tracker logic
├── css/
│   └── css_styles.css
└── README.md

## 📌 Notes & Limitations

- This is a **demo / frontend-only** project
- All data is stored in the browser (`localStorage`)
  - Clearing browser data = losing all notes & habits
- Calendar is basic (no event support yet)
- Habit data migration from older version supported

## Future Improvements (Ideas)

- Dark mode
- Data sync with backend
- Habit reminders
- Rich text notes
- Better calendar with events
- Mobile PWA support

## License

MIT License — feel free to use and modify as you like.
