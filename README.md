# Wanderlust — Tour Booking System

A lightweight, single-page tour booking web app built with **vanilla HTML, CSS, and JavaScript**. No frameworks, no server required — just open `index.html` in a browser.

---

## 📁 Project Structure

```
wanderlust/
├── index.html          # All pages (SPA with hash routing)
├── css/
│   └── style.css       # All styles — variables, layout, components
├── js/
│   ├── db.js           # "Database" layer — localStorage as flat-file storage
│   └── app.js          # App logic — routing, rendering, event handlers
├── data/               # Reference JSON files (actual data lives in localStorage)
│   ├── tours.json
│   ├── users.json
│   └── bookings.json
└── README.md
```

---

## 🚀 Getting Started

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. **No server or npm install needed.**

### Default Accounts

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@wanderlust.com     | `admin`    |
| User  | santa@example.com        | `password` |

> Passwords are hashed with **SHA-256** via the Web Crypto API before storage.

---

## 🗄️ Database Design

Data is stored in **`localStorage`** as JSON strings, simulating text-file based persistence. Three "tables" are used:

| Key            | Description                        |
|----------------|------------------------------------|
| `wl_users`     | User accounts (with hashed passwords) |
| `wl_tours`     | Tour listings                      |
| `wl_bookings`  | All bookings made by users         |
| `wl_seeded`    | Flag to prevent re-seeding on reload |

All CRUD logic lives in **`js/db.js`**, exposing a clean `DB` object. `app.js` calls `DB` methods and never touches `localStorage` directly.

---

## 🔐 Security

- Passwords are **never stored in plain text**.
- On registration/login, the password is hashed with `crypto.subtle.digest('SHA-256', ...)` (Web Crypto API — built into all modern browsers).
- Only the hash is saved to `localStorage`.

---

## 🧭 Routing

The app uses **hash-based routing** (`location.hash`):

| Hash             | Page                  | Access       |
|------------------|-----------------------|--------------|
| `#auth`          | Login / Register      | Public       |
| `#tours`         | Tour listings         | Logged in    |
| `#bookings`      | My Bookings           | Logged in    |
| `#admin`         | Admin Panel           | Admin only   |
| `#all-bookings`  | All Bookings (admin)  | Admin only   |

The `navigate()` function in `app.js` handles all redirects and access control.

---

## 🎨 Design

- **Color scheme**: Warm orange (`#e07b39`) + off-white (`#f5f0eb`)
- **Fonts**: Playfair Display (headings) + Lato (body) via Google Fonts
- **Icons**: Font Awesome 6
- **Images**: Referenced by filename (e.g. `sahara.png`). Falls back to an orange gradient if the file isn't present.

---

## 🛠️ Features

### User
- Sign up / Sign in with hashed passwords
- Browse all available tours
- Book a tour (select date + participants, see total price)
- View booking history
- Update username & change password

### Admin
- Add, edit, and delete tours
- View all bookings across all users

---

## 📝 Notes

- Data persists across page refreshes via `localStorage`.
- To **reset all data**, run `localStorage.clear()` in the browser console and refresh.
- Images are expected to be in the project root as `.png` files. The app renders a colored fallback if images are missing.
