'use strict';

/* =========================================================
   PORTAL PÚBLICO DE CONSULTA
   Permite al cliente ver el estado de su vehículo con ficha
   y placa. Lee primero el localStorage del taller y, si la
   ficha no existe, usa el resumen codificado en el hash.
   ========================================================= */

const Consulta = (() => {
  const CLAVE_INTENTOS = 'taller_consulta_intentos';
  const MAX_INTENTOS = 5;
  const BLOQUEO_MS = 60 * 1000;

  const estado = {
    iniciado: false,
    orden: null,
    origen: 'local',
    fotos: [],
    historial: [],
    historialVisibles: 10,
    kmActual: 0,
    bloqueadoHasta: 0,
    temporizador: null
  };

  const elementos = {};
  let respaldoIntentos = { fallos: 0, bloqueadoHasta: 0 };

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;

    elementos.form = document.getElementById('form-consulta');
    elementos.ficha = document.getElementById('consulta-ficha');
    elementos.placa = document.getElementById('consulta-placa');
    elementos.error = document.getElementById('consulta-error');
    elementos.ayuda = document.getElementById('consulta-ayuda');
    elementos.resultado = document.getElementById('consulta-resultado');
    elementos.btnConsultar = document.getElementById('btn-consultar');

    cargarConfiguracion();
    precargarFicha();
    conectarEventos();
    actualizarEstadoIntentos();
  }

  /** Vuelca los datos del taller en la cabecera y el pie. */
  function cargarConfiguracion() {
    document.title = `Consulta de estado · ${CONFIG.nombreTaller}`;

    const nombre = document.getElementById('portal-nombre-taller');
    if (nombre) nombre.textContent = CONFIG.nombreTaller;

    const direccion = document.getElementById('portal-direccion');
    if (direccion) direccion.textContent = `${CONFIG.direccion} · ${CONFIG.ciudad}`;

    const horario = document.getElementById('portal-horario');
    if (horario) horario.textContent = CONFIG.horario;

    const enlaceWhatsApp = `https://wa.me/${CONFIG.telefonoWhatsApp}?text=${encodeURIComponent('Hola, quisiera consultar por el estado de mi vehículo.')}`;

    const telefono = document.getElementById('portal-telefono');
    if (telefono) {
      telefono.href = enlaceWhatsApp;
      telefono.title = `WhatsApp ${CONFIG.telefonoVisible}`;
      /* El nombre accesible debe incluir el texto visible del enlace. */
      telefono.setAttribute('aria-label', `Contactar al taller por WhatsApp ${CONFIG.telefonoVisible}`);
    }

    const telefonoTexto = document.getElementById('portal-telefono-texto');
    if (telefonoTexto) telefonoTexto.textContent = CONFIG.telefonoVisible;

    const whatsappPie = document.getElementById('portal-whatsapp-pie');
    if (whatsappPie) whatsappPie.href = enlaceWhatsApp;
  }

  /** Si el link trae ?ficha=OT-0001, se completa el primer campo. */
  function precargarFicha() {
    const parametros = new URLSearchParams(window.location.search);
    let ficha = normalizarFicha(parametros.get('ficha') || '');

    if (!ficha) {
      const resumen = leerResumenHash();
      if (resumen) ficha = normalizarFicha(resumen.ficha);
    }

    if (ficha && elementos.ficha) {
      elementos.ficha.value = ficha;
      setTimeout(() => elementos.placa?.focus(), 200);
    }
  }

  function conectarEventos() {
    elementos.form?.addEventListener('submit', manejarEnvio);

    elementos.resultado?.addEventListener('click', (evento) => {
      const foto = evento.target.closest('[data-foto-indice]');
      if (foto) {
        const indice = Number(foto.dataset.fotoIndice) || 0;
        Lightbox.abrir(estado.fotos, indice);
        return;
      }
      if (evento.target.closest('#btn-nueva-consulta')) {
        nuevaConsulta();
      }
      if (evento.target.closest('#btn-mas-historial')) {
        estado.historialVisibles += 10;
        actualizarHistorialPortal();
      }
    });
  }

  /* ---------------------------------------------------------
     Normalización de datos
     --------------------------------------------------------- */
  function normalizarFicha(valor) {
    const texto = String(valor || '').toUpperCase().replace(/\s+/g, '').trim();
    if (!texto) return '';
    if (/^OT-?\d+$/.test(texto)) {
      return `OT-${texto.replace(/\D/g, '').padStart(4, '0')}`;
    }
    if (/^\d{1,4}$/.test(texto)) {
      return `OT-${texto.padStart(4, '0')}`;
    }
    return texto;
  }

  /** Lee y decodifica el resumen que viaja en el hash del link. */
  function leerResumenHash() {
    const hash = String(window.location.hash || '').replace(/^#/, '');
    if (!hash) return null;
    const parametros = new URLSearchParams(hash);
    const codigo = parametros.get('d');
    if (!codigo) return null;

    try {
      const datos = JSON.parse(decodificarBase64Url(codigo));
      if (!datos || typeof datos !== 'object' || !datos.ficha) return null;
      return datos;
    } catch (error) {
      return null;
    }
  }

  /* ---------------------------------------------------------
     Intentos fallidos y bloqueo temporal
     --------------------------------------------------------- */
  function leerIntentos() {
    try {
      const crudo = window.localStorage.getItem(CLAVE_INTENTOS);
      if (!crudo) return { ...respaldoIntentos };
      const datos = JSON.parse(crudo);
      return {
        fallos: Number(datos.fallos) || 0,
        bloqueadoHasta: Number(datos.bloqueadoHasta) || 0
      };
    } catch (error) {
      return { ...respaldoIntentos };
    }
  }

  function guardarIntentos(datos) {
    respaldoIntentos = {
      fallos: Number(datos.fallos) || 0,
      bloqueadoHasta: Number(datos.bloqueadoHasta) || 0
    };
    try {
      window.localStorage.setItem(CLAVE_INTENTOS, JSON.stringify(respaldoIntentos));
    } catch (error) {
      /* Si el navegador bloquea el almacenamiento, el control sigue en memoria. */
    }
  }

  /** Devuelve true si el bloqueo sigue vigente; lo limpia si ya expiró. */
  function bloqueoActivo() {
    const datos = leerIntentos();
    const ahora = Date.now();

    if (datos.bloqueadoHasta && ahora < datos.bloqueadoHasta) {
      estado.bloqueadoHasta = datos.bloqueadoHasta;
      return true;
    }

    if (datos.bloqueadoHasta && ahora >= datos.bloqueadoHasta) {
      guardarIntentos({ fallos: 0, bloqueadoHasta: 0 });
    }

    estado.bloqueadoHasta = 0;
    return false;
  }

  function actualizarEstadoIntentos() {
    if (bloqueoActivo()) {
      mostrarBloqueo();
      iniciarTemporizador();
      return;
    }
    habilitarFormulario(true);
    actualizarAyuda();
  }

  function habilitarFormulario(habilitado) {
    [elementos.ficha, elementos.placa, elementos.btnConsultar].forEach((elemento) => {
      if (elemento) elemento.disabled = !habilitado;
    });
  }

  function iniciarTemporizador() {
    if (estado.temporizador) return;
    estado.temporizador = setInterval(() => {
      if (!bloqueoActivo()) {
        clearInterval(estado.temporizador);
        estado.temporizador = null;
        limpiarError();
        habilitarFormulario(true);
        actualizarAyuda();
        mostrarToast('Ya podés volver a consultar tu ficha.', 'info');
        return;
      }
      mostrarBloqueo();
    }, 1000);
  }

  function mostrarBloqueo() {
    const restante = Math.max(0, estado.bloqueadoHasta - Date.now());
    const segundos = Math.ceil(restante / 1000);
    if (elementos.error) {
      elementos.error.innerHTML = `${icono('reloj')}<span>Demasiados intentos fallidos. Por seguridad, esperá <strong>${segundos} s</strong> para volver a consultar.</span>`;
      elementos.error.classList.remove('oculto');
    }
    habilitarFormulario(false);
  }

  function registrarFallo() {
    const datos = leerIntentos();
    const fallos = datos.fallos + 1;

    if (fallos >= MAX_INTENTOS) {
      const bloqueadoHasta = Date.now() + BLOQUEO_MS;
      guardarIntentos({ fallos, bloqueadoHasta });
      estado.bloqueadoHasta = bloqueadoHasta;
      mostrarBloqueo();
      iniciarTemporizador();
      mostrarToast('Se alcanzó el máximo de intentos. Esperá un minuto para volver a consultar.', 'error', 6000);
      return;
    }

    guardarIntentos({ fallos, bloqueadoHasta: 0 });
    const restantes = MAX_INTENTOS - fallos;
    mostrarError(`No encontramos una ficha con esos datos. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`);
    mostrarToast('No encontramos una ficha con esos datos.', 'error');
    elementos.placa?.select();
  }

  function registrarExito() {
    guardarIntentos({ fallos: 0, bloqueadoHasta: 0 });
    estado.bloqueadoHasta = 0;
    if (estado.temporizador) {
      clearInterval(estado.temporizador);
      estado.temporizador = null;
    }
    limpiarError();
    actualizarAyuda();
  }

  function actualizarAyuda() {
    if (!elementos.ayuda) return;
    const datos = leerIntentos();
    const restantes = Math.max(0, MAX_INTENTOS - datos.fallos);
    if (datos.fallos > 0) {
      elementos.ayuda.textContent = `Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}. La placa no distingue mayúsculas ni espacios.`;
    } else {
      elementos.ayuda.textContent = 'La placa no distingue mayúsculas ni espacios.';
    }
  }

  /* ---------------------------------------------------------
     Validación de la consulta
     --------------------------------------------------------- */
  function manejarEnvio(evento) {
    evento.preventDefault();
    if (bloqueoActivo()) {
      mostrarBloqueo();
      return;
    }

    limpiarError();
    const ficha = normalizarFicha(elementos.ficha?.value);
    const placa = normalizarPlaca(elementos.placa?.value);

    if (!ficha || !placa) {
      mostrarError('Completá el N° de ficha y la placa del vehículo.');
      (!ficha ? elementos.ficha : elementos.placa)?.focus();
      return;
    }

    elementos.ficha.value = ficha;
    elementos.placa.value = placa;

    const encontrada = buscarOrden(ficha, placa);
    if (!encontrada) {
      registrarFallo();
      return;
    }

    registrarExito();
    renderizarResultado(encontrada.orden, encontrada.origen);
  }

  /**
   * Si la ficha existe en el localStorage del taller se valida solo
   * contra esa placa (sin usar el hash). Si no existe, se usa el
   * resumen del link como respaldo.
   */
  function buscarOrden(ficha, placa) {
    let ordenLocal = null;
    try {
      ordenLocal = Almacen.obtenerOrden(ficha);
    } catch (error) {
      ordenLocal = null;
    }

    if (ordenLocal) {
      const placaLocal = normalizarPlaca(ordenLocal.vehiculo?.placa);
      if (placaLocal && placaLocal === placa) {
        return { orden: ordenLocal, origen: 'local' };
      }
      return null;
    }

    const resumen = leerResumenHash();
    if (
      resumen
      && normalizarFicha(resumen.ficha) === ficha
      && normalizarPlaca(resumen.placa) === placa
    ) {
      return { orden: resumen, origen: 'hash' };
    }

    return null;
  }

  function mostrarError(mensaje) {
    if (!elementos.error) return;
    elementos.error.innerHTML = `${icono('alerta')}<span>${escaparHTML(mensaje)}</span>`;
    elementos.error.classList.remove('oculto');
  }

  function limpiarError() {
    if (!elementos.error) return;
    elementos.error.innerHTML = '';
    elementos.error.classList.add('oculto');
  }

  /* ---------------------------------------------------------
     Render del resultado (solo lectura)
     --------------------------------------------------------- */
  function formatearKilometraje(valor) {
    if (valor === '' || valor === null || valor === undefined) return '—';
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return '—';
    return `${numero.toLocaleString('es-BO')} km`;
  }

  function normalizarOrden(orden) {
    const cliente = typeof orden.cliente === 'string'
      ? { nombre_razon_social: orden.cliente }
      : (orden.cliente || {});
    const vehiculo = { ...(orden.vehiculo || {}) };
    /* El resumen del hash guarda la placa en el nivel superior. */
    if (!vehiculo.placa && orden.placa) vehiculo.placa = orden.placa;
    const servicios = (Array.isArray(orden.servicios) ? orden.servicios : []).map((servicio) => ({
      nombre: servicio?.nombre || 'Servicio sin nombre',
      importe: Number(servicio?.importe) || 0
    }));
    const total = Number.isFinite(Number(orden.total))
      ? Number(orden.total)
      : servicios.reduce((suma, servicio) => suma + servicio.importe, 0);

    return { cliente, vehiculo, servicios, total };
  }

  /* ---------------------------------------------------------
     Historial del vehículo en el portal
     --------------------------------------------------------- */
  function normalizarHistorialPortal(registros) {
    return (Array.isArray(registros) ? registros : [])
      .map((registro) => {
        if (!registro || typeof registro !== 'object') return null;
        const garantia = registro.garantia && typeof registro.garantia === 'object' ? registro.garantia : {};
        const proximo = registro.proximo_servicio && typeof registro.proximo_servicio === 'object'
          ? registro.proximo_servicio
          : {};
        return {
          fecha: registro.fecha || registro.fecha_entrega || registro.fecha_ingreso || '',
          kilometraje: Number(registro.kilometraje) || 0,
          servicios: (Array.isArray(registro.servicios) ? registro.servicios : [])
            .map((servicio) => ({
              nombre: servicio?.nombre || '',
              importe: Number(servicio?.importe) || 0
            }))
            .filter((servicio) => servicio.nombre),
          total: Number(registro.total) || 0,
          garantia: {
            dias: Number(garantia.dias) || 0,
            km: Number(garantia.km) || 0,
            vence: garantia.vence || ''
          },
          proximo_servicio: {
            fecha: proximo.fecha || '',
            km: Number(proximo.km) || 0,
            descripcion: proximo.descripcion || ''
          }
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  function vehiculoDelHistorial(orden, origen) {
    if (origen === 'hash') return null;
    if (orden.id_vehiculo && Almacen.obtenerVehiculo(orden.id_vehiculo)) {
      return Almacen.obtenerVehiculo(orden.id_vehiculo);
    }
    return Almacen.obtenerVehiculoPorPlaca(orden.vehiculo?.placa || orden.placa || '');
  }

  function historialDelVehiculo(orden, origen) {
    if (origen === 'hash') return normalizarHistorialPortal(orden.historial);
    const vehiculo = vehiculoDelHistorial(orden, origen);
    return normalizarHistorialPortal(vehiculo ? Almacen.obtenerHistorialVehiculo(vehiculo.id) : []);
  }

  function estadoMantenimientoPortal(historial, kmActual) {
    const hoy = inicioDelDia(new Date());
    const limite = sumarDias(hoy, 30);
    const registroConProximo = historial.find((registro) => (
      registro.proximo_servicio
      && (registro.proximo_servicio.fecha || Number(registro.proximo_servicio.km) > 0)
    ));

    let proximo = null;
    if (registroConProximo) {
      const datos = registroConProximo.proximo_servicio;
      const fecha = parsearFechaHora(datos.fecha);
      const km = Number(datos.km) || 0;
      const vencidoFecha = Boolean(fecha) && inicioDelDia(fecha) < hoy;
      const vencidoKm = km > 0 && kmActual > 0 && kmActual >= km;
      const cercaFecha = Boolean(fecha) && !vencidoFecha && inicioDelDia(fecha) <= limite;
      const cercaKm = km > 0 && kmActual > 0 && !vencidoKm && (km - kmActual) <= 500;
      const clase = vencidoFecha || vencidoKm
        ? 'vencido'
        : cercaFecha || cercaKm
          ? 'proximo'
          : 'al-dia';
      const etiqueta = clase === 'vencido' ? 'Vencido' : clase === 'proximo' ? 'Próximo' : 'Al día';
      const detalle = [
        datos.descripcion || 'Mantenimiento programado',
        datos.fecha ? formatearFecha(datos.fecha) : '',
        km > 0 ? `a los ${km.toLocaleString('es-BO')} km` : ''
      ].filter(Boolean).join(' · ');
      proximo = { clase, etiqueta, detalle };
    }

    const garantias = historial.filter((registro) => {
      const vence = parsearFechaHora(registro.garantia?.vence);
      return Boolean(vence) && inicioDelDia(vence) >= hoy;
    });

    return { proximo, garantias };
  }

  function garantiasPortalHTML(garantias) {
    if (!garantias.length) return '<p class="portal-historial-sin-garantias">Sin garantías vigentes.</p>';
    return `
      <ul class="portal-historial-garantias-lista">
        ${garantias.map((registro) => {
          const garantia = registro.garantia;
          const cobertura = [
            garantia.dias > 0 ? `${garantia.dias} días` : '',
            garantia.km > 0 ? `${garantia.km.toLocaleString('es-BO')} km` : ''
          ].filter(Boolean).join(' · ');
          return `
            <li>
              <strong>Vigente hasta ${escaparHTML(formatearFecha(garantia.vence))}</strong>
              <span>Visita del ${escaparHTML(formatearFecha(registro.fecha))}${cobertura ? ` · ${escaparHTML(cobertura)}` : ''}</span>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function historialPortalHTML(historial, visibles, kmActual) {
    if (!historial.length) {
      return `
        <p class="portal-historial-vacio">
          Todavía no hay visitas registradas para este vehículo. Cuando el taller entregue un trabajo, aparecerá acá.
        </p>
      `;
    }

    const { proximo, garantias } = estadoMantenimientoPortal(historial, kmActual);
    const mostrados = historial.slice(0, visibles);
    const restantes = Math.max(0, historial.length - mostrados.length);

    return `
      <div class="portal-historial-resumen">
        <div class="portal-historial-mantenimiento portal-historial-mantenimiento-${proximo ? proximo.clase : 'sin-datos'}">
          <span class="portal-historial-mini-etiqueta">Próximo mantenimiento</span>
          <strong>${escaparHTML(proximo ? proximo.detalle : 'Sin próximo servicio programado')}</strong>
          ${proximo ? `<span class="portal-historial-chip portal-historial-chip-${proximo.clase}">${escaparHTML(proximo.etiqueta)}</span>` : ''}
        </div>
        <div class="portal-historial-garantias">
          <span class="portal-historial-mini-etiqueta">Garantías vigentes</span>
          ${garantiasPortalHTML(garantias)}
        </div>
      </div>

      <ol class="portal-historial-lista">
        ${mostrados.map((registro) => `
          <li class="portal-historial-item">
            <div class="portal-historial-item-fecha">
              <strong>${escaparHTML(formatearFecha(registro.fecha))}</strong>
              <span>${registro.kilometraje ? escaparHTML(formatearKilometraje(registro.kilometraje)) : 'Sin km'}</span>
            </div>
            <div class="portal-historial-item-cuerpo">
              <div class="portal-historial-item-cabecera">
                <span>${registro.servicios.length} ${registro.servicios.length === 1 ? 'servicio' : 'servicios'}</span>
                <strong>${formatearMoneda(registro.total)}</strong>
              </div>
              <ul class="portal-historial-servicios">
                ${registro.servicios.length
                  ? registro.servicios.map((servicio) => `<li>${escaparHTML(servicio.nombre)}</li>`).join('')
                  : '<li>Sin servicios registrados</li>'}
              </ul>
              ${registro.garantia.vence
                ? `<p class="portal-historial-item-garantia">Garantía hasta ${escaparHTML(formatearFecha(registro.garantia.vence))}</p>`
                : ''}
            </div>
          </li>
        `).join('')}
      </ol>

      ${restantes ? `
        <button type="button" class="btn btn-secundario portal-historial-mas" id="btn-mas-historial">
          Ver ${Math.min(10, restantes)} ${Math.min(10, restantes) === 1 ? 'visita más' : 'visitas más'}
        </button>
      ` : ''}
    `;
  }

  function actualizarHistorialPortal() {
    const contenedor = document.getElementById('portal-historial-contenido');
    if (!contenedor) return;
    contenedor.innerHTML = historialPortalHTML(estado.historial, estado.historialVisibles, estado.kmActual);
  }

  function renderizarResultado(orden, origen) {
    if (!elementos.resultado) return;

    const ficha = orden.numero_ficha || orden.ficha || '';
    const datos = normalizarOrden(orden);
    const { cliente, vehiculo, servicios, total } = datos;
    const estadoOrden = orden.estado || 'recibido';
    const registroVehiculo = vehiculoDelHistorial(orden, origen);
    const historial = historialDelVehiculo(orden, origen);
    const kmActual = Number(registroVehiculo?.kilometraje_actual ?? vehiculo.kilometraje) || 0;

    const fotos = origen === 'local' && Array.isArray(orden.fotos)
      ? orden.fotos
        .filter((foto) => foto && foto.data)
        .map((foto) => ({ data: foto.data, descripcion: foto.descripcion || 'Foto de recepción' }))
      : [];

    const entrega = origen === 'local'
      ? buscarEntregaEstimada(ficha)
      : (orden.entrega_estimada || '');

    const fechaIngreso = orden.fecha
      ? formatearFechaLarga(`${orden.fecha}T${orden.hora || '00:00'}`)
      : '—';

    const actualizado = orden.actualizado_en
      || (orden.fecha ? `${orden.fecha}T${orden.hora || '00:00'}` : '');

    const nombreVehiculo = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin datos';
    const mensajeWhatsApp = `Hola, consulto por la orden ${ficha} (placa ${vehiculo.placa || '—'}).`;
    const enlaceWhatsApp = `https://wa.me/${CONFIG.telefonoWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

    const filasServicios = servicios.map((servicio) => `
      <tr>
        <td>${escaparHTML(servicio.nombre)}</td>
        <td class="portal-der">${formatearMoneda(servicio.importe)}</td>
      </tr>
    `).join('');

    const galeria = fotos.length ? `
      <section class="tarjeta portal-bloque" aria-labelledby="portal-titulo-fotos">
        <h3 id="portal-titulo-fotos">${icono('camara')} Fotos de recepción</h3>
        <p class="portal-bloque-ayuda">Tocá una foto para verla ampliada.</p>
        <div class="portal-galeria">
          ${fotos.map((foto, indice) => `
            <button type="button" class="portal-foto" data-foto-indice="${indice}"
              aria-label="Ampliar foto ${indice + 1}: ${escaparHTML(foto.descripcion)}">
              <img src="${foto.data}" alt="${escaparHTML(foto.descripcion)}" loading="lazy">
            </button>
          `).join('')}
        </div>
      </section>
    ` : '';

    elementos.resultado.innerHTML = `
      ${origen === 'hash' ? `
        <div class="portal-aviso">
          ${icono('info')}
          <span>Estás viendo el resumen que compartió el taller. Las fotos y los datos en vivo solo están disponibles en el navegador del taller.</span>
        </div>
      ` : ''}

      <article class="portal-ficha">
        <header class="portal-ficha-cabecera">
          <div class="portal-ficha-identidad">
            <span class="portal-etiqueta">Ficha de trabajo</span>
            <h2 id="resultado-ficha" tabindex="-1">${escaparHTML(ficha)}</h2>
            <p class="portal-ficha-cliente">${escaparHTML(cliente.nombre_razon_social || 'Cliente')}</p>
          </div>
          <div class="portal-ficha-estado">
            ${estadoBadge(estadoOrden)}
            <span class="portal-actualizado">
              ${actualizado ? `Actualizado el ${formatearFechaLarga(actualizado)}` : 'Información del taller'}
            </span>
          </div>
        </header>

        <section class="tarjeta portal-bloque" aria-labelledby="portal-titulo-estado">
          <h3 id="portal-titulo-estado">${icono('llave')} Estado del trabajo</h3>
          <div class="portal-stepper">${renderStepper(estadoOrden)}</div>
          <div class="portal-fechas">
            <p>
              <span>Ingreso al taller</span>
              <strong>${escaparHTML(fechaIngreso)}</strong>
            </p>
            <p>
              <span>Entrega estimada</span>
              <strong>${entrega ? escaparHTML(formatearFechaLarga(entrega)) : 'A coordinar con el taller'}</strong>
            </p>
          </div>
        </section>

        <section class="tarjeta portal-bloque" aria-labelledby="portal-titulo-vehiculo">
          <h3 id="portal-titulo-vehiculo">${icono('auto')} Tu vehículo</h3>
          <div class="portal-datos">
            <p>
              <span>Marca y modelo</span>
              <strong>${escaparHTML(nombreVehiculo)}</strong>
            </p>
            <p>
              <span>Placa</span>
              <strong class="portal-placa">${escaparHTML(vehiculo.placa || '—')}</strong>
            </p>
            <p>
              <span>Año</span>
              <strong>${escaparHTML(vehiculo.anio || '—')}</strong>
            </p>
            <p>
              <span>Tipo</span>
              <strong>${escaparHTML(vehiculo.tipo || '—')}</strong>
            </p>
            <p>
              <span>Color</span>
              <strong>${escaparHTML(vehiculo.color || '—')}</strong>
            </p>
            <p>
              <span>Kilometraje</span>
              <strong>${escaparHTML(formatearKilometraje(vehiculo.kilometraje))}</strong>
            </p>
          </div>
        </section>

        <section class="tarjeta portal-bloque" aria-labelledby="portal-titulo-servicios">
          <h3 id="portal-titulo-servicios">${icono('ordenes')} Servicios y total</h3>
          <table class="portal-tabla">
            <thead>
              <tr>
                <th>Servicio</th>
                <th class="portal-der">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${filasServicios || '<tr><td colspan="2">Sin servicios registrados.</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td class="portal-der">${formatearMoneda(total)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="portal-datos portal-pago">
            <p>
              <span>Forma de pago</span>
              <strong>${escaparHTML(FORMAS_PAGO[orden.forma_pago] || orden.forma_pago || '—')}</strong>
            </p>
            <p>
              <span>Documento</span>
              <strong>${escaparHTML(DOCUMENTOS[orden.documento] || orden.documento || '—')}</strong>
            </p>
          </div>
        </section>

        <section class="tarjeta portal-bloque" aria-labelledby="portal-titulo-historial">
          <h3 id="portal-titulo-historial">${icono('historial')} Historial de mi vehículo</h3>
          <p class="portal-bloque-ayuda">
            ${origen === 'hash'
              ? 'Resumen de las últimas visitas compartido por el taller.'
              : 'Visitas entregadas de este vehículo, con kilometraje, servicios y total.'}
          </p>
          <div id="portal-historial-contenido">
            ${historialPortalHTML(historial, 10, kmActual)}
          </div>
        </section>

        ${galeria}

        <div class="portal-acciones">
          <a class="btn btn-whatsapp btn-grande" href="${enlaceWhatsApp}" target="_blank" rel="noopener">
            ${icono('whatsapp')} Consultar por WhatsApp
          </a>
          <button type="button" class="btn btn-secundario btn-grande" id="btn-nueva-consulta">
            Consultar otra ficha
          </button>
        </div>
        <p class="portal-nota-demo">
          ${origen === 'hash'
            ? 'Resumen compartido por el taller.'
            : 'Datos guardados en el navegador del taller.'}
        </p>
      </article>
    `;

    estado.orden = ficha;
    estado.origen = origen;
    estado.fotos = fotos;
    estado.historial = historial;
    estado.historialVisibles = 10;
    estado.kmActual = kmActual;

    elementos.resultado.classList.remove('oculto');
    setTimeout(() => {
      const titulo = document.getElementById('resultado-ficha');
      elementos.resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (titulo) titulo.focus({ preventScroll: true });
    }, 90);
  }

  function nuevaConsulta() {
    estado.orden = null;
    estado.fotos = [];
    estado.historial = [];
    estado.historialVisibles = 10;
    estado.kmActual = 0;
    if (elementos.resultado) {
      elementos.resultado.innerHTML = '';
      elementos.resultado.classList.add('oculto');
    }
    if (elementos.ficha) elementos.ficha.value = '';
    if (elementos.placa) elementos.placa.value = '';
    limpiarError();
    actualizarEstadoIntentos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => elementos.ficha?.focus(), 250);
  }

  return {
    iniciar,
    buscarOrden,
    normalizarFicha
  };
})();

document.addEventListener('DOMContentLoaded', () => Consulta.iniciar());
