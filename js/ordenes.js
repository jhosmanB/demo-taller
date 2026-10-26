'use strict';

/* =========================================================
   MÓDULO DE ÓRDENES DE TRABAJO
   Listado con búsqueda y filtros, formulario completo,
   servicios dinámicos, estado, fotos comprimidas e impresión.
   ========================================================= */

const Ordenes = (() => {
  const MAX_FOTOS = 8;
  const LADO_MAXIMO_FOTO = 800;
  const CALIDAD_FOTO = 0.7;

  const estado = {
    iniciado: false,
    vista: 'listado',
    ordenes: [],
    filtro: { texto: '', estado: 'todos' },
    ordenActual: null,
    fotos: [],
    procesandoFotos: false
  };

  const elementos = {};

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;

    elementos.listado = document.getElementById('ordenes-listado');
    elementos.formulario = document.getElementById('ordenes-formulario');
    elementos.estadisticas = document.getElementById('ordenes-estadisticas');
    elementos.buscar = document.getElementById('buscar-ordenes');
    elementos.filtroEstado = document.getElementById('filtro-estado');
    elementos.conteo = document.getElementById('resultado-conteo');
    elementos.cuerpoOrdenes = document.getElementById('cuerpo-ordenes');
    elementos.vacio = document.getElementById('ordenes-vacio');
    elementos.tabla = document.querySelector('.tabla-ordenes');

    elementos.form = document.getElementById('form-orden');
    elementos.original = document.getElementById('orden-original');
    elementos.ficha = document.getElementById('orden-ficha');
    elementos.fecha = document.getElementById('orden-fecha');
    elementos.hora = document.getElementById('orden-hora');
    elementos.formaPago = document.getElementById('orden-forma-pago');
    elementos.documento = document.getElementById('orden-documento');

    elementos.clienteNombre = document.getElementById('cliente-nombre');
    elementos.clienteNit = document.getElementById('cliente-nit');
    elementos.clienteDireccion = document.getElementById('cliente-direccion');
    elementos.clienteTelefono = document.getElementById('cliente-telefono');
    elementos.clienteCelular = document.getElementById('cliente-celular');

    elementos.vehiculoMarca = document.getElementById('vehiculo-marca');
    elementos.vehiculoModelo = document.getElementById('vehiculo-modelo');
    elementos.vehiculoTipo = document.getElementById('vehiculo-tipo');
    elementos.vehiculoAnio = document.getElementById('vehiculo-anio');
    elementos.vehiculoPlaca = document.getElementById('vehiculo-placa');
    elementos.vehiculoKilometraje = document.getElementById('vehiculo-kilometraje');
    elementos.vehiculoColor = document.getElementById('vehiculo-color');
    elementos.vehiculoBateria = document.getElementById('vehiculo-bateria');
    elementos.vehiculoMotor = document.getElementById('vehiculo-motor');
    elementos.vehiculoVin = document.getElementById('vehiculo-vin');

    elementos.cuerpoServicios = document.getElementById('cuerpo-servicios');
    elementos.btnAgregarServicio = document.getElementById('btn-agregar-servicio');
    elementos.totalServicios = document.getElementById('total-servicios');
    elementos.ordenTotal = document.getElementById('orden-total');

    elementos.estado = document.getElementById('orden-estado');
    elementos.stepper = document.getElementById('orden-stepper');
    elementos.notas = document.getElementById('orden-notas');

    elementos.zonaFotos = document.getElementById('zona-fotos');
    elementos.galeria = document.getElementById('galeria-fotos');
    elementos.inputFotos = document.getElementById('input-fotos');
    elementos.inputCamara = document.getElementById('input-camara');
    elementos.btnSubirFotos = document.getElementById('btn-subir-fotos');
    elementos.btnTomarFoto = document.getElementById('btn-tomar-foto');

    elementos.errores = document.getElementById('errores-orden');
    elementos.tituloForm = document.getElementById('titulo-form-orden');
    elementos.migaForm = document.getElementById('form-miga-ficha');

    elementos.btnImprimir = document.getElementById('btn-imprimir-orden');
    elementos.btnWhatsapp = document.getElementById('btn-whatsapp-orden');
    elementos.btnAgenda = document.getElementById('btn-agenda-orden');
    elementos.btnEliminar = document.getElementById('btn-eliminar-orden');

    conectarEventos();
    estado.ordenes = Almacen.obtenerOrdenes();
    renderizarListado();
  }

  function conectarEventos() {
    document.getElementById('btn-nueva-orden')?.addEventListener('click', () => abrirFormulario());
    document.getElementById('btn-nueva-orden-vacio')?.addEventListener('click', () => abrirFormulario());
    document.getElementById('btn-volver-ordenes')?.addEventListener('click', mostrarListado);
    document.getElementById('btn-cancelar-orden')?.addEventListener('click', mostrarListado);

    elementos.buscar?.addEventListener('input', () => {
      estado.filtro.texto = elementos.buscar.value;
      renderizarTabla();
    });

    elementos.filtroEstado?.addEventListener('change', () => {
      cambiarFiltroEstado(elementos.filtroEstado.value);
    });

    elementos.estadisticas?.addEventListener('click', (evento) => {
      const tarjeta = evento.target.closest('[data-filtro-estado]');
      if (!tarjeta) return;
      cambiarFiltroEstado(tarjeta.dataset.filtroEstado);
    });

    elementos.cuerpoOrdenes?.addEventListener('click', manejarClicListado);

    elementos.form?.addEventListener('submit', manejarEnvioFormulario);
    elementos.form?.addEventListener('input', manejarCambioCampo);
    elementos.form?.addEventListener('change', manejarCambioCampo);

    elementos.btnAgregarServicio?.addEventListener('click', () => {
      agregarFilaServicio();
      const filas = elementos.cuerpoServicios.querySelectorAll('tr');
      const ultima = filas[filas.length - 1];
      ultima?.querySelector('.servicio-nombre')?.focus();
    });

    elementos.cuerpoServicios?.addEventListener('click', (evento) => {
      const quitar = evento.target.closest('[data-accion="quitar-servicio"]');
      if (!quitar) return;
      const fila = quitar.closest('tr');
      if (!fila) return;
      const filas = elementos.cuerpoServicios.querySelectorAll('tr');
      if (filas.length <= 1) {
        fila.querySelector('.servicio-nombre').value = '';
        fila.querySelector('.servicio-importe').value = '';
        fila.classList.remove('campo-error');
        fila.querySelectorAll('input').forEach((input) => input.removeAttribute('aria-invalid'));
      } else {
        fila.remove();
      }
      recalcularTotal();
    });

    elementos.estado?.addEventListener('change', actualizarStepper);

    elementos.btnSubirFotos?.addEventListener('click', () => elementos.inputFotos?.click());
    elementos.btnTomarFoto?.addEventListener('click', () => elementos.inputCamara?.click());

    elementos.inputFotos?.addEventListener('change', async () => {
      await agregarArchivos(elementos.inputFotos.files);
      elementos.inputFotos.value = '';
    });

    elementos.inputCamara?.addEventListener('change', async () => {
      await agregarArchivos(elementos.inputCamara.files);
      elementos.inputCamara.value = '';
    });

    elementos.zonaFotos?.addEventListener('dragover', (evento) => {
      evento.preventDefault();
      elementos.zonaFotos.classList.add('arrastrando');
    });
    elementos.zonaFotos?.addEventListener('dragleave', (evento) => {
      if (elementos.zonaFotos.contains(evento.relatedTarget)) return;
      elementos.zonaFotos.classList.remove('arrastrando');
    });
    elementos.zonaFotos?.addEventListener('drop', async (evento) => {
      evento.preventDefault();
      elementos.zonaFotos.classList.remove('arrastrando');
      await agregarArchivos(evento.dataTransfer?.files);
    });

    elementos.galeria?.addEventListener('click', manejarClicGaleria);
    elementos.galeria?.addEventListener('input', manejarDescripcionFoto);

    elementos.btnImprimir?.addEventListener('click', () => imprimirOrden(estado.ordenActual));
    elementos.btnWhatsapp?.addEventListener('click', () => abrirWhatsAppOrden(estado.ordenActual));
    elementos.btnAgenda?.addEventListener('click', programarEnAgenda);
    elementos.btnEliminar?.addEventListener('click', eliminarOrdenActual);
  }

  /* ---------------------------------------------------------
     Listado, búsqueda y estadísticas
     --------------------------------------------------------- */
  function normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function ordenarPorFecha(ordenes) {
    return [...ordenes].sort((a, b) => {
      const claveA = `${a.fecha || ''}T${a.hora || '00:00'}`;
      const claveB = `${b.fecha || ''}T${b.hora || '00:00'}`;
      return claveB.localeCompare(claveA);
    });
  }

  function filtrarOrdenes() {
    const texto = normalizarTexto(estado.filtro.texto).trim();
    const filtradas = estado.ordenes.filter((orden) => {
      if (estado.filtro.estado !== 'todos' && orden.estado !== estado.filtro.estado) return false;
      if (!texto) return true;
      const campos = [
        orden.numero_ficha,
        orden.cliente?.nombre_razon_social,
        orden.cliente?.celular,
        orden.cliente?.telefono,
        orden.cliente?.nit,
        orden.vehiculo?.placa,
        orden.vehiculo?.marca,
        orden.vehiculo?.modelo,
        orden.vehiculo?.anio,
        orden.vehiculo?.color
      ].join(' ');
      return normalizarTexto(campos).includes(texto);
    });
    return ordenarPorFecha(filtradas);
  }

  function cambiarFiltroEstado(valor) {
    estado.filtro.estado = valor;
    if (elementos.filtroEstado) elementos.filtroEstado.value = valor;
    renderizarEstadisticas();
    renderizarTabla();
  }

  function renderizarListado() {
    estado.ordenes = Almacen.obtenerOrdenes();
    renderizarEstadisticas();
    renderizarTabla();
  }

  function renderizarEstadisticas() {
    const total = estado.ordenes.length;
    const enProceso = estado.ordenes.filter((orden) => orden.estado === 'en_proceso').length;
    const repuestos = estado.ordenes.filter((orden) => orden.estado === 'esperando_repuestos').length;
    const terminadas = estado.ordenes.filter((orden) => orden.estado === 'terminado').length;
    const facturado = estado.ordenes.reduce((suma, orden) => suma + (Number(orden.total) || 0), 0);
    const filtro = estado.filtro.estado;

    const tarjetas = [
      {
        valor: total,
        etiqueta: 'Órdenes totales',
        detalle: `${formatearMoneda(facturado)} facturados`,
        filtro: 'todos',
        icono: 'ordenes',
        clase: 'estadistica-azul'
      },
      {
        valor: enProceso,
        etiqueta: 'En proceso',
        detalle: 'Trabajos en el taller',
        filtro: 'en_proceso',
        icono: 'llave',
        clase: 'estadistica-amarilla'
      },
      {
        valor: repuestos,
        etiqueta: 'Esperando repuestos',
        detalle: 'Pendientes de ingreso',
        filtro: 'esperando_repuestos',
        icono: 'reloj',
        clase: 'estadistica-naranja'
      },
      {
        valor: terminadas,
        etiqueta: 'Listas para entregar',
        detalle: 'Terminadas sin entregar',
        filtro: 'terminado',
        icono: 'check',
        clase: 'estadistica-verde'
      }
    ];

    elementos.estadisticas.innerHTML = tarjetas.map((tarjeta) => `
      <button type="button" class="tarjeta estadistica ${tarjeta.clase} ${filtro === tarjeta.filtro ? 'activa' : ''}"
        data-filtro-estado="${tarjeta.filtro}" aria-pressed="${filtro === tarjeta.filtro ? 'true' : 'false'}">
        <span class="estadistica-icono">${icono(tarjeta.icono)}</span>
        <span class="estadistica-datos">
          <strong>${tarjeta.valor}</strong>
          <span>${escaparHTML(tarjeta.etiqueta)}</span>
          <small>${escaparHTML(tarjeta.detalle)}</small>
        </span>
      </button>
    `).join('');
  }

  function filaOrdenHTML(orden) {
    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};
    const nombreCliente = cliente.nombre_razon_social || 'Sin cliente';
    const celular = cliente.celular || cliente.telefono || '';
    const placa = vehiculo.placa || '—';
    const vehiculoTexto = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Sin vehículo';
    const detalleVehiculo = [vehiculo.anio, vehiculo.color].filter(Boolean).join(' · ');

    return `
      <tr data-orden="${escaparHTML(orden.numero_ficha)}">
        <td data-etiqueta="N° de ficha"><button type="button" class="enlace-ficha" data-accion="abrir" data-orden="${escaparHTML(orden.numero_ficha)}">${escaparHTML(orden.numero_ficha)}</button></td>
        <td data-etiqueta="Fecha">
          <span class="celda-fecha">${formatearFecha(orden.fecha)}</span>
          <span class="celda-sub">${escaparHTML(orden.hora || '')}</span>
        </td>
        <td data-etiqueta="Cliente">
          <span class="celda-cliente">${escaparHTML(nombreCliente)}</span>
          ${celular ? `<span class="celda-sub">${escaparHTML(celular)}</span>` : ''}
        </td>
        <td data-etiqueta="Placa"><span class="placa-chip">${escaparHTML(placa)}</span></td>
        <td data-etiqueta="Vehículo">
          <span class="celda-vehiculo">${escaparHTML(vehiculoTexto)}</span>
          ${detalleVehiculo ? `<span class="celda-sub">${escaparHTML(detalleVehiculo)}</span>` : ''}
        </td>
        <td data-etiqueta="Total" class="columna-total">${formatearMoneda(orden.total)}</td>
        <td data-etiqueta="Estado">${estadoBadge(orden.estado)}</td>
        <td class="columna-acciones">
          <button type="button" class="btn-icono btn-icono-sm" data-accion="abrir" data-orden="${escaparHTML(orden.numero_ficha)}" aria-label="Abrir orden ${escaparHTML(orden.numero_ficha)}" title="Abrir orden">${icono('editar')}</button>
          <button type="button" class="btn-icono btn-icono-sm btn-icono-whatsapp" data-accion="whatsapp" data-orden="${escaparHTML(orden.numero_ficha)}" aria-label="Compartir orden ${escaparHTML(orden.numero_ficha)} por WhatsApp" title="Compartir por WhatsApp">${icono('whatsapp')}</button>
        </td>
      </tr>
    `;
  }

  function renderizarTabla() {
    const filtradas = filtrarOrdenes();
    const total = estado.ordenes.length;

    if (elementos.cuerpoOrdenes) {
      elementos.cuerpoOrdenes.innerHTML = filtradas.map(filaOrdenHTML).join('');
    }

    const hayFiltros = Boolean(estado.filtro.texto.trim()) || estado.filtro.estado !== 'todos';
    if (elementos.conteo) {
      if (!total) elementos.conteo.textContent = 'Sin órdenes registradas';
      else if (hayFiltros) elementos.conteo.textContent = `${filtradas.length} de ${total} órdenes`;
      else elementos.conteo.textContent = `${total} ${total === 1 ? 'orden' : 'órdenes'}`;
    }

    if (elementos.vacio) {
      const vacio = filtradas.length === 0;
      elementos.vacio.classList.toggle('oculto', !vacio);
      const titulo = elementos.vacio.querySelector('h3');
      const descripcion = elementos.vacio.querySelector('p');
      if (vacio && titulo && descripcion) {
        if (total === 0) {
          titulo.textContent = 'Todavía no hay órdenes de trabajo';
          descripcion.textContent = 'Creá la primera orden para registrar el ingreso de un vehículo.';
        } else {
          titulo.textContent = 'No hay órdenes con esos filtros';
          descripcion.textContent = 'Probá con otra búsqueda o cambiá el estado seleccionado.';
        }
      }
    }

    if (elementos.tabla) {
      elementos.tabla.classList.toggle('oculto', filtradas.length === 0);
    }
  }

  function manejarClicListado(evento) {
    const boton = evento.target.closest('[data-accion]');
    const fila = evento.target.closest('tr[data-orden]');
    if (!fila) return;
    const numero = boton?.dataset.orden || fila.dataset.orden;
    if (!numero) return;
    const accion = boton?.dataset.accion || 'abrir';
    if (accion === 'whatsapp') abrirWhatsAppOrden(numero);
    else abrirFormulario(numero);
  }

  /* ---------------------------------------------------------
     Formulario: apertura, carga y limpieza
     --------------------------------------------------------- */
  function mostrarListado() {
    estado.vista = 'listado';
    estado.ordenActual = null;
    elementos.listado?.classList.remove('oculto');
    elementos.formulario?.classList.add('oculto');
    estado.ordenes = Almacen.obtenerOrdenes();
    renderizarListado();
    if (window.establecerTituloApp) {
      window.establecerTituloApp('Órdenes de trabajo', 'Operación / Órdenes de trabajo');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirFormulario(numeroFicha = '') {
    estado.vista = 'formulario';
    elementos.listado?.classList.add('oculto');
    elementos.formulario?.classList.remove('oculto');

    if (numeroFicha) {
      const orden = Almacen.obtenerOrden(numeroFicha);
      if (!orden) {
        mostrarToast(`No se encontró la orden ${numeroFicha}.`, 'error');
        mostrarListado();
        return;
      }
      cargarFormulario(orden);
    } else {
      limpiarFormulario();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function limpiarFormulario() {
    elementos.form.reset();
    estado.ordenActual = null;
    estado.fotos = [];

    const ahora = new Date();
    elementos.original.value = '';
    elementos.ficha.value = 'Se asigna al guardar';
    elementos.fecha.value = aISOfecha(ahora);
    elementos.hora.value = aISOhora(ahora);
    elementos.formaPago.value = 'contado';
    elementos.documento.value = 'factura';
    elementos.estado.value = 'recibido';
    elementos.notas.value = '';

    elementos.cuerpoServicios.innerHTML = '';
    agregarFilaServicio();

    elementos.tituloForm.textContent = 'Nueva orden de trabajo';
    elementos.migaForm.textContent = 'Órdenes / Nueva';

    limpiarErrores();
    actualizarStepper();
    recalcularTotal();
    renderizarGaleria();
    actualizarBotonesFormulario();
  }

  function cargarFormulario(orden) {
    elementos.form.reset();
    estado.ordenActual = orden.numero_ficha;
    estado.fotos = (orden.fotos || []).map((foto) => ({ ...foto }));

    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};

    elementos.original.value = orden.numero_ficha;
    elementos.ficha.value = orden.numero_ficha;
    elementos.fecha.value = orden.fecha || '';
    elementos.hora.value = orden.hora || '';
    elementos.formaPago.value = orden.forma_pago || 'contado';
    elementos.documento.value = orden.documento || 'factura';

    elementos.clienteNombre.value = cliente.nombre_razon_social || '';
    elementos.clienteNit.value = cliente.nit || '';
    elementos.clienteDireccion.value = cliente.direccion || '';
    elementos.clienteTelefono.value = cliente.telefono || '';
    elementos.clienteCelular.value = cliente.celular || '';

    elementos.vehiculoMarca.value = vehiculo.marca || '';
    elementos.vehiculoModelo.value = vehiculo.modelo || '';
    elementos.vehiculoTipo.value = vehiculo.tipo || 'Sedán';
    elementos.vehiculoAnio.value = vehiculo.anio || '';
    elementos.vehiculoPlaca.value = vehiculo.placa || '';
    elementos.vehiculoKilometraje.value = vehiculo.kilometraje ?? '';
    elementos.vehiculoColor.value = vehiculo.color || '';
    elementos.vehiculoBateria.value = vehiculo.bateria || '';
    elementos.vehiculoMotor.value = vehiculo.nro_motor || '';
    elementos.vehiculoVin.value = vehiculo.vin_chasis || '';

    elementos.cuerpoServicios.innerHTML = '';
    const servicios = Array.isArray(orden.servicios) && orden.servicios.length ? orden.servicios : [{ nombre: '', importe: '' }];
    servicios.forEach((servicio) => agregarFilaServicio(servicio));

    elementos.estado.value = orden.estado || 'recibido';
    elementos.notas.value = orden.notas || '';

    elementos.tituloForm.textContent = `Orden ${orden.numero_ficha}`;
    elementos.migaForm.textContent = `Órdenes / ${orden.numero_ficha}`;

    limpiarErrores();
    actualizarStepper();
    recalcularTotal();
    renderizarGaleria();
    actualizarBotonesFormulario();

    if (window.establecerTituloApp) {
      window.establecerTituloApp(`Orden ${orden.numero_ficha}`, `Operación / Órdenes de trabajo / ${orden.numero_ficha}`);
    }
  }

  function actualizarBotonesFormulario() {
    const guardada = Boolean(estado.ordenActual);
    if (elementos.btnImprimir) elementos.btnImprimir.disabled = !guardada;
    if (elementos.btnWhatsapp) elementos.btnWhatsapp.disabled = !guardada;
    if (elementos.btnEliminar) elementos.btnEliminar.classList.toggle('oculto', !guardada);
    if (!guardada && window.establecerTituloApp) {
      window.establecerTituloApp('Nueva orden', 'Operación / Órdenes de trabajo / Nueva');
    }
  }

  /* ---------------------------------------------------------
     Servicios dinámicos y total
     --------------------------------------------------------- */
  function agregarFilaServicio(servicio = {}) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td class="celda-servicio">
        <input type="text" class="servicio-nombre" maxlength="120" placeholder="Ej.: Cambio de aceite y filtro"
          aria-label="Nombre del servicio" value="${escaparHTML(servicio.nombre || '')}">
      </td>
      <td class="celda-servicio celda-importe">
        <input type="number" class="servicio-importe" min="0" step="0.01" inputmode="decimal" placeholder="0"
          aria-label="Importe del servicio en bolivianos" value="${servicio.importe === 0 || servicio.importe ? escaparHTML(servicio.importe) : ''}">
      </td>
      <td class="celda-quitar">
        <button type="button" class="btn-icono btn-icono-sm" data-accion="quitar-servicio" aria-label="Quitar servicio" title="Quitar servicio">${icono('basura')}</button>
      </td>
    `;
    elementos.cuerpoServicios.appendChild(fila);
    recalcularTotal();
    return fila;
  }

  function recalcularTotal() {
    let total = 0;
    elementos.cuerpoServicios.querySelectorAll('.servicio-importe').forEach((input) => {
      const valor = Number(input.value);
      if (Number.isFinite(valor) && valor > 0) total += valor;
    });
    const texto = formatearMoneda(total);
    if (elementos.totalServicios) elementos.totalServicios.textContent = texto;
    if (elementos.ordenTotal) elementos.ordenTotal.textContent = texto;
    return total;
  }

  function actualizarStepper() {
    if (!elementos.stepper) return;
    elementos.stepper.innerHTML = renderStepper(elementos.estado.value);
  }

  /* ---------------------------------------------------------
     Lectura y validación del formulario
     --------------------------------------------------------- */
  function leerFormulario() {
    const filasServicio = Array.from(elementos.cuerpoServicios.querySelectorAll('tr'))
      .map((fila) => ({
        fila,
        nombre: fila.querySelector('.servicio-nombre'),
        importe: fila.querySelector('.servicio-importe')
      }))
      .filter((item) => item.nombre && item.importe && (item.nombre.value.trim() || item.importe.value.trim()));

    const servicios = filasServicio.map((item) => ({
      nombre: item.nombre.value.trim(),
      importe: item.importe.value.trim() === '' ? NaN : Number(item.importe.value)
    }));

    return {
      fecha: elementos.fecha.value,
      hora: elementos.hora.value,
      forma_pago: elementos.formaPago.value,
      documento: elementos.documento.value,
      cliente: {
        nombre_razon_social: elementos.clienteNombre.value.trim(),
        nit: elementos.clienteNit.value.trim(),
        direccion: elementos.clienteDireccion.value.trim(),
        telefono: elementos.clienteTelefono.value.trim(),
        celular: elementos.clienteCelular.value.trim()
      },
      vehiculo: {
        marca: elementos.vehiculoMarca.value.trim(),
        modelo: elementos.vehiculoModelo.value.trim(),
        tipo: elementos.vehiculoTipo.value,
        anio: elementos.vehiculoAnio.value.trim() === '' ? '' : Number(elementos.vehiculoAnio.value),
        placa: normalizarPlaca(elementos.vehiculoPlaca.value),
        kilometraje: elementos.vehiculoKilometraje.value.trim() === '' ? 0 : Number(elementos.vehiculoKilometraje.value),
        color: elementos.vehiculoColor.value.trim(),
        nro_motor: elementos.vehiculoMotor.value.trim(),
        vin_chasis: elementos.vehiculoVin.value.trim(),
        bateria: elementos.vehiculoBateria.value.trim()
      },
      estado: elementos.estado.value,
      notas: elementos.notas.value.trim(),
      servicios,
      filasServicio
    };
  }

  function marcarInvalido(elemento) {
    if (!elemento) return;
    const contenedor = elemento.closest('.campo') || elemento.closest('td');
    if (contenedor) contenedor.classList.add('campo-error');
    if (typeof elemento.setAttribute === 'function') elemento.setAttribute('aria-invalid', 'true');
  }

  function validarFormulario(datos) {
    const errores = [];
    const agregar = (elemento, mensaje) => {
      marcarInvalido(elemento);
      errores.push({ elemento, mensaje });
    };

    if (!datos.fecha) agregar(elementos.fecha, 'Indicá la fecha de recepción.');
    if (!datos.hora) agregar(elementos.hora, 'Indicá la hora de recepción.');

    if (!datos.cliente.nombre_razon_social) {
      agregar(elementos.clienteNombre, 'Escribí el nombre del cliente o razón social.');
    }
    if (!datos.cliente.celular) {
      agregar(elementos.clienteCelular, 'Escribí el celular del cliente.');
    } else if (datos.cliente.celular.replace(/\D/g, '').length < 6) {
      agregar(elementos.clienteCelular, 'El celular debe tener al menos 6 dígitos.');
    }

    if (!datos.vehiculo.marca) agregar(elementos.vehiculoMarca, 'Indicá la marca del vehículo.');
    if (!datos.vehiculo.modelo) agregar(elementos.vehiculoModelo, 'Indicá el modelo del vehículo.');
    if (!datos.vehiculo.placa) agregar(elementos.vehiculoPlaca, 'Indicá la placa del vehículo.');

    if (datos.vehiculo.anio !== '') {
      const anio = Number(datos.vehiculo.anio);
      if (!Number.isInteger(anio) || anio < 1950 || anio > 2100) {
        agregar(elementos.vehiculoAnio, 'El año del vehículo debe estar entre 1950 y 2100.');
      }
    }

    if (!Number.isFinite(datos.vehiculo.kilometraje) || datos.vehiculo.kilometraje < 0) {
      agregar(elementos.vehiculoKilometraje, 'El kilometraje debe ser un número igual o mayor a cero.');
    }

    if (!datos.servicios.length) {
      agregar(elementos.btnAgregarServicio, 'Agregá al menos un servicio a la orden.');
    } else {
      datos.filasServicio.forEach((item, indice) => {
        const servicio = datos.servicios[indice];
        if (!servicio.nombre) agregar(item.nombre, 'Cada servicio necesita un nombre.');
        if (!Number.isFinite(servicio.importe) || servicio.importe < 0) {
          agregar(item.importe, 'Cada servicio necesita un importe válido (0 o más).');
        }
      });
    }

    return errores;
  }

  function limpiarErrores() {
    elementos.form.querySelectorAll('.campo-error').forEach((elemento) => elemento.classList.remove('campo-error'));
    elementos.form.querySelectorAll('[aria-invalid="true"]').forEach((elemento) => elemento.removeAttribute('aria-invalid'));
    if (elementos.errores) {
      elementos.errores.classList.add('oculto');
      elementos.errores.innerHTML = '';
    }
  }

  function mostrarErrores(errores) {
    elementos.errores.innerHTML = `
      <strong>Revisá los datos de la orden</strong>
      <ul>${errores.map((error) => `<li>${escaparHTML(error.mensaje)}</li>`).join('')}</ul>
    `;
    elementos.errores.classList.remove('oculto');
    elementos.errores.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const primero = errores.find((error) => error.elemento && typeof error.elemento.focus === 'function');
    if (primero) {
      setTimeout(() => primero.elemento.focus(), 250);
    }
  }

  function manejarCambioCampo(evento) {
    const objetivo = evento.target;
    const contenedor = objetivo.closest('.campo') || objetivo.closest('td');
    if (contenedor) contenedor.classList.remove('campo-error');
    objetivo.removeAttribute('aria-invalid');
    if (objetivo.classList.contains('servicio-importe')) recalcularTotal();
  }

  function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    limpiarErrores();
    const datos = leerFormulario();
    const errores = validarFormulario(datos);
    if (errores.length) {
      mostrarErrores(errores);
      mostrarToast('Faltan datos obligatorios en la orden.', 'error');
      return;
    }
    guardarOrden(datos);
  }

  /* ---------------------------------------------------------
     Guardar y eliminar
     --------------------------------------------------------- */
  function guardarOrden(datos) {
    const ordenes = Almacen.obtenerOrdenes();
    const existente = estado.ordenActual
      ? ordenes.find((orden) => orden.numero_ficha === estado.ordenActual)
      : null;
    const numero = existente ? existente.numero_ficha : generarId('OT', ordenes);
    const ahora = aISOlocal(new Date());

    const servicios = datos.servicios.map((servicio) => ({
      nombre: servicio.nombre,
      importe: Number(servicio.importe) || 0
    }));
    const total = servicios.reduce((suma, servicio) => suma + servicio.importe, 0);

    const orden = {
      numero_ficha: numero,
      fecha: datos.fecha,
      hora: datos.hora,
      forma_pago: datos.forma_pago,
      documento: datos.documento,
      cliente: { ...datos.cliente },
      vehiculo: { ...datos.vehiculo },
      servicios,
      total,
      estado: datos.estado,
      notas: datos.notas,
      fotos: estado.fotos
        .filter((foto) => foto && foto.data)
        .map((foto) => ({ id: foto.id, descripcion: foto.descripcion || '', data: foto.data })),
      creado_en: existente?.creado_en || ahora,
      actualizado_en: ahora
    };

    const nuevas = existente
      ? ordenes.map((item) => (item.numero_ficha === numero ? orden : item))
      : [...ordenes, orden];

    const resultado = Almacen.guardarOrdenes(nuevas);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6500);
      return;
    }

    estado.ordenes = nuevas;
    estado.ordenActual = numero;
    estado.fotos = orden.fotos.map((foto) => ({ ...foto }));

    elementos.original.value = numero;
    elementos.ficha.value = numero;
    elementos.tituloForm.textContent = `Orden ${numero}`;
    elementos.migaForm.textContent = `Órdenes / ${numero}`;
    actualizarBotonesFormulario();
    recalcularTotal();
    renderizarGaleria();

    if (window.establecerTituloApp) {
      window.establecerTituloApp(`Orden ${numero}`, `Operación / Órdenes de trabajo / ${numero}`);
    }
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();

    mostrarToast(
      existente ? `Orden ${numero} actualizada correctamente.` : `Orden ${numero} creada correctamente.`,
      'exito'
    );
  }

  async function eliminarOrdenActual() {
    const numero = estado.ordenActual;
    if (!numero) return;
    const orden = Almacen.obtenerOrden(numero);
    if (!orden) {
      mostrarToast('La orden ya no existe.', 'error');
      mostrarListado();
      return;
    }

    const confirmado = await confirmarAccion({
      titulo: 'Eliminar orden de trabajo',
      mensaje: `¿Eliminar la orden ${numero} de ${orden.cliente?.nombre_razon_social || 'este cliente'}? Se borrarán también sus fotos. Esta acción no se puede deshacer.`,
      textoAceptar: 'Eliminar',
      peligro: true
    });
    if (!confirmado) return;

    const nuevas = Almacen.obtenerOrdenes().filter((item) => item.numero_ficha !== numero);
    const resultado = Almacen.guardarOrdenes(nuevas);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6500);
      return;
    }

    estado.ordenes = nuevas;
    estado.ordenActual = null;
    mostrarListado();
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();
    mostrarToast(`Orden ${numero} eliminada.`, 'exito');
  }

  /* ---------------------------------------------------------
     Fotos de recepción
     --------------------------------------------------------- */
  function descripcionDesdeArchivo(nombre) {
    const base = String(nombre || '')
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return capitalizar(base || 'Foto de recepción').slice(0, 80);
  }

  async function agregarArchivos(lista) {
    if (estado.procesandoFotos) return;

    const archivos = Array.from(lista || []).filter((archivo) => archivo && archivo.type && archivo.type.startsWith('image/'));
    if (!archivos.length) {
      mostrarToast('Elegí archivos de imagen (JPG, PNG o WebP).', 'aviso');
      return;
    }

    const espacio = MAX_FOTOS - estado.fotos.length;
    if (espacio <= 0) {
      mostrarToast(`Ya alcanzaste el máximo de ${MAX_FOTOS} fotos por orden.`, 'aviso');
      return;
    }

    const seleccionados = archivos.slice(0, espacio);
    if (archivos.length > espacio) {
      mostrarToast(`Solo se agregaron ${espacio} foto${espacio === 1 ? '' : 's'}: el máximo es ${MAX_FOTOS}.`, 'aviso');
    }

    estado.procesandoFotos = true;
    if (elementos.btnSubirFotos) elementos.btnSubirFotos.disabled = true;
    if (elementos.btnTomarFoto) elementos.btnTomarFoto.disabled = true;

    let agregadas = 0;
    try {
      for (const archivo of seleccionados) {
        try {
          const data = await comprimirImagen(archivo, LADO_MAXIMO_FOTO, CALIDAD_FOTO);
          if (!data) throw new Error('La imagen quedó vacía al comprimirla.');
          estado.fotos.push({
            id: generarIdFoto(),
            descripcion: descripcionDesdeArchivo(archivo.name),
            data
          });
          agregadas += 1;
        } catch (error) {
          mostrarToast(error?.message || 'No se pudo procesar una de las imágenes.', 'error', 5500);
        }
      }
    } finally {
      estado.procesandoFotos = false;
      if (elementos.btnSubirFotos) elementos.btnSubirFotos.disabled = false;
      if (elementos.btnTomarFoto) elementos.btnTomarFoto.disabled = false;
    }

    renderizarGaleria();
    if (agregadas) {
      mostrarToast(`${agregadas} foto${agregadas === 1 ? '' : 's'} agregada${agregadas === 1 ? '' : 's'} y comprimida${agregadas === 1 ? '' : 's'}.`, 'exito');
    }
  }

  function renderizarGaleria() {
    if (!elementos.galeria) return;

    if (!estado.fotos.length) {
      elementos.galeria.innerHTML = `
        <div class="fotos-vacio">
          <span class="fotos-vacio-icono">${icono('camara')}</span>
          <p>Todavía no hay fotos de recepción.</p>
          <span>Subí o arrastrá imágenes para registrar el estado del vehículo.</span>
        </div>
      `;
      return;
    }

    const tarjetas = estado.fotos.map((foto, indice) => `
      <figure class="foto-item" data-foto-id="${escaparHTML(foto.id)}">
        <button type="button" class="foto-miniatura" data-accion="ver-foto" data-indice="${indice}" aria-label="Ampliar foto ${indice + 1}">
          <img src="${foto.data}" alt="${escaparHTML(foto.descripcion || 'Foto de recepción')}">
          <span class="foto-zoom">${icono('buscar')}</span>
        </button>
        <figcaption class="foto-pie">
          <label class="solo-lectores" for="foto-desc-${indice}">Descripción de la foto ${indice + 1}</label>
          <input type="text" id="foto-desc-${indice}" class="foto-descripcion" data-accion="describir-foto"
            data-foto-id="${escaparHTML(foto.id)}" maxlength="80" value="${escaparHTML(foto.descripcion || '')}"
            placeholder="Descripción de la foto">
          <button type="button" class="btn-icono btn-icono-sm foto-quitar" data-accion="quitar-foto"
            data-foto-id="${escaparHTML(foto.id)}" aria-label="Quitar foto ${indice + 1}" title="Quitar foto">${icono('basura')}</button>
        </figcaption>
      </figure>
    `).join('');

    elementos.galeria.innerHTML = `
      <div class="galeria-cabecera">
        <span>${estado.fotos.length} de ${MAX_FOTOS} fotos</span>
        <span>Las imágenes se guardan comprimidas a ${LADO_MAXIMO_FOTO} px · JPEG ${String(CALIDAD_FOTO).replace('.', ',')}</span>
      </div>
      <div class="galeria-grid">${tarjetas}</div>
    `;
  }

  function manejarClicGaleria(evento) {
    const ver = evento.target.closest('[data-accion="ver-foto"]');
    if (ver) {
      const indice = Number(ver.dataset.indice) || 0;
      Lightbox.abrir(
        estado.fotos.map((foto) => ({ data: foto.data, descripcion: foto.descripcion })),
        indice
      );
      return;
    }

    const quitar = evento.target.closest('[data-accion="quitar-foto"]');
    if (!quitar) return;
    const id = quitar.dataset.fotoId;
    estado.fotos = estado.fotos.filter((foto) => foto.id !== id);
    renderizarGaleria();
    mostrarToast('Foto quitada. Guardá la orden para aplicar el cambio.', 'info');
  }

  function manejarDescripcionFoto(evento) {
    const input = evento.target.closest('[data-accion="describir-foto"]');
    if (!input) return;
    const foto = estado.fotos.find((item) => item.id === input.dataset.fotoId);
    if (foto) foto.descripcion = input.value.trim();
  }

  /* ---------------------------------------------------------
     Impresión
     --------------------------------------------------------- */
  function construirHojaImpresion(orden) {
    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};
    const estadoInfo = ESTADOS_ORDEN[orden.estado] || { etiqueta: orden.estado || '—' };
    const servicios = (orden.servicios || []).map((servicio, indice) => `
      <tr>
        <td class="impreso-num">${indice + 1}</td>
        <td>${escaparHTML(servicio.nombre)}</td>
        <td class="impreso-der">${formatearMoneda(servicio.importe)}</td>
      </tr>
    `).join('');
    const fotos = (orden.fotos || []).slice(0, 4).map((foto) => `
      <figure class="impreso-foto">
        <img src="${foto.data}" alt="${escaparHTML(foto.descripcion || 'Foto de recepción')}">
        <figcaption>${escaparHTML(foto.descripcion || 'Foto de recepción')}</figcaption>
      </figure>
    `).join('');

    return `
      <div class="impreso">
        <header class="impreso-cabecera">
          <div class="impreso-taller">
            <p class="impreso-marca">${escaparHTML(CONFIG.nombreTaller)}</p>
            <p>${escaparHTML(CONFIG.direccion)} · ${escaparHTML(CONFIG.ciudad)}</p>
            <p>Tel. ${escaparHTML(CONFIG.telefonoVisible)} · ${escaparHTML(CONFIG.email)}</p>
            <p>${escaparHTML(CONFIG.horario)}</p>
          </div>
          <div class="impreso-ficha">
            <span>Orden de trabajo</span>
            <strong>${escaparHTML(orden.numero_ficha)}</strong>
            <span>${formatearFecha(orden.fecha)} · ${escaparHTML(orden.hora || '')}</span>
          </div>
        </header>

        <section class="impreso-bloque">
          <h2>Datos del cliente</h2>
          <div class="impreso-datos">
            <p><span>Nombre / razón social</span><strong>${escaparHTML(cliente.nombre_razon_social || '—')}</strong></p>
            <p><span>NIT / CI</span><strong>${escaparHTML(cliente.nit || '—')}</strong></p>
            <p><span>Celular</span><strong>${escaparHTML(cliente.celular || '—')}</strong></p>
            <p><span>Teléfono</span><strong>${escaparHTML(cliente.telefono || '—')}</strong></p>
            <p class="impreso-ancho"><span>Dirección</span><strong>${escaparHTML(cliente.direccion || '—')}</strong></p>
          </div>
        </section>

        <section class="impreso-bloque">
          <h2>Datos del vehículo</h2>
          <div class="impreso-datos">
            <p><span>Marca y modelo</span><strong>${escaparHTML([vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || '—')}</strong></p>
            <p><span>Tipo</span><strong>${escaparHTML(vehiculo.tipo || '—')}</strong></p>
            <p><span>Año</span><strong>${escaparHTML(vehiculo.anio || '—')}</strong></p>
            <p><span>Placa</span><strong>${escaparHTML(vehiculo.placa || '—')}</strong></p>
            <p><span>Color</span><strong>${escaparHTML(vehiculo.color || '—')}</strong></p>
            <p><span>Kilometraje</span><strong>${vehiculo.kilometraje !== '' && vehiculo.kilometraje !== undefined ? `${Number(vehiculo.kilometraje).toLocaleString('es-BO')} km` : '—'}</strong></p>
            <p><span>N° de motor</span><strong>${escaparHTML(vehiculo.nro_motor || '—')}</strong></p>
            <p><span>VIN / chasis</span><strong>${escaparHTML(vehiculo.vin_chasis || '—')}</strong></p>
            <p class="impreso-ancho"><span>Batería</span><strong>${escaparHTML(vehiculo.bateria || '—')}</strong></p>
          </div>
        </section>

        <section class="impreso-bloque">
          <h2>Servicios</h2>
          <table class="impreso-tabla">
            <thead>
              <tr><th class="impreso-num">#</th><th>Descripción</th><th class="impreso-der">Importe</th></tr>
            </thead>
            <tbody>${servicios || '<tr><td colspan="3">Sin servicios registrados.</td></tr>'}</tbody>
            <tfoot>
              <tr><td colspan="2" class="impreso-der">Total</td><td class="impreso-der">${formatearMoneda(orden.total)}</td></tr>
            </tfoot>
          </table>
        </section>

        <section class="impreso-bloque impreso-resumen">
          <p><span>Estado</span><strong>${escaparHTML(estadoInfo.etiqueta)}</strong></p>
          <p><span>Forma de pago</span><strong>${escaparHTML(FORMAS_PAGO[orden.forma_pago] || orden.forma_pago || '—')}</strong></p>
          <p><span>Documento</span><strong>${escaparHTML(DOCUMENTOS[orden.documento] || orden.documento || '—')}</strong></p>
        </section>

        <section class="impreso-bloque">
          <h2>Notas internas</h2>
          <p class="impreso-notas">${escaparHTML(orden.notas || 'Sin notas.')}</p>
        </section>

        ${fotos ? `<section class="impreso-bloque"><h2>Fotos de recepción</h2><div class="impreso-fotos">${fotos}</div></section>` : ''}

        <footer class="impreso-pie">
          <div class="impreso-firma"><span>Firma del cliente</span></div>
          <div class="impreso-firma"><span>Firma del taller</span></div>
        </footer>
        <p class="impreso-leyenda">Documento generado por la demo local · ${formatearFechaLarga(new Date())}</p>
      </div>
    `;
  }

  function imprimirOrden(numeroFicha) {
    const numero = numeroFicha || estado.ordenActual;
    const orden = numero ? Almacen.obtenerOrden(numero) : null;
    if (!orden) {
      mostrarToast('Guardá la orden antes de imprimirla.', 'aviso');
      return;
    }

    const hoja = document.getElementById('hoja-impresion');
    if (!hoja) {
      mostrarToast('No se encontró la hoja de impresión.', 'error');
      return;
    }

    hoja.innerHTML = construirHojaImpresion(orden);
    document.body.classList.add('imprimiendo');

    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        mostrarToast('No se pudo abrir el diálogo de impresión.', 'error');
      }
      setTimeout(() => {
        document.body.classList.remove('imprimiendo');
        hoja.innerHTML = '';
      }, 500);
    }, 80);
  }

  /* ---------------------------------------------------------
     WhatsApp y agenda
     --------------------------------------------------------- */
  function abrirWhatsAppOrden(numeroFicha) {
    const numero = numeroFicha || estado.ordenActual;
    const orden = numero ? Almacen.obtenerOrden(numero) : null;
    if (!orden) {
      mostrarToast('Guardá la orden antes de compartirla por WhatsApp.', 'aviso');
      return;
    }
    if (window.WhatsApp && typeof window.WhatsApp.abrir === 'function') {
      window.WhatsApp.abrir(orden);
    } else {
      mostrarToast('El módulo de WhatsApp todavía no está disponible.', 'aviso');
    }
  }

  function programarEnAgenda() {
    const numero = estado.ordenActual;
    if (!numero) {
      mostrarToast('Guardá la orden antes de programarla en la agenda.', 'aviso');
      return;
    }
    const orden = Almacen.obtenerOrden(numero);
    if (!orden) {
      mostrarToast('No se encontró la orden guardada.', 'error');
      return;
    }
    if (!window.Agenda || typeof window.Agenda.programarEntrega !== 'function') {
      mostrarToast('La agenda no está disponible en este momento.', 'error');
      return;
    }
    if (window.mostrarVista) window.mostrarVista('agenda');
    window.Agenda.programarEntrega(orden);
  }

  /* ---------------------------------------------------------
     API pública
     --------------------------------------------------------- */
  function recargar() {
    estado.ordenes = Almacen.obtenerOrdenes();
    if (estado.vista === 'listado') {
      renderizarListado();
    } else {
      mostrarListado();
    }
  }

  return {
    iniciar,
    recargar,
    mostrarListado,
    abrirOrden: abrirFormulario,
    imprimirOrden,
    abrirWhatsApp: abrirWhatsAppOrden
  };
})();

/* Se expone en window para que el arranque de index.html pueda usarlo. */
window.Ordenes = Ordenes;
