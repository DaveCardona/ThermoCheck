/* ════════════════════════════════
   data.js — Estado global, datos demo, utilidades
════════════════════════════════ */

/* ── USUARIOS ── */
let USUARIOS = {
  ana:   { pass: '1234',     nombre: 'Ana García',    rol: 'paciente', avatar: 'AG', cedula: '10001', telefono: '3001234567' },
  pedro: { pass: '1234',     nombre: 'Pedro López',   rol: 'paciente', avatar: 'PL', cedula: '10002', telefono: '3009876543' },
  admin: { pass: 'admin123', nombre: 'Administrador', rol: 'admin',    avatar: 'AD', cedula: '',      telefono: '' }
};

/* ── LECTURAS DEMO ── */
let LECTURAS = [
  { id: 1, paciente: 'Ana García',  usuario: 'ana',   temp: 36.8, estado: 'normal',      fecha: '2025-04-22', hora: '07:30' },
  { id: 2, paciente: 'Pedro López', usuario: 'pedro', temp: 38.2, estado: 'fiebre',       fecha: '2025-04-22', hora: '08:15' },
  { id: 3, paciente: 'Ana García',  usuario: 'ana',   temp: 36.5, estado: 'normal',       fecha: '2025-04-21', hora: '07:45' },
  { id: 4, paciente: 'Pedro López', usuario: 'pedro', temp: 37.6, estado: 'fiebre_leve',  fecha: '2025-04-21', hora: '08:00' },
  { id: 5, paciente: 'Ana García',  usuario: 'ana',   temp: 37.1, estado: 'normal',       fecha: '2025-04-20', hora: '07:20' },
  { id: 6, paciente: 'Pedro López', usuario: 'pedro', temp: 36.9, estado: 'normal',       fecha: '2025-04-20', hora: '08:30' },
  { id: 7, paciente: 'Ana García',  usuario: 'ana',   temp: 38.5, estado: 'fiebre',       fecha: '2025-04-19', hora: '07:50' },
  { id: 8, paciente: 'Pedro López', usuario: 'pedro', temp: 36.7, estado: 'normal',       fecha: '2025-04-19', hora: '08:10' },
];

/* ── SESIÓN ACTIVA ── */
let currentUser = null;

/* ════════════════════════════════
   UTILIDADES
════════════════════════════════ */

function getEstadoInfo(estado) {
  const map = {
    normal:      { clase: 'ok',   color: 'var(--green)',  label: 'Normal',      consejo: 'Tu temperatura es normal. ¡Todo bien!' },
    fiebre_leve: { clase: 'warn', color: 'var(--yellow)', label: 'Fiebre leve', consejo: 'Temperatura elevada. Descansa e hidrátate.' },
    fiebre:      { clase: 'bad',  color: 'var(--red)',    label: 'Fiebre alta', consejo: 'Fiebre alta detectada. Consulta con un médico.' }
  };
  return map[estado] || { clase: 'none', color: 'var(--text3)', label: '—', consejo: '' };
}

function clasificarTemp(temp) {
  if (temp >= 38)   return 'fiebre';
  if (temp >= 37.5) return 'fiebre_leve';
  return 'normal';
}

function formatFecha(f) {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function horaActual() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function iniciales(nombre) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/* ════════════════════════════════
   NAVEGACIÓN ENTRE PÁGINAS SEPARADAS
   Cada .html es una página independiente.
   showScreen() redirige al archivo correcto;
   si la pantalla ya existe en el DOM la activa directamente.
════════════════════════════════ */
const SCREEN_PAGES = {
  'screen-login':    'login.html',
  'screen-registro': 'registro.html',
  'screen-paciente': 'paciente.html',
  'screen-admin':    'admin.html',
};

function showScreen(id) {
  const el = document.getElementById(id);

  if (el) {
    /* El elemento existe en esta página: activarlo directamente */
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
  } else {
    /* El elemento está en otra página: navegar a ella */
    const pagina = SCREEN_PAGES[id];
    if (pagina) {
      window.location.href = pagina;
    } else {
      console.warn('showScreen: pantalla desconocida →', id);
    }
  }
}

function showToast(msg, tipo) {
  const t   = document.getElementById('toast');
  const dot = document.getElementById('toast-dot');
  const txt = document.getElementById('toast-msg');
  if (!t || !dot || !txt) return;          /* guarda: toast puede no existir */

  const colores = { ok: 'var(--green)', warn: 'var(--yellow)', bad: 'var(--red)', info: 'var(--accent)' };
  dot.style.background = colores[tipo] || 'var(--accent)';
  txt.textContent = msg;
  t.className = `toast show ${tipo}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3500);
}