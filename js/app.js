/**
 * app.js — Wanderlust Tour Booking System
 *
 * Architecture: Single-page application with hash-based routing.
 * State is managed in a simple `state` object.
 * Pages are shown/hidden via CSS classes.
 *
 * Routes: #auth | #tours | #bookings | #admin | #all-bookings
 */

/* ============================================================
   STATE
   ============================================================ */
const state = {
  user: null,        // currently logged-in user object
  selectedTour: null // tour selected for booking modal
};

/* ============================================================
   ROUTER — map hash to page & render function
   ============================================================ */
const routes = {
  '#auth':         { page: 'auth-page',          render: renderAuth         },
  '#tours':        { page: 'tours-page',          render: renderTours        },
  '#bookings':     { page: 'bookings-page',       render: renderBookings     },
  '#admin':        { page: 'admin-page',          render: renderAdmin        },
  '#all-bookings': { page: 'all-bookings-page',   render: renderAllBookings  },
};

function navigate(hash) {
  // Redirect to auth if not logged in and not going to auth
  if (!state.user && hash !== '#auth') { location.hash = '#auth'; return; }
  // Redirect away from auth if already logged in
  if (state.user && hash === '#auth')  { location.hash = '#tours'; return; }
  // Admins only on admin pages
  if ((hash === '#admin' || hash === '#all-bookings') && state.user?.role !== 'admin') {
    location.hash = '#tours'; return;
  }

  const route = routes[hash] || routes['#tours'];
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(route.page).classList.add('active');
  route.render();
  updateNav(hash);
}

function updateNav(hash) {
  if (!state.user) { document.getElementById('main-nav').style.display = 'none'; return; }
  document.getElementById('main-nav').style.display = 'flex';

  // Highlight active nav link
  document.querySelectorAll('.nav-btn[data-route]').forEach(btn => {
    btn.classList.toggle('active-nav', btn.dataset.route === hash);
  });

  // Show admin link only for admins
  document.getElementById('admin-nav-btn').style.display =
    state.user.role === 'admin' ? 'inline-flex' : 'none';
}

window.addEventListener('hashchange', () => navigate(location.hash));

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = ''; }, 3000);
}

function normalizeTourImages() {
  const tours = DB.getTours();
  const imageMap = {
    'Sahara Desert Adventure': './images/saharadesert.jpg',
    'Bali Temple Trail': './images/bali temple trail.jpg',
    'Northern Lights Expedition': './images/northern lights.jpg',
    'Amalfi Coast Sailing': './images/amalfi coast.jpg',
    'Machu Picchu Trek': './images/machu picchu.jpg',
    'Tokyo Street Food Tour': './images/tokyo street food tour.jpg',
  };

  const updatedTours = tours.map(t => ({
    ...t,
    image: imageMap[t.name] || t.image,
  }));

  localStorage.setItem('wl_tours', JSON.stringify(updatedTours));
}

function getImageSrc(path) {
  return path ? encodeURI(path) : '';
}

/* ============================================================
   AUTH PAGE
   ============================================================ */
function renderAuth() {
  // Tabs: login vs register — toggled by showTab()
  showAuthTab('login');
}

function showAuthTab(tab) {
  document.getElementById('login-form').style.display  = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const result = await DB.loginUser(email, pass);
  if (result.error) { toast(result.error, 'error'); return; }
  state.user = result.user;
  toast('Welcome back, ' + result.user.username + '!');
  location.hash = '#tours';
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-pass').value;
  if (pass.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
  const result = await DB.registerUser(username, email, pass);
  if (result.error) { toast(result.error, 'error'); return; }
  state.user = result.user;
  toast('Account created! Welcome, ' + result.user.username + '!');
  location.hash = '#tours';
}

function handleLogout() {
  state.user = null;
  location.hash = '#auth';
  toast('Signed out.', 'success');
}

/* ============================================================
   TOURS PAGE
   ============================================================ */
function renderTours() {
  const tours = DB.getTours();
  const grid  = document.getElementById('tours-grid');

  if (!tours.length) {
    grid.innerHTML = '<p class="empty-msg">No tours available.</p>';
    return;
  }

  grid.innerHTML = tours.map(t => `
    <div class="tour-card">
      <div class="tour-img-wrap">
        <!-- Using placeholder color block instead of actual image -->
        <img src="${getImageSrc(t.image)}" alt="${t.name}" onerror="this.style.background='linear-gradient(135deg,#e07b39,#c4612a)';this.removeAttribute('src')">
        <span class="tour-price-badge">$${t.price}</span>
      </div>
      <div class="tour-body">
        <div class="tour-meta">
          <span><i class="fa fa-map-marker-alt"></i> ${t.location}</span>
          <span><i class="fa fa-clock"></i> ${t.days} days</span>
        </div>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <div class="tour-footer">
          <span class="tour-seats"><i class="fa fa-users"></i> Max ${t.seats}</span>
          <button class="btn-book" onclick="openBookModal(${t.id})">Book Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   BOOKING MODAL
   ============================================================ */
function openBookModal(tourId) {
  const tour = DB.getTourById(tourId);
  if (!tour) return;
  state.selectedTour = tour;

  document.getElementById('modal-title').textContent   = 'Book Tour';
  document.getElementById('modal-subtitle').textContent = `${tour.name} — $${tour.price}/person`;
  document.getElementById('modal-seats').value         = 1;
  document.getElementById('modal-date').value          = '';
  updateModalTotal();

  document.getElementById('booking-overlay').classList.add('open');
}

function closeBookModal() {
  document.getElementById('booking-overlay').classList.remove('open');
  state.selectedTour = null;
}

function updateModalTotal() {
  const seats = parseInt(document.getElementById('modal-seats').value) || 1;
  const price = state.selectedTour ? state.selectedTour.price * seats : 0;
  document.getElementById('modal-total').textContent = '$' + price;
}

async function handleBooking() {
  const tour  = state.selectedTour;
  const seats = parseInt(document.getElementById('modal-seats').value);
  const date  = document.getElementById('modal-date').value;

  if (!date)  { toast('Please select a travel date.', 'error'); return; }
  if (!seats || seats < 1) { toast('Enter valid participant count.', 'error'); return; }
  if (seats > tour.seats) { toast('Not enough seats available.', 'error'); return; }

  const result = DB.addBooking(state.user.id, tour.id, seats, date);
  if (result.error) { toast(result.error, 'error'); return; }

  closeBookModal();
  toast('Booking confirmed! 🎉');
  renderTours(); // refresh seat counts
}

function refreshBookingViews() {
  renderTours();
  if (location.hash === '#bookings') renderBookings();
  if (location.hash === '#all-bookings') renderAllBookings();
}

function handleCancelBooking(bookingId) {
  if (!confirm('Cancel this booking?')) return;
  const result = DB.cancelBooking(bookingId);
  if (result.error) { toast(result.error, 'error'); return; }
  toast('Booking canceled.', 'error');
  refreshBookingViews();
}

/* ============================================================
   MY BOOKINGS PAGE
   ============================================================ */
function renderBookings() {
  const bookings = DB.getBookingsByUser(state.user.id);
  const tours    = DB.getTours();
  const list     = document.getElementById('bookings-list');

  if (!bookings.length) {
    list.innerHTML = '<p class="empty-msg">No bookings yet. <a href="#tours" style="color:var(--orange)">Explore tours →</a></p>';
    return;
  }

  list.innerHTML = bookings.map(b => {
    const tour = tours.find(t => t.id === b.tourId) || {};
    const dateStr = new Date(b.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    return `
      <div class="booking-item">
        <img class="booking-thumb" src="${getImageSrc(tour.image)}"
          alt="${tour.name}" onerror="this.style.background='linear-gradient(135deg,#e07b39,#c4612a)';this.removeAttribute('src')">
        <div class="booking-info">
          <h4>${tour.name || 'Unknown Tour'}</h4>
          <div class="booking-meta">
            <span><i class="fa fa-map-marker-alt"></i> ${tour.location || ''}</span>
            <span><i class="fa fa-calendar"></i> ${dateStr}</span>
            <span><i class="fa fa-user"></i> ${b.seats} person${b.seats > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="booking-right">
          <div class="price">$${(tour.price || 0) * b.seats}</div>
          <span class="badge">${b.status}</span>
          <button class="btn-cancel" onclick="handleCancelBooking(${b.id})">Cancel</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   PROFILE MODAL
   ============================================================ */
function openProfileModal() {
  document.getElementById('profile-username').value = state.user.username;
  document.getElementById('profile-overlay').classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profile-overlay').classList.remove('open');
}

async function handleUpdateUsername() {
  const name = document.getElementById('profile-username').value.trim();
  if (!name) { toast('Username cannot be empty.', 'error'); return; }
  const result = await DB.updateUsername(state.user.id, name);
  if (result.error) { toast(result.error, 'error'); return; }
  state.user = result.user;
  toast('Username updated!');
}

async function handleUpdatePassword() {
  const cur  = document.getElementById('profile-cur-pass').value;
  const nw   = document.getElementById('profile-new-pass').value;
  const conf = document.getElementById('profile-conf-pass').value;
  if (nw !== conf)   { toast('New passwords do not match.', 'error'); return; }
  if (nw.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
  const result = await DB.updatePassword(state.user.id, cur, nw);
  if (result.error) { toast(result.error, 'error'); return; }
  toast('Password updated!');
  document.getElementById('profile-cur-pass').value = '';
  document.getElementById('profile-new-pass').value = '';
  document.getElementById('profile-conf-pass').value = '';
}

/* ============================================================
   ADMIN PAGE
   ============================================================ */
let selectedAdminTourId = null; // track which tour is selected for update

function renderAdmin() {
  const tours = DB.getTours();
  const list  = document.getElementById('admin-tours-list-items');

  list.innerHTML = tours.map(t => `
    <div class="admin-tour-item${selectedAdminTourId === t.id ? ' selected' : ''}"
         onclick="selectAdminTour(${t.id})">
      ${t.name} — ${t.location} ($${t.price}) · Seats: ${t.seats}
    </div>
  `).join('') || '<p class="empty-msg">No tours yet.</p>';
}

function selectAdminTour(id) {
  const tour = DB.getTourById(id);
  if (!tour) return;
  selectedAdminTourId = id;

  document.getElementById('admin-name').value  = tour.name;
  document.getElementById('admin-loc').value   = tour.location;
  document.getElementById('admin-days').value  = tour.days;
  document.getElementById('admin-desc').value  = tour.description;
  document.getElementById('admin-price').value = tour.price;
  document.getElementById('admin-seats').value = tour.seats;
  document.getElementById('admin-image').value = tour.image;

  renderAdmin();
}

function clearAdminForm() {
  selectedAdminTourId = null;
  ['admin-name','admin-loc','admin-days','admin-desc','admin-price','admin-seats','admin-image']
    .forEach(id => document.getElementById(id).value = '');
  renderAdmin();
}

function getAdminFormData() {
  return {
    name:        document.getElementById('admin-name').value.trim(),
    location:    document.getElementById('admin-loc').value.trim(),
    days:        parseInt(document.getElementById('admin-days').value) || 1,
    description: document.getElementById('admin-desc').value.trim(),
    price:       parseFloat(document.getElementById('admin-price').value) || 0,
    seats:       parseInt(document.getElementById('admin-seats').value) || 0,
    rating:      4.5,
    image:       document.getElementById('admin-image').value.trim() || 'tour.png',
  };
}

function handleAddTour() {
  const data = getAdminFormData();
  if (!data.name || !data.location) { toast('Name and location are required.', 'error'); return; }
  DB.addTour(data);
  clearAdminForm();
  renderAdmin();
  toast('Tour added!');
}

function handleUpdateTour() {
  if (!selectedAdminTourId) { toast('Select a tour first.', 'error'); return; }
  DB.updateTour(selectedAdminTourId, getAdminFormData());
  clearAdminForm();
  renderAdmin();
  toast('Tour updated!');
}

function handleDeleteSelected() {
  if (!selectedAdminTourId) { toast('Select a tour to delete.', 'error'); return; }
  if (!confirm('Delete this tour? All its bookings will also be removed.')) return;
  DB.deleteTour(selectedAdminTourId);
  clearAdminForm();
  renderAdmin();
  toast('Tour deleted.', 'error');
}

/* ============================================================
   ALL BOOKINGS (admin view)
   ============================================================ */
function renderAllBookings() {
  const bookings = DB.getBookings();
  const tours    = DB.getTours();
  const list     = document.getElementById('all-bookings-list');

  // We also need usernames — get all users from localStorage directly
  const users = JSON.parse(localStorage.getItem('wl_users') || '[]');

  if (!bookings.length) {
    list.innerHTML = '<p class="empty-msg">No bookings yet.</p>'; return;
  }

  list.innerHTML = bookings.map(b => {
    const tour = tours.find(t => t.id === b.tourId);
    const user = users.find(u => u.id === b.userId);
    const dateStr = new Date(b.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    return `
      <div class="admin-booking-card">
        <h4>${tour?.name || 'Unknown'}</h4>
        <p>Customer: ${user?.username || 'Unknown'} &nbsp;|&nbsp;
           Seats: ${b.seats} &nbsp;|&nbsp;
           Date: ${dateStr} &nbsp;|&nbsp;
           Status: <strong>${b.status}</strong></p>
        <button class="btn-cancel" onclick="handleCancelBooking(${b.id})">Cancel</button>
      </div>
    `;
  }).join('');
}

/* ============================================================
   INIT — wire up events, seed DB, start router
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await DB.seed();
  normalizeTourImages();

  /* --- Auth form events --- */
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);

  /* --- Nav buttons --- */
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('profile-btn').addEventListener('click', openProfileModal);

  /* --- Modal close on overlay click --- */
  document.getElementById('booking-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeBookModal();
  });
  document.getElementById('profile-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProfileModal();
  });

  /* --- Booking modal seat change → update total --- */
  document.getElementById('modal-seats').addEventListener('input', updateModalTotal);

  /* --- Start router --- */
  navigate(location.hash || '#auth');
});
