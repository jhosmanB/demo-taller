'use strict';

/* =========================================================
   MÓDULO DE WHATSAPP
   Arma el link estático del portal, un resumen seguro de la
   orden y el mensaje editable para enviar al cliente.
   ========================================================= */

const WhatsApp = (() => {
  const estado = {
    iniciado: false,
    orden: null,
    enlace: '',
    mensaje: ''
  };

  const elementos = {};

  /* ---------------------------------------------------------
     Arranque y conexión de eventos
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;

    elementos.resumen = document.getElementById('whatsapp-resumen');
    elementos.link = document.getElementById('whatsapp-link');
    elementos.mensaje = document.getElementById('whatsapp-mensaje');
    elementos.btnEnviar = document.getElementById('btn-enviar-whatsapp');
    elementos.btnCopiar = document.getElementById('btn-copiar-link');

    elementos.btnEnviar?.addEventListener('click', enviar);
    elementos.btnCopiar?.addEventListener('click', copiarEnlace);
  }

  /* ---------------------------------------------------------
     Construcción del resumen y del link
     --------------------------------------------------------- */
  /**
   * Resumen que viaja en el hash del link. No incluye fotos,
   * notas internas, número de motor ni VIN.
   */
  function resumenHistorialVehiculo(orden) {
    const vehiculo = orden.vehiculo || {};
    const registroVehiculo = orden.id_vehiculo
      ? Almacen.obtenerVehiculo(orden.id_vehiculo)
      : Almacen.obtenerVehiculoPorPlaca(vehiculo.placa);
    if (!registroVehiculo) return [];

    return Almacen.obtenerHistorialVehiculo(registroVehiculo.id)
      .slice(0, 5)
      .map((registro) => {
        const garantia = registro.garantia && typeof registro.garantia === 'object' ? registro.garantia : {};
        const proximo = registro.proximo_servicio && typeof registro.proximo_servicio === 'object'
          ? registro.proximo_servicio
          : {};
        return {
          fecha: registro.fecha_entrega || registro.fecha_ingreso || '',
          kilometraje: Number(registro.kilometraje) || 0,
          servicios: (Array.isArray(registro.servicios) ? registro.servicios : []).map((servicio) => ({
            nombre: servicio?.nombre || '',
            importe: Number(servicio?.importe) || 0
          })),
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
      });
  }

  function construirResumen(orden) {
    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};

    return {
      ficha: orden.numero_ficha || '',
      placa: vehiculo.placa || '',
      cliente: cliente.nombre_razon_social || '',
      vehiculo: {
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        tipo: vehiculo.tipo || '',
        anio: vehiculo.anio ?? '',
        color: vehiculo.color || '',
        kilometraje: vehiculo.kilometraje ?? ''
      },
      servicios: (Array.isArray(orden.servicios) ? orden.servicios : []).map((servicio) => ({
        nombre: servicio.nombre || '',
        importe: Number(servicio.importe) || 0
      })),
      total: Number(orden.total) || 0,
      estado: orden.estado || 'recibido',
      fecha: orden.fecha || '',
      hora: orden.hora || '',
      forma_pago: orden.forma_pago || '',
      documento: orden.documento || '',
      actualizado_en: orden.actualizado_en || '',
      entrega_estimada: buscarEntregaEstimada(orden.numero_ficha),
      historial: resumenHistorialVehiculo(orden)
    };
  }

  /**
   * Link de consulta con la ficha visible y el resumen en el hash.
   * Se resuelve contra la URL actual para que funcione también
   * abriendo los archivos con file://.
   */
  function construirEnlace(resumen) {
    const codigo = codificarBase64Url(JSON.stringify(resumen));
    try {
      const url = new URL('consulta.html', window.location.href);
      url.searchParams.set('ficha', resumen.ficha);
      url.hash = `d=${codigo}`;
      return url.href;
    } catch (error) {
      const base = window.location.href.split(/[?#]/)[0].replace(/[^/]*$/, '');
      return `${base}consulta.html?ficha=${encodeURIComponent(resumen.ficha)}#d=${codigo}`;
    }
  }

  /* ---------------------------------------------------------
     Mensaje para el cliente
     --------------------------------------------------------- */
  function construirMensaje(orden, enlace) {
    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};
    const nombre = String(cliente.nombre_razon_social || '').trim().split(/\s+/)[0] || 'cliente';
    const descripcion = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ');
    const referencia = descripcion ? `tu ${descripcion}` : 'tu vehículo';

    return [
      `Hola ${nombre}, te saludamos de *${CONFIG.nombreTaller}*.`,
      '',
      `Podés ver el estado de ${referencia} (placa *${vehiculo.placa || '—'}*) ingresando al siguiente link con tu N° de ficha *${orden.numero_ficha}*:`,
      '',
      enlace,
      '',
      'Cualquier consulta, escribinos por este medio.'
    ].join('\n');
  }

  /**
   * Deja el celular en formato internacional boliviano sin "+".
   * Acepta 70012345, 070012345, 59170012345 o +591 700 12345.
   */
  function normalizarTelefono(valor) {
    let digitos = String(valor || '').replace(/\D/g, '');
    if (!digitos) return '';
    if (digitos.startsWith('00')) digitos = digitos.slice(2);
    if (digitos.startsWith('0') && !digitos.startsWith('591')) digitos = digitos.slice(1);
    if (digitos.startsWith('591')) return digitos;
    return `591${digitos}`;
  }

  /* ---------------------------------------------------------
     Resumen visual del modal
     --------------------------------------------------------- */
  function resumenHTML(resumen) {
    const vehiculo = resumen.vehiculo || {};
    const nombreVehiculo = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin datos';
    const detalleVehiculo = [vehiculo.anio, vehiculo.tipo, vehiculo.color].filter(Boolean).join(' · ');
    const servicios = (resumen.servicios || []).map((servicio) => `
      <li>
        <span>${escaparHTML(servicio.nombre)}</span>
        <strong>${formatearMoneda(servicio.importe)}</strong>
      </li>
    `).join('');
    const entrega = resumen.entrega_estimada
      ? formatearFechaLarga(resumen.entrega_estimada)
      : 'A coordinar con el taller';

    return `
      <div class="whatsapp-resumen-cabecera">
        <div>
          <span class="whatsapp-resumen-etiqueta">Ficha</span>
          <strong class="whatsapp-resumen-ficha">${escaparHTML(resumen.ficha)}</strong>
          <span class="whatsapp-resumen-cliente">${escaparHTML(resumen.cliente || 'Cliente sin nombre')}</span>
        </div>
        ${estadoBadge(resumen.estado)}
      </div>

      <div class="whatsapp-resumen-datos">
        <p>
          <span>Vehículo</span>
          <strong>${escaparHTML(nombreVehiculo)}</strong>
          ${detalleVehiculo ? `<small>${escaparHTML(detalleVehiculo)}</small>` : ''}
        </p>
        <p>
          <span>Placa</span>
          <strong class="whatsapp-resumen-placa">${escaparHTML(resumen.placa || '—')}</strong>
        </p>
        <p>
          <span>Entrega estimada</span>
          <strong>${escaparHTML(entrega)}</strong>
        </p>
        <p>
          <span>Total</span>
          <strong>${formatearMoneda(resumen.total)}</strong>
        </p>
      </div>

      <div class="whatsapp-resumen-servicios-contenedor">
        <span class="whatsapp-resumen-etiqueta">Servicios</span>
        <ul class="whatsapp-resumen-servicios">${servicios || '<li><span>Sin servicios registrados</span><strong>—</strong></li>'}</ul>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     API pública
     --------------------------------------------------------- */
  function abrir(orden) {
    if (!orden || !orden.numero_ficha) {
      mostrarToast('No se encontró la orden para compartir.', 'error');
      return;
    }

    iniciar();
    estado.orden = orden;

    const resumen = construirResumen(orden);
    estado.enlace = construirEnlace(resumen);
    estado.mensaje = construirMensaje(orden, estado.enlace);

    if (elementos.resumen) elementos.resumen.innerHTML = resumenHTML(resumen);
    if (elementos.link) elementos.link.value = estado.enlace;
    if (elementos.mensaje) elementos.mensaje.value = estado.mensaje;

    const telefono = normalizarTelefono(orden.cliente?.celular);
    if (elementos.btnEnviar) {
      elementos.btnEnviar.disabled = !telefono;
      elementos.btnEnviar.title = telefono
        ? `Abrir WhatsApp de ${orden.cliente?.nombre_razon_social || 'el cliente'}`
        : 'La orden no tiene un celular registrado';
    }

    Modal.abrir('modal-whatsapp');
  }

  function enviar() {
    if (!estado.orden) return;

    const telefono = normalizarTelefono(estado.orden.cliente?.celular);
    if (!telefono) {
      mostrarToast('La orden no tiene un celular registrado. Copiá el link y compartilo manualmente.', 'aviso', 5500);
      return;
    }

    const mensaje = String(elementos.mensaje?.value || '').trim() || estado.mensaje;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    try {
      const ventana = window.open(url, '_blank');
      if (ventana) {
        ventana.opener = null;
      } else {
        mostrarToast('El navegador bloqueó la ventana de WhatsApp. Habilitá las ventanas emergentes o copiá el link.', 'aviso', 6500);
      }
    } catch (error) {
      mostrarToast('No se pudo abrir WhatsApp. Copiá el link y compartilo manualmente.', 'error', 6000);
    }
  }

  async function copiarEnlace() {
    if (!estado.enlace) return;
    const copiado = await copiarTexto(estado.enlace);
    mostrarToast(
      copiado
        ? 'Link de consulta copiado al portapapeles.'
        : 'No se pudo copiar automáticamente. Seleccioná el link y copialo con Ctrl + C.',
      copiado ? 'exito' : 'error',
      copiado ? 3800 : 6500
    );
  }

  return {
    iniciar,
    abrir,
    normalizarTelefono,
    construirResumen,
    construirEnlace
  };
})();

/* Se expone en window para que el módulo de órdenes lo use. */
window.WhatsApp = WhatsApp;
