let lecturaTemp = null;
let medidas = [];

document.addEventListener('DOMContentLoaded', async () => {
  const sesion = sessionStorage.getItem('currentUser');
  if (!sesion) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(sesion);

  const screen = document.getElementById('screen-paciente');
  if (screen) screen.classList.add('active');

  await cargarMedidas(); // IMPORTANTE
  initPaciente();
});

/* ───────────── UTILS ───────────── */

function obtenerIniciales(nombreCompleto) {
  if (!nombreCompleto) return "--";

  const partes = nombreCompleto.trim().split(" ");
  if (partes.length === 1) return partes[0][0].toUpperCase();

  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/* ───────────── INIT ───────────── */

function initPaciente() {
  document.getElementById('pac-avatar').textContent = obtenerIniciales(currentUser.nombre_completo);
  document.getElementById('pac-nombre').textContent = currentUser.nombre;

  document.getElementById('pac-fecha-hoy').textContent =
    new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  renderEstadoHoy();
  renderHistorial();
}

/* ───────────── BACKEND ───────────── */

async function cargarMedidas() {
  try {
    const res = await fetch(`http://localhost:3000/medidas/${currentUser.id_usuario}`);
    const data = await res.json();

    if (!data.success) {
      showToast("Error cargando historial", "error");
      return;
    }

    medidas = data.data.map(m => {
      const fechaObj = new Date(m.fecha);

      return {
        temp: parseFloat(m.temperatura),
        fecha: fechaObj.toISOString().split("T")[0],
        hora: fechaObj.toTimeString().slice(0, 5),
        estado: clasificarTemp(parseFloat(m.temperatura))
      };
    });

  } catch (error) {
    console.error(error);
    showToast("Error de conexión", "error");
  }
}

/* ───────────── ESTADO HOY ───────────── */

function renderEstadoHoy() {
  const hoy = hoyISO();

  const lecturasHoy = medidas
    .filter(m => m.fecha === hoy)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const ultima = lecturasHoy[0];

  const btn = document.getElementById('btn-tomar');
  const icon = document.getElementById('status-icon');
  const titulo = document.getElementById('status-titulo');
  const desc = document.getElementById('status-desc');
  const temp = document.getElementById('status-temp');

  if (lecturasHoy.length >= 3) {
    btn.innerHTML = "Máximo de mediciones alcanzado";
    btn.className = "btn-tomar tomada";
    btn.onclick = null;
    btn.disabled = true;
    return;
  }

  if (ultima) {
    const info = getEstadoInfo(ultima.estado);

    icon.className = 'status-indicator ' + info.clase;
    icon.textContent = ultima.estado === 'normal' ? '✓' : '⚠';

    titulo.textContent = info.label;
    desc.textContent = info.consejo;

    temp.textContent = ultima.temp.toFixed(1) + '°C';
    temp.className = 'temp-grande ' + info.clase;

    btn.className = 'btn-tomar tomada';
    btn.innerHTML = "Tomar otra medición";
    btn.onclick = abrirModal;
    btn.disabled = false;

  } else {
    btn.className = 'btn-tomar';
    btn.innerHTML = "Tomar temperatura ahora";
    btn.onclick = abrirModal;
  }
}

/* ───────────── HISTORIAL ───────────── */

function renderHistorial() {
  const el = document.getElementById('pac-historial');

  if (!medidas.length) {
    el.innerHTML = '<div class="empty-state">No hay lecturas registradas</div>';
    return;
  }

  el.innerHTML = medidas.map(m => {
    const info = getEstadoInfo(m.estado);

    return `
    <div class="historial-item">
      <div class="dot ${info.clase}"></div>
      <div class="h-fecha">${formatFecha(m.fecha)} — ${m.hora}</div>
      <div class="h-temp" style="color:${info.color}">
        ${m.temp.toFixed(1)}°C
      </div>
      <span class="badge-estado ${info.clase}">
        ${info.label}
      </span>
    </div>
    `;
  }).join('');
}

/* ───────────── MODAL ───────────── */

function abrirModal() {
  const hoy = hoyISO();
  const lecturasHoy = medidas.filter(m => m.fecha === hoy);

  if (lecturasHoy.length >= 3) {
    showToast("Máximo de 3 mediciones alcanzado", "warn");
    return;
  }

  lecturaTemp = null;

  document.getElementById('modal-toma').classList.add('open');
  document.getElementById('modal-escaneando').style.display = 'block';
  document.getElementById('modal-resultado').style.display = 'none';

  // simulación
  setTimeout(() => {
    const temp = +(35.5 + Math.random() * 4).toFixed(1);
    mostrarResultadoModal(temp);
  }, 2000);
}

function mostrarResultadoModal(temp) {
  lecturaTemp = temp;

  const estado = clasificarTemp(temp);
  const info = getEstadoInfo(estado);

  document.getElementById('modal-escaneando').style.display = 'none';
  document.getElementById('modal-resultado').style.display = 'block';

  document.getElementById('modal-temp-val').textContent = temp + "°C";
  document.getElementById('modal-temp-val').style.color = info.color;

  document.getElementById('modal-badge-estado').innerHTML =
    `<span class="badge-estado ${info.clase}">${info.label}</span>`;

  document.getElementById('modal-consejo').textContent = info.consejo;
}

/* ───────────── GUARDAR ───────────── */

async function confirmarLectura() {
  try {
    const res = await fetch("http://localhost:3000/medidas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id_usuario: currentUser.id_usuario,
        temperatura: lecturaTemp
      })
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.message, "warn");
      return;
    }

    showToast("Temperatura guardada", "ok");



    cerrarModal();

    if (lecturaTemp === null) {
      showToast("No hay lectura", "warn");
      return;
    }

    await cargarMedidas(); //  actualizar sin recargar
    renderEstadoHoy();
    renderHistorial();

  } catch (error) {
    console.error(error);
    showToast("Error servidor", "error");
  }
}

function cerrarModal() {
  document.getElementById('modal-toma').classList.remove('open');
}