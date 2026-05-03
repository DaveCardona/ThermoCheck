/* ════════════════════════════════
   admin.js — Dashboard administrador
════════════════════════════════ */

let adminFiltro   = 'todos';
let adminPagina   = 1;
const ADMIN_PPP   = 8;
let adminInterval = null;

/* ── Init: restaurar sesión ── */
document.addEventListener('DOMContentLoaded', () => {
  const sesion = sessionStorage.getItem('currentUser');
  if (!sesion) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = JSON.parse(sesion);
  if (currentUser.id_rol !== 2) {
  window.location.href = 'paciente.html';
  return;
}

window.addEventListener('pageshow', function (event) {
  if (!sessionStorage.getItem('currentUser')) {
    window.location.replace('login.html');
  }
});

  const screen = document.getElementById('screen-admin');
  if (screen) screen.classList.add('active');

  initAdmin();
});

function initAdmin() {
  renderAdminStats();
  renderAdminTabla();
  if (adminInterval) clearInterval(adminInterval);
  adminInterval = setInterval(() => {
    renderAdminStats();
    renderAdminTabla();
  }, 10000);
}

/* ── Stats ── */
function renderAdminStats() {
  const hoy     = hoyISO();
  const hoyLecs = LECTURAS.filter(l => l.fecha === hoy);
  const fiebres = hoyLecs.filter(l => l.estado === 'fiebre');

  const prom   = hoyLecs.length
    ? (hoyLecs.reduce((a, b) => a + b.temp, 0) / hoyLecs.length).toFixed(1)
    : null;
  const maxLec = hoyLecs.length
    ? hoyLecs.reduce((a, b) => a.temp > b.temp ? a : b)
    : null;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total',     hoyLecs.length);
  set('stat-prom',      prom ? prom + '°C' : '--.-');
  set('stat-max',       maxLec ? maxLec.temp.toFixed(1) + '°C' : '--.-');
  set('stat-max-quien', maxLec ? maxLec.paciente : '—');
  set('stat-alertas',   fiebres.length);

  const banner = document.getElementById('alertas-banner');
  if (!banner) return;
  if (fiebres.length > 0) {
    const nombres = [...new Set(fiebres.map(f => f.paciente))].join(', ');
    const txt = document.getElementById('alertas-texto');
    if (txt) txt.textContent =
      `⚠ ${fiebres.length} paciente${fiebres.length > 1 ? 's' : ''} con fiebre hoy: ${nombres}`;
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }
}

/* ── Filtros ── */
function setAdminFiltro(filtro, btn) {
  adminFiltro = filtro;
  adminPagina = 1;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminTabla();
}

function getAdminFiltradas() {
  const searchEl = document.getElementById('tabla-search');
  const q = searchEl ? searchEl.value.toLowerCase() : '';
  return LECTURAS
    .filter(l => {
      const matchF =
        adminFiltro === 'todos'  ? true :
        adminFiltro === 'fiebre' ? (l.estado === 'fiebre' || l.estado === 'fiebre_leve') :
        l.estado === 'normal';
      const matchQ = !q || l.paciente.toLowerCase().includes(q);
      return matchF && matchQ;
    })
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
}

/* ── Tabla ── */
function renderAdminTabla() {
  const lecs      = getAdminFiltradas();
  const totalPags = Math.max(1, Math.ceil(lecs.length / ADMIN_PPP));
  if (adminPagina > totalPags) adminPagina = totalPags;

  const slice = lecs.slice((adminPagina - 1) * ADMIN_PPP, adminPagina * ADMIN_PPP);
  const tbody = document.getElementById('admin-tabla-body');
  if (!tbody) return;

  tbody.innerHTML = slice.length
    ? slice.map(l => {
        const info = getEstadoInfo(l.estado);
        return `
        <tr class="${l.estado !== 'normal' ? 'row-fiebre' : ''}">
          <td><strong>${l.paciente}</strong></td>
          <td><span class="temp-cell" style="color:${info.color}">${l.temp.toFixed(1)}°C</span></td>
          <td><span class="badge-estado ${info.clase}">${info.label}</span></td>
          <td>${formatFecha(l.fecha)}</td>
          <td style="color:var(--text2);font-family:var(--mono);font-size:.82rem">${l.hora}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="empty-state">Sin registros</td></tr>';

  const info = document.getElementById('pag-info');
  if (info) info.textContent = `Mostrando ${slice.length} de ${lecs.length} registros`;

  renderAdminPaginacion(totalPags);
}

/* ── Paginación ── */
function renderAdminPaginacion(totalPags) {
  const pagEl = document.getElementById('pag-btns');
  if (!pagEl) return;
  pagEl.innerHTML = '';

  const mk = (label, cb, disabled, active) => {
    const b = document.createElement('button');
    b.className   = 'pag-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.onclick     = cb;
    if (disabled) b.style.opacity = '.35';
    return b;
  };

  pagEl.appendChild(mk('←', () => { if (adminPagina > 1) { adminPagina--; renderAdminTabla(); } }, adminPagina === 1));
  for (let i = 1; i <= totalPags; i++) {
    pagEl.appendChild(mk(i, () => { adminPagina = i; renderAdminTabla(); }, false, i === adminPagina));
  }
  pagEl.appendChild(mk('→', () => { if (adminPagina < totalPags) { adminPagina++; renderAdminTabla(); } }, adminPagina === totalPags));
}