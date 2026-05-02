/* ═══════════════════════════════════════════════════════════════
   CraftMods — Vanilla JS App
   API base: /api   Auth: cookie (cm_token, credentials:"include")
═══════════════════════════════════════════════════════════════ */

const API = '/api';

/* ── fetch wrapper ─────────────────────────────────────────── */
async function req(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

/* ── API helpers ────────────────────────────────────────────── */
const api = {
  me:       ()           => req('/auth/me'),
  login:    (e, p)       => req('/auth/login',    { method:'POST', body: JSON.stringify({ email:e, password:p }) }),
  register: (u, e, p)   => req('/auth/register', { method:'POST', body: JSON.stringify({ username:u, email:e, password:p }) }),
  logout:   ()           => req('/auth/logout',   { method:'POST' }),

  getMods: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search   && params.search !== '')   qs.set('search',    params.search);
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    if (params.sort)     qs.set('sort',      params.sort);
    if (params.priceType) qs.set('priceType', params.priceType);
    if (params.page)     qs.set('page',      params.page);
    if (params.limit)    qs.set('limit',     params.limit);
    return req('/mods?' + qs);
  },
  getMod:      (id)           => req(`/mods/${id}`),
  downloadMod: (id)           => req(`/mods/${id}/download`, { method:'POST' }),
  purchase:    (modId)        => req('/purchases', { method:'POST', body: JSON.stringify({ modId }) }),
  getPurchases:()             => req('/purchases'),
  getReviews:  (id, sort)     => req(`/mods/${id}/reviews${sort ? '?sort='+sort : ''}`),
  addReview:   (id, rating, comment) => req(`/mods/${id}/reviews`, { method:'POST', body: JSON.stringify({ rating, comment }) }),

  adminStats:     ()     => req('/admin/stats'),
  adminUsers:     ()     => req('/admin/users'),
  deleteUser:     (id)   => req(`/admin/users/${id}`,       { method:'DELETE' }),
  adminMods:      ()     => req('/admin/mods'),
  patchModStatus: (id,s) => req(`/admin/mods/${id}/status`, { method:'PATCH', body: JSON.stringify({ status:s }) }),
  deleteMod:      (id)   => req(`/admin/mods/${id}`,        { method:'DELETE' }),
  adminReviews:   ()     => req('/admin/reviews'),
  deleteReview:   (id)   => req(`/admin/reviews/${id}`,     { method:'DELETE' }),
  adminPurchases: ()     => req('/admin/purchases'),
};

/* ── Auth state (shared across pages) ──────────────────────── */
let currentUser = null;

async function loadUser() {
  try { const d = await api.me(); currentUser = d.user; }
  catch { currentUser = null; }
  renderNav();
}

/* ── SVG icon helpers ───────────────────────────────────────── */
const svg = {
  box:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  star:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starO:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  user:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  logout:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  shield:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  menu:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  x:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  search:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  filter:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  arrow:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  chevL:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevR:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  check:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  lock:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  creditCard:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  trending: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  package:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  users:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  dollar:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  trash:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  eye:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
  info:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  github:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
  discord:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>`,
};

/* ── Utilities ──────────────────────────────────────────────── */
function fmtDl(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'k';
  return String(n);
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m+'m ago';
  const h = Math.floor(m/60);
  if (h < 24) return h+'h ago';
  const d = Math.floor(h/24);
  if (d < 30) return d+' day'+(d!==1?'s':'')+' ago';
  const mo = Math.floor(d/30);
  return mo+' month'+(mo!==1?'s':'')+' ago';
}
function initials(name) {
  return name.split(/[_\s]/).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('');
}
function catClass(cat) {
  return { Utility:'cat-utility', Magic:'cat-magic', Tech:'cat-tech',
    Adventure:'cat-adventure', Building:'cat-building', Performance:'cat-performance' }[cat] || '';
}
function starRating(n, size=12) {
  let html = '';
  for (let i=1;i<=5;i++) {
    const filled = i <= Math.round(n);
    html += `<span style="color:${filled?'hsl(48 96% 60%)':'hsl(220 13% 25%)'}; width:${size}px; height:${size}px; display:inline-flex; align-items:center;">${filled?svg.star:svg.starO}</span>`;
  }
  return html;
}

/* ── Toast ──────────────────────────────────────────────────── */
let toastContainer = null;
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}
function toast(msg, type='success') {
  const iconMap = { success: svg.check, error: svg.x, info: svg.info };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${iconMap[type]||svg.info}</span><span>${msg}</span>`;
  const c = getToastContainer();
  c.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => el.remove());
  }, 3500);
}

/* ── Navbar ─────────────────────────────────────────────────── */
function renderNav() {
  const page = location.pathname.split('/').filter(Boolean).pop()?.replace('.html','') || 'index';
  const links = [
    { href:'index.html', label:'Home',    key:'index' },
    { href:'catalog.html', label:'Catalog', key:'catalog' },
  ];
  const navLinksHTML = links.map(l =>
    `<a href="${l.href}" class="nav-link${page===l.key?' active':''}">${l.label}</a>`
  ).join('');
  const adminLink = currentUser?.role==='admin'
    ? `<a href="admin.html" class="nav-link admin-link${page==='admin'?' active':''}"><span style="display:flex;align-items:center;gap:4px;">${svg.shield}Admin</span></a>` : '';

  const authHTML = currentUser
    ? `<a href="profile.html" class="nav-user">
        <div class="avatar-small">${initials(currentUser.username)}</div>
        <span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${currentUser.username}</span>
       </a>
       <button class="btn-logout" id="btn-logout">${svg.logout}Sign Out</button>`
    : `<a href="login.html" class="btn-signin">Sign In</a>
       <a href="login.html" class="btn-get-started">Get Started</a>`;

  const nav = document.getElementById('navbar');
  if (!nav) return;
  nav.innerHTML = `
    <div class="navbar-inner">
      <a href="index.html" class="nav-logo">${svg.box}<span>CraftMods</span></a>
      <div class="nav-links">${navLinksHTML}${adminLink}</div>
      <div class="nav-auth">${authHTML}</div>
      <button class="hamburger" id="hamburger">${svg.menu}</button>
    </div>
    <div class="mobile-menu" id="mobile-menu">
      ${links.map(l=>`<a href="${l.href}" class="mobile-link${page===l.key?' active':''}">${l.label}</a>`).join('')}
      ${currentUser?.role==='admin'?`<a href="admin.html" class="mobile-link" style="color:var(--primary)">${svg.shield} Admin</a>`:''}
      <div class="mobile-divider">
        ${currentUser
          ? `<a href="profile.html" class="mobile-link">${svg.user} ${currentUser.username}</a>
             <button class="mobile-link" id="btn-logout-m" style="text-align:left;width:100%;border:none;background:none;cursor:pointer;">${svg.logout} Sign Out</button>`
          : `<a href="login.html" class="mobile-link">Sign In</a>
             <a href="login.html" class="mobile-link" style="background:var(--primary);color:var(--primary-fg);text-align:center;">Get Started</a>`}
      </div>
    </div>`;

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('open');
  });
  document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  document.getElementById('btn-logout-m')?.addEventListener('click', doLogout);
}

async function doLogout() {
  try { await api.logout(); } catch {}
  currentUser = null;
  toast('Signed out successfully.');
  renderNav();
  setTimeout(() => location.href='index.html', 600);
}

/* ── Purchase Modal ─────────────────────────────────────────── */
let currentMod = null;

function openPurchaseModal(mod) {
  currentMod = mod;
  const overlay = document.getElementById('purchase-modal');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  overlay.querySelector('#modal-mod-title').textContent = mod.title;
  overlay.querySelector('#modal-mod-author').textContent = 'by ' + mod.author;
  overlay.querySelector('#modal-mod-price').textContent = '$'+Number(mod.price).toFixed(2);
  overlay.querySelector('#modal-mod-img').style.background = mod.image;
  overlay.querySelector('#btn-confirm-pay').textContent = 'Pay $'+Number(mod.price).toFixed(2);
  overlay.querySelector('#btn-confirm-pay').disabled = false;
}

function closePurchaseModal() {
  document.getElementById('purchase-modal')?.classList.add('hidden');
  currentMod = null;
}

async function confirmPurchase() {
  if (!currentMod) return;
  if (!currentUser) { toast('Please sign in to purchase.','info'); closePurchaseModal(); location.href='login.html'; return; }
  const btn = document.getElementById('btn-confirm-pay');
  btn.disabled = true; btn.textContent = 'Processing…';
  try {
    await api.purchase(currentMod.id);
    toast(`Purchase complete! Enjoy ${currentMod.title}.`);
    closePurchaseModal();
  } catch(e) {
    if (e.message==='Already purchased') { toast('You already own this mod.','info'); closePurchaseModal(); }
    else { toast(e.message,'error'); btn.disabled=false; btn.textContent='Pay $'+Number(currentMod.price).toFixed(2); }
  }
}

function handleDownload(mod) {
  if (!currentUser) { toast('Please sign in to download.','info'); return; }
  api.downloadMod(mod.id).then(() => toast(`Downloading ${mod.title}…`)).catch(e=>toast(e.message,'error'));
}

/* ── Mod Card HTML ──────────────────────────────────────────── */
function modCardHTML(mod) {
  const isFree = Number(mod.price) === 0;
  return `
<div class="mod-card" style="cursor:pointer;">
  <a href="mod-detail.html?id=${mod.id}" style="display:block;">
    <div class="mod-card-image" style="background:${mod.image}">
      <div class="mod-card-gradient"></div>
      <div class="mod-card-shine"></div>
      <span class="mod-card-cat ${catClass(mod.category)}">${mod.category}</span>
      ${mod.featured?`<span class="mod-card-featured">Featured</span>`:''}
    </div>
  </a>
  <div class="mod-card-body">
    <div>
      <a href="mod-detail.html?id=${mod.id}" class="mod-card-title">${mod.title}</a>
      <p class="mod-card-desc">${mod.description}</p>
    </div>
    <div class="mod-card-meta">
      <span>${svg.user}${mod.author}</span>
      <span>${svg.download}${fmtDl(Number(mod.downloadsCount||mod.downloads||0))}</span>
      <span>${svg.star}<span style="color:var(--fg);opacity:.7">${Number(mod.ratingAverage||mod.rating||0).toFixed(1)}</span></span>
    </div>
    <div class="mod-card-tags">
      ${(mod.tags||[]).slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}
      <span class="mod-version">v${mod.version}</span>
    </div>
    <div class="mod-card-footer">
      <div>
        <div class="${isFree?'price-free':'price-paid'}">${isFree?'Free':'$'+Number(mod.price).toFixed(2)}</div>
        ${!isFree?`<div class="price-sub">one-time</div>`:''}
      </div>
      ${isFree
        ? `<button class="btn-download btn-dl" data-id="${mod.id}">${svg.download}Download</button>`
        : `<button class="btn-buy btn-pur" data-id="${mod.id}">Buy Now</button>`}
    </div>
  </div>
</div>`;
}

function attachCardActions(container, mods) {
  container.querySelectorAll('.btn-dl').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const mod = mods.find(m=>m.id===Number(btn.dataset.id)||String(m.id)===btn.dataset.id);
      if (mod) handleDownload(mod);
    });
  });
  container.querySelectorAll('.btn-pur').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const mod = mods.find(m=>String(m.id)===btn.dataset.id||m.id===Number(btn.dataset.id));
      if (mod) {
        if (!currentUser) { toast('Please sign in to purchase.','info'); return; }
        openPurchaseModal(mod);
      }
    });
  });
}

/* ── Skeleton ───────────────────────────────────────────────── */
function skeletonCards(n=6) {
  return Array.from({length:n}).map(()=>`
    <div class="skeleton-card">
      <div class="skeleton-img shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-3-4 shimmer"></div>
        <div class="skeleton-line w-full h-sm shimmer"></div>
        <div class="skeleton-line w-2-3 h-sm shimmer"></div>
        <div style="display:flex;gap:8px">
          <div class="skeleton-line h-xs shimmer" style="width:64px"></div>
          <div class="skeleton-line h-xs shimmer" style="width:48px"></div>
        </div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: INDEX (home)
═══════════════════════════════════════════════════════════════ */
async function initHome() {
  await loadUser();

  // fetch stats & featured mods in parallel
  const grid = document.getElementById('featured-grid');
  const statsEl = document.getElementById('stats-row');
  if (grid) grid.innerHTML = skeletonCards(3);

  const [modsRes] = await Promise.allSettled([
    api.getMods({ sort:'rating', limit:6 }),
  ]);

  let mods = [];
  if (modsRes.status==='fulfilled') mods = modsRes.value.mods || [];

  if (statsEl) {
    const dl  = mods.reduce((s,m)=>s+Number(m.downloadsCount||0),0);
    const cats = [...new Set(mods.map(m=>m.category))];
    statsEl.innerHTML = [
      { icon:svg.package, val: mods.length+'+ Mods',    label:'Available Mods'    },
      { icon:svg.users,   val: '2.4k',                  label:'Active Players'    },
      { icon:svg.download,val: fmtDl(dl||124500)+'+ DL',label:'Total Downloads'   },
      { icon:svg.star,    val: cats.length||6,           label:'Categories'        },
    ].map(s=>`
      <div class="stat-card">
        ${s.icon}
        <div class="stat-value">${s.val}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
  }

  if (grid && mods.length) {
    grid.innerHTML = mods.slice(0,6).map(m=>modCardHTML(m)).join('');
    attachCardActions(grid, mods);
  } else if (grid) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p class="empty-sub">Could not load mods. Please check the API server.</p></div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: CATALOG
═══════════════════════════════════════════════════════════════ */
async function initCatalog() {
  await loadUser();

  const CATS = ['All','Utility','Magic','Tech','Adventure','Building','Performance'];
  const grid    = document.getElementById('catalog-grid');
  const pillsRow= document.getElementById('pills-row');
  const searchEl= document.getElementById('catalog-search');
  const sortEl  = document.getElementById('catalog-sort');
  const priceEl = document.getElementById('catalog-price');
  const pagination = document.getElementById('pagination');
  const countEl = document.getElementById('result-count');

  let params = { category:'All', sort:'downloads', page:1, limit:9 };

  // Build category pills
  if (pillsRow) {
    pillsRow.innerHTML = CATS.map(c=>
      `<button class="cat-btn${c==='All'?' active':''}" data-cat="${c}">${c}</button>`
    ).join('');
    pillsRow.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pillsRow.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        params.category = btn.dataset.cat;
        params.page = 1;
        loadCatalog();
      });
    });
  }

  searchEl?.addEventListener('input', debounce(() => {
    params.search = searchEl.value;
    params.page = 1;
    loadCatalog();
  }, 300));

  sortEl?.addEventListener('change', () => { params.sort = sortEl.value; params.page=1; loadCatalog(); });
  priceEl?.addEventListener('change', () => { params.priceType = priceEl.value; params.page=1; loadCatalog(); });

  let lastMods = [];

  async function loadCatalog() {
    if (grid) grid.innerHTML = skeletonCards(9);
    try {
      const res = await api.getMods(params);
      lastMods = res.mods || [];
      const total = res.total || lastMods.length;
      const totalPages = Math.ceil(total / (params.limit||9)) || 1;

      if (countEl) countEl.textContent = `${total} mod${total!==1?'s':''} found`;

      if (!lastMods.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon">${svg.search}</div>
            <div class="empty-title">No mods found</div>
            <p class="empty-sub">Try adjusting your search or filters.</p>
            <button class="btn-clear" id="btn-clear-filters">Clear Filters</button>
          </div>`;
        document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
          params = { category:'All', sort:'downloads', page:1, limit:9 };
          if (searchEl) searchEl.value = '';
          if (sortEl) sortEl.value = 'downloads';
          if (priceEl) priceEl.value = '';
          pillsRow?.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat==='All'));
          loadCatalog();
        });
      } else {
        grid.innerHTML = lastMods.map(m=>modCardHTML(m)).join('');
        attachCardActions(grid, lastMods);
      }

      if (pagination) {
        const p = params.page;
        pagination.innerHTML = `
          <button class="btn-page" id="pg-prev" ${p<=1?'disabled':''}>${svg.chevL} Prev</button>
          <span class="page-info">Page ${p} of ${totalPages}</span>
          <button class="btn-page" id="pg-next" ${p>=totalPages?'disabled':''}>Next ${svg.chevR}</button>`;
        document.getElementById('pg-prev')?.addEventListener('click', () => { if (params.page>1){ params.page--; loadCatalog(); } });
        document.getElementById('pg-next')?.addEventListener('click', () => { if (params.page<totalPages){ params.page++; loadCatalog(); } });
      }
    } catch(e) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p class="text-muted">${e.message}</p></div>`;
    }
  }

  loadCatalog();
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: MOD DETAIL
═══════════════════════════════════════════════════════════════ */
async function initModDetail() {
  await loadUser();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href='catalog.html'; return; }
  const root = document.getElementById('mod-detail-root');
  if (!root) return;
  root.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:6rem;"><p class="text-muted">Loading…</p></div>`;

  try {
    const [detailRes, reviewsRes] = await Promise.allSettled([
      api.getMod(id),
      api.getReviews(id),
    ]);
    if (detailRes.status==='rejected') throw new Error(detailRes.reason?.message||'Not found');
    const { mod, owned } = detailRes.value;
    const reviews = reviewsRes.status==='fulfilled' ? (reviewsRes.value.reviews||[]) : [];
    const userReview = reviewsRes.status==='fulfilled' ? reviewsRes.value.userReview : null;
    const isFree = Number(mod.price)===0;

    root.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:2.5rem 1rem 5rem;">
        <!-- Back -->
        <a href="catalog.html" style="display:inline-flex;align-items:center;gap:6px;font-size:.875rem;color:var(--muted);margin-bottom:1.5rem;transition:color .2s;" onmouseover="this.style.color='var(--fg)'" onmouseout="this.style.color='var(--muted)'">
          ${svg.chevL} Back to Catalog
        </a>
        <!-- Hero -->
        <div style="height:280px;border-radius:16px;overflow:hidden;position:relative;margin-bottom:2rem;background:${mod.image}">
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.7) 100%)"></div>
          <div style="position:absolute;bottom:24px;left:24px;right:24px;">
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
              <span class="mod-card-cat ${catClass(mod.category)}" style="position:static;">${mod.category}</span>
              ${mod.featured?`<span class="mod-card-featured" style="position:static;">Featured</span>`:''}
            </div>
            <h1 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:700;letter-spacing:-.025em;margin-bottom:4px;">${mod.title}</h1>
            <div style="display:flex;align-items:center;gap:16px;font-size:.75rem;color:hsl(210 20% 60%);">
              <span style="display:flex;align-items:center;gap:4px;">${svg.user}<span>${mod.author}</span></span>
              <span style="display:flex;align-items:center;gap:4px;">${svg.download}<span>${fmtDl(Number(mod.downloadsCount||0))}</span></span>
              <span style="display:flex;align-items:center;gap:4px;">${svg.star}<span>${Number(mod.ratingAverage||0).toFixed(1)} (${mod.ratingTotal||reviews.length})</span></span>
              <span>v${mod.version}</span>
            </div>
          </div>
        </div>
        <!-- 2 col -->
        <div style="display:grid;grid-template-columns:1fr;gap:24px;" id="detail-layout">
          <!-- Left -->
          <div id="detail-left">
            <!-- desc -->
            <div class="card-panel" style="margin-bottom:16px;">
              <div class="panel-header">${svg.info}<span class="panel-title">About this Mod</span></div>
              <p style="font-size:.875rem;color:hsl(210 15% 55%);line-height:1.7;white-space:pre-line;">${mod.longDescription||mod.description}</p>
            </div>
            <!-- reviews -->
            <div class="card-panel">
              <div class="panel-header">${svg.star}<span class="panel-title">Reviews</span><span class="panel-count">${reviews.length}</span></div>
              ${currentUser && !userReview ? `
                <div id="review-form" style="margin-bottom:20px;padding:16px;border-radius:8px;background:hsl(220 14% 9%);border:1px solid rgba(255,255,255,.06);">
                  <p style="font-size:.75rem;font-weight:500;color:var(--muted);margin-bottom:8px;">Your rating</p>
                  <div id="star-picker" style="display:flex;gap:4px;margin-bottom:12px;cursor:pointer;">
                    ${[1,2,3,4,5].map(i=>`<span class="star-btn" data-val="${i}" style="font-size:20px;color:hsl(220 13% 25%);transition:color .15s;">${'★'}</span>`).join('')}
                  </div>
                  <textarea id="review-comment" placeholder="Share your experience…" rows="3"
                    style="width:100%;padding:8px 12px;border:1px solid rgba(255,255,255,.07);border-radius:8px;background:hsl(220 14% 10%);color:var(--fg);font-size:.875rem;font-family:inherit;outline:none;resize:vertical;"></textarea>
                  <button id="submit-review" style="margin-top:8px;" class="btn-primary" disabled>Submit Review</button>
                </div>` : ''}
              <div id="reviews-list">
                ${reviews.length===0
                  ? `<p class="text-muted" style="text-align:center;padding:2rem;">No reviews yet. Be the first!</p>`
                  : reviews.map(r=>`
                    <div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05);">
                      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <div class="avatar-small" style="width:28px;height:28px;font-size:10px;">${initials(r.username)}</div>
                        <span style="font-size:.8125rem;font-weight:500;">${r.username}</span>
                        <div style="display:inline-flex;margin-left:4px;">${starRating(r.rating, 11)}</div>
                        <span style="font-size:.6875rem;color:var(--muted);margin-left:auto;">${timeAgo(r.createdAt)}</span>
                      </div>
                      <p style="font-size:.8125rem;color:hsl(210 15% 55%);line-height:1.5;padding-left:36px;">${r.comment}</p>
                    </div>`).join('')}
              </div>
            </div>
          </div>
          <!-- Right / action card -->
          <div id="detail-right">
            <div class="card-panel" style="position:sticky;top:72px;">
              <div style="font-size:1.75rem;font-weight:700;margin-bottom:4px;" class="${isFree?'price-free':''}">
                ${isFree?'Free':'$'+Number(mod.price).toFixed(2)}
              </div>
              ${!isFree?`<div style="font-size:.75rem;color:var(--muted);margin-bottom:16px;">one-time purchase</div>`:'<div style="margin-bottom:16px;"></div>'}
              ${owned || isFree
                ? `<button id="dl-btn" class="btn-primary" style="width:100%;justify-content:center;margin-bottom:8px;">${svg.download}${owned?'Download':'Download Free'}</button>`
                : `<button id="pur-btn" class="btn-primary" style="width:100%;justify-content:center;margin-bottom:8px;">${svg.creditCard} Buy — $${Number(mod.price).toFixed(2)}</button>`}
              ${!owned && !isFree ? `<p style="font-size:.6875rem;color:var(--muted);text-align:center;margin-bottom:16px;">${svg.lock} Secure checkout — demo only</p>` : ''}
              <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:16px;display:flex;flex-direction:column;gap:8px;">
                ${[
                  ['Minecraft','1.20+'],
                  ['Mod Version',mod.version],
                  ['Category',mod.category],
                  ['Tags',(mod.tags||[]).join(', ')],
                ].map(([k,v])=>`
                  <div style="display:flex;justify-content:space-between;font-size:.75rem;">
                    <span style="color:var(--muted);">${k}</span>
                    <span style="color:var(--fg);font-weight:500;">${v}</span>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Responsive layout
    if (window.innerWidth >= 768) {
      document.getElementById('detail-layout').style.gridTemplateColumns = '2fr 1fr';
    }

    // Download / Purchase actions
    document.getElementById('dl-btn')?.addEventListener('click', () => handleDownload(mod));
    document.getElementById('pur-btn')?.addEventListener('click', () => {
      if (!currentUser) { toast('Please sign in to purchase.','info'); return; }
      openPurchaseModal(mod);
    });

    // Star picker
    let selectedRating = 0;
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('mouseover', () => {
        const v = Number(btn.dataset.val);
        starBtns.forEach(b => b.style.color = Number(b.dataset.val)<=v?'hsl(48 96% 60%)':'hsl(220 13% 25%)');
      });
      btn.addEventListener('mouseout', () => {
        starBtns.forEach(b => b.style.color = Number(b.dataset.val)<=selectedRating?'hsl(48 96% 60%)':'hsl(220 13% 25%)');
      });
      btn.addEventListener('click', () => {
        selectedRating = Number(btn.dataset.val);
        starBtns.forEach(b => b.style.color = Number(b.dataset.val)<=selectedRating?'hsl(48 96% 60%)':'hsl(220 13% 25%)');
        checkReviewReady();
      });
    });

    const commentEl = document.getElementById('review-comment');
    const submitBtn = document.getElementById('submit-review');
    function checkReviewReady() {
      if (submitBtn) submitBtn.disabled = !(selectedRating>0 && commentEl?.value?.trim().length>0);
    }
    commentEl?.addEventListener('input', checkReviewReady);
    submitBtn?.addEventListener('click', async () => {
      submitBtn.disabled=true; submitBtn.textContent='Submitting…';
      try {
        await api.addReview(mod.id, selectedRating, commentEl.value.trim());
        toast('Review submitted!');
        setTimeout(()=>location.reload(),800);
      } catch(e) { toast(e.message,'error'); submitBtn.disabled=false; submitBtn.textContent='Submit Review'; }
    });

  } catch(e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-icon">${svg.x}</div><p class="empty-sub">${e.message}</p><a href="catalog.html" class="btn-clear">Back to Catalog</a></div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: LOGIN
═══════════════════════════════════════════════════════════════ */
async function initLogin() {
  await loadUser();
  if (currentUser) { location.href='index.html'; return; }

  const tabSign = document.getElementById('tab-signin');
  const tabReg  = document.getElementById('tab-register');
  const paneSign= document.getElementById('pane-signin');
  const paneReg = document.getElementById('pane-register');

  function switchTab(t) {
    const isSign = t==='signin';
    tabSign.classList.toggle('active', isSign);
    tabReg.classList.toggle('active', !isSign);
    paneSign.classList.toggle('hidden', !isSign);
    paneReg.classList.toggle('hidden', isSign);
  }
  tabSign?.addEventListener('click', ()=>switchTab('signin'));
  tabReg?.addEventListener('click',  ()=>switchTab('register'));
  document.getElementById('link-register')?.addEventListener('click', e=>{e.preventDefault();switchTab('register');});
  document.getElementById('link-signin')?.addEventListener('click',  e=>{e.preventDefault();switchTab('signin');});

  // Sign-in form
  document.getElementById('form-signin')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const email = document.getElementById('si-email').value.trim();
    const pass  = document.getElementById('si-pass').value;
    btn.disabled=true; btn.textContent='Signing in…';
    try {
      const d = await api.login(email, pass);
      currentUser = d.user;
      toast('Welcome back, '+d.user.username+'!');
      setTimeout(()=>location.href='index.html',600);
    } catch(err) {
      toast(err.message,'error');
      btn.disabled=false; btn.textContent='Sign In';
    }
  });

  // Register form
  document.getElementById('form-register')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const username = document.getElementById('rg-user').value.trim();
    const email    = document.getElementById('rg-email').value.trim();
    const pass     = document.getElementById('rg-pass').value;
    const pass2    = document.getElementById('rg-pass2').value;
    if (pass!==pass2) { toast('Passwords do not match.','error'); return; }
    btn.disabled=true; btn.textContent='Creating account…';
    try {
      const d = await api.register(username, email, pass);
      currentUser = d.user;
      toast('Account created! Welcome, '+d.user.username+'!');
      setTimeout(()=>location.href='index.html',600);
    } catch(err) {
      toast(err.message,'error');
      btn.disabled=false; btn.textContent='Create Account';
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: PROFILE
═══════════════════════════════════════════════════════════════ */
async function initProfile() {
  await loadUser();
  if (!currentUser) { location.href='login.html'; return; }

  const root = document.getElementById('profile-root');
  if (!root) return;

  try {
    const { purchases } = await api.getPurchases();
    const totalSpent = purchases.reduce((s,p)=>s+Number(p.pricePaid||0),0);

    document.getElementById('profile-avatar').textContent = initials(currentUser.username);
    document.getElementById('profile-avatar').style.background = 'hsl(142 60% 35%)';
    document.getElementById('profile-name').textContent  = currentUser.username;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-since').textContent = 'Member since '+fmtDate(currentUser.createdAt||new Date().toISOString());
    document.getElementById('profile-role').textContent  = currentUser.role==='admin'?'Admin':'Member';
    document.getElementById('profile-role').className    = 'role-badge'+(currentUser.role==='admin'?' admin':'');
    document.getElementById('stat-purchases').textContent = purchases.length;
    document.getElementById('stat-spent').textContent    = '$'+totalSpent.toFixed(2);

    const list = document.getElementById('purchases-list');
    if (!purchases.length) {
      list.innerHTML = `<div class="empty-panel">${svg.package}<p>No purchases yet.</p></div>`;
    } else {
      list.innerHTML = purchases.map(p=>`
        <div class="purchase-row">
          <div class="purchase-thumb" style="background:${p.modImage||'hsl(220 13% 18%)'}"></div>
          <div style="flex:1;min-width:0;">
            <div class="purchase-name">${p.modTitle}</div>
            <div class="purchase-meta">${p.modCategory} · ${fmtDate(p.createdAt)}</div>
          </div>
          <div class="purchase-price">${Number(p.pricePaid)===0?'Free':'$'+Number(p.pricePaid).toFixed(2)}</div>
        </div>`).join('');
    }

    document.getElementById('btn-logout-profile')?.addEventListener('click', doLogout);
    if (currentUser.role==='admin') {
      document.getElementById('admin-link')?.classList.remove('hidden');
    }
  } catch(e) {
    toast(e.message,'error');
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: ADMIN
═══════════════════════════════════════════════════════════════ */
async function initAdmin() {
  await loadUser();
  if (!currentUser) { location.href='login.html'; return; }
  if (currentUser.role!=='admin') { toast('Access denied.','error'); location.href='index.html'; return; }

  let activeSection = 'overview';
  const main = document.getElementById('admin-main');

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
      activeSection = link.dataset.section;
      loadSection(activeSection);
    });
  });

  async function loadSection(section) {
    main.innerHTML = `<div style="padding:4rem;text-align:center;"><p class="text-muted">Loading…</p></div>`;
    try {
      if (section==='overview') await renderOverview();
      else if (section==='mods') await renderModsTable();
      else if (section==='users') await renderUsersTable();
      else if (section==='purchases') await renderPurchasesTable();
    } catch(e) {
      main.innerHTML = `<div class="empty-state"><p class="text-muted">${e.message}</p></div>`;
    }
  }

  async function renderOverview() {
    const stats = await api.adminStats();
    main.innerHTML = `
      <h1 class="admin-section-title">Overview</h1>
      <p class="admin-section-sub">Platform stats at a glance</p>
      <div class="stats-row">
        ${[
          { label:'Total Mods',      val:stats.mods,      icon:`<span style="color:hsl(142 71% 45%);">${svg.package}</span>`,  sub:'Published mods' },
          { label:'Total Users',     val:stats.users,     icon:`<span style="color:hsl(213 94% 68%);">${svg.users}</span>`,    sub:'Registered accounts' },
          { label:'Total Purchases', val:stats.purchases, icon:`<span style="color:hsl(48 96% 60%);">${svg.creditCard}</span>`,sub:'Completed orders' },
          { label:'Revenue',         val:'$'+Number(stats.revenue||0).toFixed(2), icon:`<span style="color:hsl(142 71% 45%);">${svg.dollar}</span>`, sub:'Total earned' },
        ].map(s=>`
          <div class="admin-stat">
            <div class="admin-stat-header">
              <span class="admin-stat-label">${s.label}</span>
              <span class="admin-stat-icon">${s.icon}</span>
            </div>
            <div class="admin-stat-value">${s.val}</div>
            <div class="admin-stat-sub">${svg.trending}<span>${s.sub}</span></div>
          </div>`).join('')}
      </div>
      <p style="font-size:.75rem;color:var(--muted);text-align:center;padding:2rem;">Select a section from the sidebar to manage content.</p>`;
  }

  async function renderModsTable() {
    const { mods } = await api.adminMods();
    main.innerHTML = `
      <h1 class="admin-section-title">Mods</h1>
      <p class="admin-section-sub">Manage all published mods</p>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Category</th><th>Price</th><th>Downloads</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            ${mods.map(m=>`
              <tr>
                <td><a href="mod-detail.html?id=${m.id}" style="color:var(--fg);font-weight:500;">${m.title}</a></td>
                <td><span class="mod-card-cat ${catClass(m.category)}" style="position:static;">${m.category}</span></td>
                <td>${Number(m.price)===0?'Free':'$'+Number(m.price).toFixed(2)}</td>
                <td>${fmtDl(Number(m.downloadsCount||0))}</td>
                <td><span class="${m.status==='active'?'status-active':'status-hidden'}">${m.status}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn-table" title="${m.status==='active'?'Hide':'Show'}" data-toggle="${m.id}" data-status="${m.status}">${m.status==='active'?svg.eyeOff:svg.eye}</button>
                    <button class="btn-table danger" title="Delete" data-delete-mod="${m.id}">${svg.trash}</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    main.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status==='active'?'hidden':'active';
        try { await api.patchModStatus(Number(btn.dataset.toggle), newStatus); await renderModsTable(); }
        catch(e) { toast(e.message,'error'); }
      });
    });
    main.querySelectorAll('[data-delete-mod]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this mod?')) return;
        try { await api.deleteMod(Number(btn.dataset.deleteMod)); toast('Mod deleted.'); await renderModsTable(); }
        catch(e) { toast(e.message,'error'); }
      });
    });
  }

  async function renderUsersTable() {
    const { users } = await api.adminUsers();
    main.innerHTML = `
      <h1 class="admin-section-title">Users</h1>
      <p class="admin-section-sub">Manage registered accounts</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            ${users.map(u=>`
              <tr>
                <td style="font-weight:500;">${u.username}</td>
                <td style="color:var(--muted);">${u.email}</td>
                <td><span class="${u.role==='admin'?'role-badge admin':'role-badge'}">${u.role}</span></td>
                <td style="color:var(--muted);">${fmtDate(u.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    ${u.id!==currentUser.id?`<button class="btn-table danger" data-delete-user="${u.id}">${svg.trash}</button>`:'<span style="font-size:.6875rem;color:var(--muted);">You</span>'}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    main.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this user?')) return;
        try { await api.deleteUser(Number(btn.dataset.deleteUser)); toast('User deleted.'); await renderUsersTable(); }
        catch(e) { toast(e.message,'error'); }
      });
    });
  }

  async function renderPurchasesTable() {
    const { purchases } = await api.adminPurchases();
    main.innerHTML = `
      <h1 class="admin-section-title">Purchases</h1>
      <p class="admin-section-sub">All completed transactions</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Mod</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            ${purchases.map(p=>`
              <tr>
                <td style="font-weight:500;">${p.username}</td>
                <td>${p.modTitle}</td>
                <td>${Number(p.pricePaid)===0?'Free':'$'+Number(p.pricePaid).toFixed(2)}</td>
                <td style="color:var(--muted);">${fmtDate(p.createdAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  loadSection('overview');
}

/* ── Debounce ───────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

/* ── Purchase modal wiring (shared) ────────────────────────── */
function initPurchaseModal() {
  const overlay = document.getElementById('purchase-modal');
  if (!overlay) return;
  overlay.querySelector('#btn-cancel')?.addEventListener('click', closePurchaseModal);
  overlay.querySelector('#btn-confirm-pay')?.addEventListener('click', confirmPurchase);
  overlay.addEventListener('click', e => { if (e.target===overlay) closePurchaseModal(); });
}

/* ── Auto-init based on page ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPurchaseModal();
  const page = location.pathname.split('/').filter(Boolean).pop()?.replace('.html','') || 'index';
  if      (page==='index'      || page==='')           initHome();
  else if (page==='catalog')                            initCatalog();
  else if (page==='mod-detail')                         initModDetail();
  else if (page==='login')                              initLogin();
  else if (page==='profile')                            initProfile();
  else if (page==='admin')                              initAdmin();
});
