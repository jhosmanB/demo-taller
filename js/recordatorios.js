'use strict';

/* =========================================================
   RECORDATORIOS DE MANTENIMIENTO
   Servicios vencidos y próximos, garantías por vencer y
   recomendaciones pendientes, con acciones de contacto.
   ========================================================= */

const Recordatorios = (() => {
  const estado = {
    iniciado: false,
    items: [],
    pendiente: null
  };

  const elementos = {};

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    const panel = document.getElementById('recordatorios-panel');
    if (!panel) return;
    estado.iniciado = true;

    elementos.panel = panel;
    elementos.resumen = document.getElementById('recordatorios-resumen');
    elementos.modal = document.getElementById('modal-recordatorio');
    elementos.destino = document.getElementById('recordatorio-destino');
    elementos.mensaje = document.getElementById('recordatorio-mensaje');
    elementos.btnEnviar = document.getElementById('btn-enviar-recordatorio');

    elementos.panel.addEventListener('click', manejarClicPanel);
    elementos.btnEnviar?.addEventListener('click', enviarRecordatorio);
    window.addEventListener('historial:actualizado', () => {
      if (estado.iniciado) recargar();
    });
  }

  /* ---------------------------------------------------------
     Datos
     --------------------------------------------------------- */
  function nombreCliente(item) {
    return item.cliente?.nombre_razon_social || 'Cliente sin datos';
  }

  function nombreVehiculo(item) {
    const nombre = [item.vehiculo?.marca, item.vehiculo?.modelo].filter(Boolean).join(' ');
    return nombre || 'Vehículo sin datos';
  }

  function telefonoCliente(item) {
    return window.WhatsApp ? WhatsApp.normalizarTelefono(item.cliente?.celular) : '';
  }

  function detalleServicio(item) {
    const partes = [
      item.proximo?.descripcion || 'Mantenimiento programado',
      item.proximo?.fecha ? formatearFecha(item.proximo.fecha) : '',
      Number(item.proximo?.km) > 0 ? `a los ${Number(item.proximo.km).toLocaleString('es-BO')} km` : ''
    ].filter(Boolean);
    const motivo = item.vencidoFecha
      ? 'Fecha vencida'
      : item.vencidoKm
        ? 'Kilometraje alcanzado'
        : 'Próximo a vencer';
    return { texto: partes.join(' · '), motivo };
  }

  function recolectar() {
    const vehiculos = Almacen.obtenerVehiculos();
    const clientes = Almacen.obtenerClientes();
    const historial = Almacen.obtenerHistorial();
    const contactos = Almacen.obtenerRecordatorios();
    const hoy = inicioDelDia(new Date());
    const limite = sumarDias(hoy, 30);

    const vencidos = [];
    const proximos = [];
    const garantias = [];
    const recomendaciones = [];

    const datosContacto = (clave) => contactos[clave]?.contactado_en || '';

    vehiculos.forEach((vehiculo) => {
      const registros = Historial.ordenarDesc(historial.filter((registro) => registro.id_vehiculo === vehiculo.id));
      const datos = Historial.calcularEstadoMantenimiento(vehiculo, registros);
      const cliente = clientes.find((item) => item.id === vehiculo.id_cliente) || null;
      const proximo = datos.proximo;

      if (proximo && (proximo.fecha || Number(proximo.km) > 0)) {
        const fecha = proximo.fecha ? parsearFechaHora(proximo.fecha) : null;
        const km = Number(proximo.km) || 0;
        const vencidoFecha = Boolean(fecha) && inicioDelDia(fecha) < hoy;
        const vencidoKm = km > 0 && datos.kmActual >= km;
        const cercaFecha = Boolean(fecha) && !vencidoFecha && inicioDelDia(fecha) <= limite;
        const cercaKm = km > 0 && !vencidoKm && (km - datos.kmActual) <= 500;
        if (vencidoFecha || vencidoKm || cercaFecha || cercaKm) {
          const clave = `servicio:${vehiculo.id}`;
          const item = {
            tipo: 'servicio',
            clave,
            vehiculo,
            cliente,
            proximo,
            fecha,
            km,
            kmActual: datos.kmActual,
            vencidoFecha,
            vencidoKm,
            contacto: datosContacto(clave)
          };
          if (vencidoFecha || vencidoKm) vencidos.push(item);
          else proximos.push(item);
        }
      }

      datos.garantias.forEach((garantia) => {
        const vence = parsearFechaHora(garantia.vence);
        if (!vence) return;
        if (inicioDelDia(vence) < hoy || inicioDelDia(vence) > limite) return;
        const clave = `garantia:${vehiculo.id}:${garantia.vence}`;
        garantias.push({
          tipo: 'garantia',
          clave,
          vehiculo,
          cliente,
          garantia,
          contacto: datosContacto(clave)
        });
      });

      datos.recomendaciones.forEach((recomendacion) => {
        const clave = `recomendacion:${recomendacion.id_historial}:${recomendacion.indice}`;
        recomendaciones.push({
          tipo: 'recomendacion',
          clave,
          vehiculo,
          cliente,
          recomendacion,
          contacto: datosContacto(clave)
        });
      });
    });

    return { vencidos, proximos, garantias, recomendaciones };
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  function botonesContacto(item) {
    const contactado = item.contacto
      ? `<span class="recordatorio-contactado">Contactado ${formatearFecha(item.contacto)}</span>`
      : '';
    return `
      <div class="recordatorio-acciones">
        ${contactado}
        <button type="button" class="btn btn-secundario btn-sm" data-accion="recordar-whatsapp" data-clave="${escaparHTML(item.clave)}">WhatsApp</button>
        <button type="button" class="btn btn-secundario btn-sm" data-accion="recordar-agenda" data-clave="${escaparHTML(item.clave)}">Agendar cita</button>
        <button type="button" class="btn btn-secundario btn-sm" data-accion="recordar-contactado" data-clave="${escaparHTML(item.clave)}">
          ${item.contacto ? 'Actualizar contacto' : 'Marcar contactado'}
        </button>
      </div>
    `;
  }

  function filaServicio(item) {
    const detalle = detalleServicio(item);
    return `
      <li class="recordatorio-item">
        <div class="recordatorio-item-cabecera">
          <div>
            <strong>${escaparHTML(nombreVehiculo(item))} · ${escaparHTML(item.vehiculo?.placa || '—')}</strong>
            <span>${escaparHTML(nombreCliente(item))}</span>
          </div>
          <span class="badge badge-recordatorio">${escaparHTML(detalle.motivo)}</span>
        </div>
        <p class="recordatorio-detalle">${escaparHTML(detalle.texto)}</p>
        <p class="recordatorio-kilometraje">Kilometraje actual: ${Number(item.kmActual || 0).toLocaleString('es-BO')} km</p>
        ${botonesContacto(item)}
      </li>
    `;
  }

  function filaGarantia(item) {
    return `
      <li class="recordatorio-item">
        <div class="recordatorio-item-cabecera">
          <div>
            <strong>${escaparHTML(nombreVehiculo(item))} · ${escaparHTML(item.vehiculo?.placa || '—')}</strong>
            <span>${escaparHTML(nombreCliente(item))}</span>
          </div>
          <span class="badge badge-garantia badge-garantia-por-vencer">Por vencer</span>
        </div>
        <p class="recordatorio-detalle">Garantía de la orden ${escaparHTML(item.garantia?.id_orden || '—')} vence el ${formatearFecha(item.garantia?.vence)}.</p>
        ${botonesContacto(item)}
      </li>
    `;
  }

  function filaRecomendacion(item) {
    return `
      <li class="recordatorio-item">
        <div class="recordatorio-item-cabecera">
          <div>
            <strong>${escaparHTML(nombreVehiculo(item))} · ${escaparHTML(item.vehiculo?.placa || '—')}</strong>
            <span>${escaparHTML(nombreCliente(item))}</span>
          </div>
          <span class="badge badge-urgencia badge-urgencia-${escaparHTML(item.recomendacion?.urgencia || 'media')}">${escaparHTML(URGENCIAS_RECOMENDACION[item.recomendacion?.urgencia] || 'Media')}</span>
        </div>
        <p class="recordatorio-detalle">${escaparHTML(item.recomendacion?.descripcion || 'Recomendación pendiente')}</p>
        <p class="recordatorio-kilometraje">Visita del ${formatearFecha(item.recomendacion?.fecha)} · Orden ${escaparHTML(item.recomendacion?.id_orden || '—')}</p>
        ${botonesContacto(item)}
      </li>
    `;
  }

  function bloque(titulo, descripcion, items, clase, renderFila, vacio) {
    return `
      <section class="tarjeta recordatorio-bloque ${clase}">
        <div class="recordatorio-bloque-cabecera">
          <div>
            <h3>${escaparHTML(titulo)}</h3>
            <p>${escaparHTML(descripcion)}</p>
          </div>
          <span class="recordatorio-contador">${items.length}</span>
        </div>
        ${items.length
          ? `<ul class="recordatorio-lista">${items.map(renderFila).join('')}</ul>`
          : `<p class="recordatorio-vacio">${escaparHTML(vacio)}</p>`}
      </section>
    `;
  }

  function renderizar() {
    if (!elementos.panel) return;
    const datos = recolectar();
    estado.items = [...datos.vencidos, ...datos.proximos, ...datos.garantias, ...datos.recomendaciones];

    const total = datos.vencidos.length + datos.proximos.length;
    if (elementos.resumen) {
      elementos.resumen.innerHTML = total
        ? `<strong>${total}</strong> ${total === 1 ? 'servicio requiere' : 'servicios requieren'} atención`
        : 'Sin servicios pendientes';
    }

    elementos.panel.innerHTML = `
      ${bloque('Vencidos', 'Próximo servicio pasado por fecha o kilometraje.', datos.vencidos, 'recordatorio-bloque-vencido', filaServicio, 'No hay servicios vencidos.')}
      ${bloque('Próximos 30 días', 'Servicios que vencen por fecha o faltan 500 km o menos.', datos.proximos, 'recordatorio-bloque-proximo', filaServicio, 'No hay servicios próximos a vencer.')}
      <div class="recordatorio-columnas">
        ${bloque('Garantías por vencer', 'Trabajos con garantía que vence en los próximos 30 días.', datos.garantias, 'recordatorio-bloque-garantia', filaGarantia, 'No hay garantías por vencer.')}
        ${bloque('Recomendaciones pendientes', 'Tareas sugeridas en visitas anteriores sin atender.', datos.recomendaciones, 'recordatorio-bloque-recomendacion', filaRecomendacion, 'No hay recomendaciones pendientes.')}
      </div>
    `;

    if (window.actualizarContadoresApp) window.actualizarContadoresApp();
  }

  /* ---------------------------------------------------------
     Acciones
     --------------------------------------------------------- */
  function buscarItem(clave) {
    return estado.items.find((item) => item.clave === clave) || null;
  }

  function mensajePara(item) {
    const saludo = `Hola ${String(nombreCliente(item)).trim().split(/\s+/)[0] || 'cliente'}, te saludamos de ${CONFIG.nombreTaller}.`;
    const vehiculo = `${nombreVehiculo(item)} (placa ${item.vehiculo?.placa || '—'})`;

    if (item.tipo === 'servicio') {
      const detalle = detalleServicio(item);
      return `${saludo} Tu ${vehiculo} tiene programado su próximo servicio: ${detalle.texto}. ¿Deseas agendar una cita?`;
    }
    if (item.tipo === 'garantia') {
      return `${saludo} La garantía del trabajo realizado en tu ${vehiculo} vence el ${formatearFecha(item.garantia?.vence)}. Si detectás algún inconveniente, coordinemos una revisión antes del vencimiento.`;
    }
    return `${saludo} En tu última visita a nuestro taller recomendamos: "${item.recomendacion?.descripcion || 'una revisión preventiva'}". ¿Deseas agendar una cita para revisarlo?`;
  }

  function abrirWhatsApp(item) {
    const telefono = telefonoCliente(item);
    if (!telefono) {
      mostrarToast('El cliente no tiene un celular registrado.', 'aviso');
      return;
    }
    estado.pendiente = { telefono, item };
    if (elementos.destino) {
      elementos.destino.textContent = `${nombreCliente(item)} · ${nombreVehiculo(item)} ${item.vehiculo?.placa || ''}`.trim();
    }
    if (elementos.mensaje) elementos.mensaje.value = mensajePara(item);
    Modal.abrir('modal-recordatorio');
  }

  function enviarRecordatorio() {
    if (!estado.pendiente) return;
    const mensaje = String(elementos.mensaje?.value || '').trim();
    if (!mensaje) {
      mostrarToast('Escribí un mensaje antes de enviarlo.', 'aviso');
      return;
    }
    const url = `https://wa.me/${estado.pendiente.telefono}?text=${encodeURIComponent(mensaje)}`;
    try {
      window.open(url, '_blank', 'noopener');
      Modal.cerrar('modal-recordatorio');
      mostrarToast('Se abrió WhatsApp con el recordatorio.', 'exito');
    } catch (error) {
      mostrarToast('No se pudo abrir WhatsApp.', 'error');
    }
  }

  function agendar(item) {
    if (!window.Agenda || typeof Agenda.agendarCita !== 'function') {
      mostrarToast('La agenda no está disponible.', 'error');
      return;
    }
    if (window.mostrarVista) window.mostrarVista('agenda');
    const detalle = item.tipo === 'servicio'
      ? detalleServicio(item).texto
      : item.tipo === 'garantia'
        ? `Revisión de garantía (vence ${formatearFecha(item.garantia?.vence)})`
        : `Revisión: ${item.recomendacion?.descripcion || 'recomendación pendiente'}`;
    Agenda.agendarCita({
      cliente: nombreCliente(item),
      placa: item.vehiculo?.placa || '',
      titulo: `Recepción ${nombreVehiculo(item)} - ${nombreCliente(item)}`,
      notas: `Cita creada desde recordatorios de mantenimiento. ${detalle}`,
      tipo: 'recepcion'
    });
  }

  function marcarContactado(item) {
    const resultado = Almacen.marcarContactado(item.clave);
    if (!resultado || resultado.ok === false) {
      mostrarToast(resultado?.mensaje || 'No se pudo guardar el contacto.', 'error');
      return;
    }
    mostrarToast('Recordatorio marcado como contactado.', 'exito');
    recargar();
  }

  function manejarClicPanel(evento) {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const item = buscarItem(boton.dataset.clave);
    if (!item) return;

    if (boton.dataset.accion === 'recordar-whatsapp') abrirWhatsApp(item);
    else if (boton.dataset.accion === 'recordar-agenda') agendar(item);
    else if (boton.dataset.accion === 'recordar-contactado') marcarContactado(item);
  }

  /* ---------------------------------------------------------
     API pública
     --------------------------------------------------------- */
  function recargar() {
    if (!estado.iniciado) iniciar();
    if (estado.iniciado) renderizar();
  }

  function mostrar() {
    if (!estado.iniciado) iniciar();
    if (estado.iniciado) renderizar();
  }

  function contar() {
    if (!estado.iniciado) {
      const datos = recolectar();
      return datos.vencidos.length + datos.proximos.length;
    }
    return estado.items.filter((item) => item.tipo === 'servicio').length;
  }

  return {
    iniciar,
    recargar,
    mostrar,
    contar
  };
})();

window.Recordatorios = Recordatorios;
