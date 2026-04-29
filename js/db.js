/**
 * db.js — Simple "text-file" database using localStorage
 * Each key stores JSON, mimicking server-side flat-file storage.
 *
 * Tables: users, tours, bookings
 * Passwords are hashed with SHA-256 via Web Crypto API.
 */

const DB = (() => {

  /* ---- SHA-256 password hashing ---- */
  async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---- Generic helpers ---- */
  function getTable(name)        { return JSON.parse(localStorage.getItem('wl_' + name) || '[]'); }
  function setTable(name, data)  { localStorage.setItem('wl_' + name, JSON.stringify(data)); }
  function nextId(arr)           { return arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1; }

  /* ---- Seed initial data if first run ---- */
  async function seed() {
    if (localStorage.getItem('wl_seeded')) return;

    // Default tours
    setTable('tours', [
      { id:1, name:'Sahara Desert Adventure', location:'Morocco',   days:3, price:299, rating:4.8, seats:15, description:'Experience the magic of the Sahara with camel rides, stargazing, and traditional Berber camps.', image:'./images/saharadesert.jpg' },
      { id:2, name:'Bali Temple Trail',        location:'Indonesia', days:2, price:199, rating:4.7, seats:19, description:'Explore ancient temples, lush rice terraces, and spiritual ceremonies across Bali.',              image:'./images/bali temple trail.jpg'   },
      { id:3, name:'Northern Lights Expedition',location:'Iceland',  days:4, price:499, rating:4.9, seats:12, description:'Chase the aurora borealis across the Arctic wilderness with expert guides.',                      image:'./images/northern lights.jpg'},
      { id:4, name:'Amalfi Coast Sailing',      location:'Italy',    days:5, price:379, rating:4.6, seats:10, description:'Sail along the stunning Amalfi Coast with stops at Positano, Ravello, and hidden coves.',       image:'./images/amalfi coast.jpg' },
      { id:5, name:'Machu Picchu Trek',          location:'Peru',    days:7, price:449, rating:4.9, seats:15, description:'Trek the Inca Trail through cloud forests and Andean peaks to the lost city.',                  image:'./images/machu picchu.jpg'  },
      { id:6, name:'Tokyo Street Food Tour',     location:'Japan',   days:2, price:89,  rating:4.8, seats:12, description:'Dive into Tokyo\'s legendary street food scene across Shibuya, Shinjuku, and Asakusa.',         image:'./images/tokyo street food tour.jpg'  },
    ]);

    // Default admin (password: "admin") and user santa (password: "password")
    const adminHash = await hashPassword('admin');
    const userHash  = await hashPassword('password');
    setTable('users', [
      { id:1, username:'admin', email:'admin@wanderlust.com', passwordHash: adminHash, role:'admin' },
      { id:2, username:'santa', email:'santa@example.com',   passwordHash: userHash,  role:'user'  },
    ]);

    setTable('bookings', []);
    localStorage.setItem('wl_seeded', '1');
  }

  /* ---- User methods ---- */
  async function registerUser(username, email, password) {
    const users = getTable('users');
    if (users.find(u => u.email === email))    return { error: 'Email already registered.' };
    if (users.find(u => u.username === username)) return { error: 'Username taken.' };
    const hash = await hashPassword(password);
    const user = { id: nextId(users), username, email, passwordHash: hash, role: 'user' };
    users.push(user);
    setTable('users', users);
    return { user };
  }

  async function loginUser(email, password) {
    const users = getTable('users');
    const hash  = await hashPassword(password);
    const user  = users.find(u => u.email === email && u.passwordHash === hash);
    if (!user) return { error: 'Invalid email or password.' };
    return { user };
  }

  async function updateUsername(userId, newUsername) {
    const users = getTable('users');
    if (users.find(u => u.username === newUsername && u.id !== userId)) return { error: 'Username taken.' };
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { error: 'User not found.' };
    users[idx].username = newUsername;
    setTable('users', users);
    return { user: users[idx] };
  }

  async function updatePassword(userId, currentPassword, newPassword) {
    const users = getTable('users');
    const hash  = await hashPassword(currentPassword);
    const idx   = users.findIndex(u => u.id === userId && u.passwordHash === hash);
    if (idx === -1) return { error: 'Current password is incorrect.' };
    users[idx].passwordHash = await hashPassword(newPassword);
    setTable('users', users);
    return { ok: true };
  }

  /* ---- Tour methods ---- */
  function getTours()             { return getTable('tours'); }
  function getTourById(id)        { return getTours().find(t => t.id === id); }

  function addTour(tour) {
    const tours = getTours();
    tour.id = nextId(tours);
    tours.push(tour);
    setTable('tours', tours);
    return tour;
  }

  function updateTour(id, data) {
    const tours = getTours();
    const idx   = tours.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tours[idx] = { ...tours[idx], ...data };
    setTable('tours', tours);
    return tours[idx];
  }

  function deleteTour(id) {
    setTable('tours', getTours().filter(t => t.id !== id));
    // also remove related bookings
    setTable('bookings', getTable('bookings').filter(b => b.tourId !== id));
  }

  /* ---- Booking methods ---- */
  function getBookings()              { return getTable('bookings'); }
  function getBookingsByUser(userId)  { return getBookings().filter(b => b.userId === userId); }

  function addBooking(userId, tourId, seats, date) {
    const tours = getTours();
    const tidx  = tours.findIndex(t => t.id === tourId);
    if (tidx === -1 || tours[tidx].seats < seats) return { error: 'Not enough seats.' };

    // Deduct seats from tour
    tours[tidx].seats -= seats;
    setTable('tours', tours);

    const bookings = getBookings();
    const booking  = { id: nextId(bookings), userId, tourId, seats, date, status: 'confirmed' };
    bookings.push(booking);
    setTable('bookings', bookings);
    return { booking };
  }

  function cancelBooking(bookingId) {
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return { error: 'Booking not found.' };

    const booking = bookings[idx];
    const tours = getTours();
    const tidx = tours.findIndex(t => t.id === booking.tourId);
    if (tidx !== -1) {
      tours[tidx].seats += booking.seats;
      setTable('tours', tours);
    }

    bookings.splice(idx, 1);
    setTable('bookings', bookings);
    return { ok: true };
  }

  return { seed, registerUser, loginUser, updateUsername, updatePassword,
           getTours, getTourById, addTour, updateTour, deleteTour,
           getBookings, getBookingsByUser, addBooking, cancelBooking };
})();
