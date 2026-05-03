/* ════════════════════════════════
   paciente.js — Panel del paciente
════════════════════════════════ */

let lecturaTemp = null;

/* ── Init: restaurar sesión desde sessionStorage ── */
document.addEventListener('DOMContentLoaded', () => {
  const sesion = sessionStorage.getItem('currentUser');
  if (!sesion) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = JSON.parse(sesion);

  const screen = document.getElementById('screen-paciente');
  if (screen) screen.classList.add('active');

  initPaciente();
});

//  Bloquear botón atrás después de logout
window.addEventListener('pageshow', function (event) {
  if (!sessionStorage.getItem('currentUser')) {
    window.location.replace('login.html');
  }
});

function initPaciente() {
  const av  = document.getElementById('pac-avatar');
  const nom = document.getElementById('pac-nombre');
  const fec = document.getElementById('pac-fecha-hoy');
  if (av)  av.textContent  = currentUser.avatar;
  if (nom) nom.textContent = currentUser.nombre;
  if (fec) fec.textContent = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  renderEstadoHoy();
  renderHistorial();
}

/* ── Estado hoy ── */
function renderEstadoHoy() {
  const hoy    = hoyISO();
  const lecHoy = LECTURAS.find(
    l => l.usuario === currentUser.username && l.fecha === hoy
  );

  const elIcon   = document.getElementById('status-icon');
  const elTitulo = document.getElementById('status-titulo');
  const elDesc   = document.getElementById('status-desc');
  const elTemp   = document.getElementById('status-temp');
  const elBtn    = document.getElementById('btn-tomar');
  if (!elIcon || !elBtn) return;

  if (lecHoy) {
    const info = getEstadoInfo(lecHoy.estado);
    elIcon.className    = 'status-indicator ' + info.clase;
    elIcon.textContent  = lecHoy.estado === 'normal' ? '✓' : '⚠';
    elTitulo.textContent = info.label;
    elDesc.textContent   = info.consejo;
    elTemp.className     = 'temp-grande ' + info.clase;
    elTemp.textContent   = lecHoy.temp.toFixed(1) + '°C';
    elBtn.className  = 'btn-tomar tomada';
    elBtn.innerHTML  = `<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Temperatura registrada hoy`;
    elBtn.onclick    = null;
  } else {
    elIcon.className    = 'status-indicator none';
    elIcon.textContent  = '🌡️';
    elTitulo.textContent = 'Sin lectura hoy';
    elDesc.textContent   = 'Aún no has registrado tu temperatura hoy.';
    elTemp.className     = 'temp-grande none';
    elTemp.textContent   = '--.-°';
    elBtn.className  = 'btn-tomar';
    elBtn.innerHTML  = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M9 22h6"/>
      </svg>
      Tomar temperatura ahora`;
    elBtn.onclick = abrirModal;
  }
}

/* ── Historial ── */
function renderHistorial() {
  const mis = LECTURAS
    .filter(l => l.usuario === currentUser.username)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  const el = document.getElementById('pac-historial');
  if (!el) return;

  if (!mis.length) {
    el.innerHTML = '<div class="empty-state">No hay lecturas registradas aún</div>';
    return;
  }

  el.innerHTML = mis.map(l => {
    const info = getEstadoInfo(l.estado);
    return `
    <div class="historial-item">
      <div class="dot ${info.clase}"></div>
      <div class="h-fecha">${formatFecha(l.fecha)} — ${l.hora}</div>
      <div class="h-temp" style="color:${info.color}">${l.temp.toFixed(1)}°C</div>
      <span class="badge-estado ${info.clase}">${info.label}</span>
    </div>`;
  }).join('');
}

/* ── Modal ── */
function abrirModal() {
  lecturaTemp = null;
  const esc = document.getElementById('modal-escaneando');
  const res = document.getElementById('modal-resultado');
  const ov  = document.getElementById('modal-toma');
  if (!ov) return;
  if (esc) esc.style.display = 'block';
  if (res) res.style.display = 'none';
  ov.classList.add('open');

  /* Simulación — reemplazar por fetch real al ESP32 */
  setTimeout(() => {
    const temp = +(35.5 + Math.random() * 4).toFixed(1);
    mostrarResultadoModal(temp);
  }, 2800);
}

function mostrarResultadoModal(temp) {
  lecturaTemp      = temp;
  const estado     = clasificarTemp(temp);
  const info       = getEstadoInfo(estado);
  const esc        = document.getElementById('modal-escaneando');
  const res        = document.getElementById('modal-resultado');
  if (esc) esc.style.display = 'none';
  if (res) res.style.display = 'block';

  const val = document.getElementById('modal-temp-val');
  if (val) { val.textContent = temp.toFixed(1) + '°C'; val.style.color = info.color; }

  const badge   = document.getElementById('modal-badge-estado');
  const consejo = document.getElementById('modal-consejo');
  if (badge)   badge.innerHTML    = `<span class="badge-estado ${info.clase}">${info.label}</span>`;
  if (consejo) { consejo.textContent = info.consejo; consejo.style.color = info.color; }
}

function confirmarLectura() {
  if (!lecturaTemp) return;
  const temp   = lecturaTemp;
  const estado = clasificarTemp(temp);

  LECTURAS.unshift({
    id:       Date.now(),
    paciente: currentUser.nombre,
    usuario:  currentUser.username,
    temp, estado,
    fecha: hoyISO(),
    hora:  horaActual()
  });

  cerrarModal();
  renderEstadoHoy();
  renderHistorial();
  showToast(temp.toFixed(1) + '°C — ' + getEstadoInfo(estado).label, getEstadoInfo(estado).clase);
}

function cerrarModal() {
  const ov = document.getElementById('modal-toma');
  if (ov) ov.classList.remove('open');
  lecturaTemp = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('modal-toma');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarModal(); });
});