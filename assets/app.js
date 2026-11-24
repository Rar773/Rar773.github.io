// InstantNews — shared helpers for every page
const API = 'https://bot-production-77f512be.up.railway.app';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Escape text from the API before it goes into HTML (headlines come from outside sources)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(iso) {
  const d = new Date(iso), min = Math.floor((Date.now() - d) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return min + 'm ago';
  const h = Math.floor(min / 60);
  if (h < 24) return h + 'h ago';
  return MONTHS[d.getMonth()] + ' ' + d.getDate();
}

function timeFull(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' · ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
}

// New York time, how traders read the calendar
function timeET(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }) + ' ET';
}
function dayET(iso) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
}

async function api(path) {
  const r = await fetch(API + path, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (!j.success) throw new Error(j.error || 'API error');
  return j.data;
}

const CATEGORY = { markets: 'Markets', fed: 'Central Banks', geopolitics: 'Geopolitics', energy: 'Energy', crypto: 'Crypto', other: 'News' };
const catLabel = c => CATEGORY[c] || 'News';

// Live indicator + news count for today (shown in the nav on every page)
async function loadStatus() {
  const el = document.getElementById('live-status');
  if (!el) return;
  try {
    const s = await api('/api/stats');
    el.classList.toggle('offline', !s.online);
    el.querySelector('.live-text').textContent = s.online ? s.today + ' today' : 'Reconnecting';
    document.querySelectorAll('[data-stat]').forEach(n => {
      const v = s[n.dataset.stat];
      if (v !== null && v !== undefined) n.textContent = v;
    });
  } catch { el.classList.add('offline'); el.querySelector('.live-text').textContent = 'Offline'; }
}

// Cookie-free page counter: sends only the page path, nothing about the visitor
function countView() {
  try {
    const p = location.pathname.replace(/\.html$/, '') || '/';
    if (navigator.sendBeacon) navigator.sendBeacon(API + '/api/hit?p=' + encodeURIComponent(p));
    else fetch(API + '/api/hit?p=' + encodeURIComponent(p), { method: 'POST', keepalive: true });
  } catch {}
}

function setupMenu() {
  const menu = document.getElementById('mobileMenu');
  if (!menu) return;
  const open = () => { menu.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { menu.classList.remove('open'); document.body.style.overflow = ''; };
  document.querySelectorAll('[data-menu-open]').forEach(b => b.addEventListener('click', open));
  menu.querySelectorAll('a, [data-menu-close]').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMenu();
  loadStatus();
  setInterval(loadStatus, 60000);
  countView();
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
