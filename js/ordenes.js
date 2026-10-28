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
    procesandoFotos: false,
    idCliente: '',
    idVehiculo: '',
    autocompletar: { abierto: false, items: [], indice: -1, input: null }
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

    elementos.mecanico = document.getElementById('orden-mecanico');
    elementos.listaMecanicos = document.getElementById('lista-mecanicos');
    elementos.categoria = document.getElementById('orden-categoria');
    elementos.garantiaDias = document.getElementById('orden-garantia-dias');
    elementos.garantiaKm = document.getElementById('orden-garantia-km');
    elementos.proximoFecha = document.getElementById('orden-proximo-fecha');
    elementos.proximoKm = document.getElementById('orden-proximo-km');
    elementos.proximoDesc = document.getElementById('orden-proximo-desc');
    elementos.cuerpoRepuestos = document.getElementById('cuerpo-repuestos');
    elementos.btnAgregarRepuesto = document.getElementById('btn-agregar-repuesto');
    elementos.listaRecomendacionesForm = document.getElementById('lista-recomendaciones-form');
    elementos.btnAgregarRecomendacion = document.getElementById('btn-agregar-recomendacion');

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

    elementos.idCliente = document.getElementById('orden-id-cliente');
    elementos.idVehiculo = document.getElementById('orden-id-vehiculo');
    elementos.avisoVehiculo = document.getElementById('orden-aviso-vehiculo');
    elementos.recomendaciones = document.getElementById('orden-recomendaciones');
    elementos.autocompletar = document.getElementById('autocompletar-orden');
    elementos.listaServicios = document.getElementById('lista-servicios');
    elementos.modalHistorialRapido = document.getElementById('modal-historial-rapido');
    elementos.historialRapidoContenido = document.getElementById('historial-rapido-contenido');
    elementos.btnHistorialCompleto = document.getElementById('btn-historial-completo');

    elementos.btnImprimir = document.getElementById('btn-imprimir-orden');
    elementos.btnWhatsapp = document.getElementById('btn-whatsapp-orden');
    elementos.btnAgenda = document.getElementById('btn-agenda-orden');
    elementos.btnEliminar = document.getElementById('btn-eliminar-orden');

    conectarEventos();
    actualizarListaServicios();
    actualizarListaMecanicos();
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

    elementos.btnAgregarRepuesto?.addEventListener('click', () => {
      const fila = agregarFilaRepuesto();
      fila?.querySelector('.repuesto-nombre')?.focus();
    });

    elementos.cuerpoRepuestos?.addEventListener('click', (evento) => {
      const quitar = evento.target.closest('[data-accion="quitar-repuesto"]');
      if (!quitar) return;
      const fila = quitar.closest('tr');
      if (!fila) return;
      const filas = elementos.cuerpoRepuestos.querySelectorAll('tr');
      if (filas.length <= 1) {
        fila.querySelector('.repuesto-nombre').value = '';
        fila.querySelector('.repuesto-cantidad').value = '1';
        fila.classList.remove('campo-error');
        fila.querySelectorAll('input').forEach((input) => input.removeAttribute('aria-invalid'));
      } else {
        fila.remove();
      }
    });

    elementos.btnAgregarRecomendacion?.addEventListener('click', () => {
      const fila = agregarFilaRecomendacion();
      fila?.querySelector('.recomendacion-descripcion')?.focus();
    });

    elementos.listaRecomendacionesForm?.addEventListener('click', (evento) => {
      const quitar = evento.target.closest('[data-accion="quitar-recomendacion"]');
      if (!quitar) return;
      quitar.closest('.recomendacion-fila')?.remove();
      actualizarVacioRecomendaciones();
    });

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

    conectarAutocompletar();
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
    estado.idCliente = '';
    estado.idVehiculo = '';
    cerrarAutocompletar();
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
    estado.idCliente = '';
    estado.idVehiculo = '';
    cerrarAutocompletar();

    const ahora = new Date();
    elementos.original.value = '';
    elementos.ficha.value = 'Se asigna al guardar';
    elementos.idCliente.value = '';
    elementos.idVehiculo.value = '';
    elementos.fecha.value = aISOfecha(ahora);
    elementos.hora.value = aISOhora(ahora);
    elementos.formaPago.value = 'contado';
    elementos.documento.value = 'factura';
    elementos.estado.value = 'recibido';
    elementos.notas.value = '';

    if (elementos.mecanico) elementos.mecanico.value = '';
    if (elementos.categoria) elementos.categoria.value = 'mantenimiento';
    if (elementos.garantiaDias) elementos.garantiaDias.value = '';
    if (elementos.garantiaKm) elementos.garantiaKm.value = '';
    if (elementos.proximoFecha) elementos.proximoFecha.value = '';
    if (elementos.proximoKm) elementos.proximoKm.value = '';
    if (elementos.proximoDesc) elementos.proximoDesc.value = '';

    if (elementos.avisoVehiculo) {
      elementos.avisoVehiculo.classList.add('oculto');
      elementos.avisoVehiculo.innerHTML = '';
    }
    if (elementos.recomendaciones) {
      elementos.recomendaciones.classList.add('oculto');
      elementos.recomendaciones.innerHTML = '';
    }

    elementos.cuerpoServicios.innerHTML = '';
    agregarFilaServicio();

    if (elementos.cuerpoRepuestos) {
      elementos.cuerpoRepuestos.innerHTML = '';
      agregarFilaRepuesto();
    }
    if (elementos.listaRecomendacionesForm) {
      elementos.listaRecomendacionesForm.innerHTML = '';
      actualizarVacioRecomendaciones();
    }

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
    cerrarAutocompletar();

    const cliente = orden.cliente || {};
    const vehiculo = orden.vehiculo || {};

    estado.idCliente = orden.id_cliente || '';
    estado.idVehiculo = orden.id_vehiculo || '';
    elementos.idCliente.value = estado.idCliente;
    elementos.idVehiculo.value = estado.idVehiculo;

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

    if (elementos.mecanico) elementos.mecanico.value = orden.mecanico || '';
    if (elementos.categoria) {
      elementos.categoria.value = CATEGORIAS_TRABAJO[orden.categoria] ? orden.categoria : 'mantenimiento';
    }
    const garantia = orden.garantia && typeof orden.garantia === 'object' ? orden.garantia : {};
    if (elementos.garantiaDias) elementos.garantiaDias.value = Number(garantia.dias) > 0 ? garantia.dias : '';
    if (elementos.garantiaKm) elementos.garantiaKm.value = Number(garantia.km) > 0 ? garantia.km : '';
    const proximo = orden.proximo_servicio && typeof orden.proximo_servicio === 'object' ? orden.proximo_servicio : {};
    if (elementos.proximoFecha) elementos.proximoFecha.value = proximo.fecha || '';
    if (elementos.proximoKm) elementos.proximoKm.value = Number(proximo.km) > 0 ? proximo.km : '';
    if (elementos.proximoDesc) elementos.proximoDesc.value = proximo.descripcion || '';

    if (elementos.cuerpoRepuestos) {
      elementos.cuerpoRepuestos.innerHTML = '';
      const repuestos = Array.isArray(orden.repuestos) && orden.repuestos.length ? orden.repuestos : [{}];
      repuestos.forEach((repuesto) => agregarFilaRepuesto(repuesto));
    }
    if (elementos.listaRecomendacionesForm) {
      elementos.listaRecomendacionesForm.innerHTML = '';
      const recomendaciones = Array.isArray(orden.recomendaciones) ? orden.recomendaciones : [];
      recomendaciones.forEach((recomendacion) => agregarFilaRecomendacion(recomendacion));
      actualizarVacioRecomendaciones();
    }

    elementos.estado.value = orden.estado || 'recibido';
    elementos.notas.value = orden.notas || '';

    elementos.tituloForm.textContent = `Orden ${orden.numero_ficha}`;
    elementos.migaForm.textContent = `Órdenes / ${orden.numero_ficha}`;

    limpiarErrores();
    actualizarStepper();
    recalcularTotal();
    renderizarGaleria();
    actualizarBotonesFormulario();
    actualizarAvisoVehiculo();
    actualizarRecomendacionesPendientes();

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
     Autocompletado de clientes y vehículos
     --------------------------------------------------------- */
  const CAMPOS_AUTOCOMPLETAR = [
    { id: 'cliente-nombre', tipo: 'cliente' },
    { id: 'cliente-nit', tipo: 'cliente' },
    { id: 'cliente-celular', tipo: 'cliente' },
    { id: 'vehiculo-placa', tipo: 'vehiculo' }
  ];

  function conectarAutocompletar() {
    CAMPOS_AUTOCOMPLETAR.forEach(({ id, tipo }) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-controls', 'autocompletar-orden');

      input.addEventListener('focus', () => abrirSugerencias(input, tipo, input.value));
      input.addEventListener('input', () => {
        if (tipo === 'cliente') {
          estado.idCliente = '';
          if (elementos.idCliente) elementos.idCliente.value = '';
        } else {
          estado.idVehiculo = '';
          if (elementos.idVehiculo) elementos.idVehiculo.value = '';
          actualizarAvisoVehiculo();
          actualizarRecomendacionesPendientes();
        }
        abrirSugerencias(input, tipo, input.value);
      });
      input.addEventListener('keydown', manejarTeclaAutocompletar);
      input.addEventListener('blur', () => {
        setTimeout(() => cerrarAutocompletar(), 140);
      });
    });

    elementos.autocompletar?.addEventListener('mousedown', (evento) => {
      const opcion = evento.target.closest('[data-indice]');
      if (!opcion) return;
      evento.preventDefault();
      seleccionarSugerencia(Number(opcion.dataset.indice));
    });

    document.addEventListener('mousedown', (evento) => {
      if (!estado.autocompletar.abierto) return;
      const ruta = typeof evento.composedPath === 'function' ? evento.composedPath() : [];
      if (ruta.includes(elementos.autocompletar)) return;
      const esCampo = CAMPOS_AUTOCOMPLETAR.some(({ id }) => document.getElementById(id) === evento.target);
      if (!esCampo) cerrarAutocompletar();
    });

    elementos.avisoVehiculo?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-accion]');
      if (!boton) return;
      if (boton.dataset.accion === 'ver-historial-rapido') {
        abrirHistorialRapido(boton.dataset.vehiculo);
      } else if (boton.dataset.accion === 'usar-vehiculo') {
        const vehiculo = Almacen.buscarVehiculoEnLista(Almacen.obtenerVehiculos(), elementos.vehiculoPlaca.value);
        if (vehiculo) aplicarVehiculo(vehiculo);
      }
    });

    elementos.recomendaciones?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-accion]');
      if (!boton) return;
      const idHistorial = boton.dataset.historial;
      const indice = Number(boton.dataset.indice);

      if (boton.dataset.accion === 'agregar-recomendacion') {
        const registro = Almacen.obtenerHistorial().find((item) => item.id === idHistorial);
        const recomendacion = registro?.recomendaciones?.[indice];
        if (!recomendacion) {
          mostrarToast('La recomendación ya no está disponible.', 'aviso');
          actualizarRecomendacionesPendientes();
          return;
        }
        const fila = agregarFilaServicio({
          nombre: `Recomendación: ${recomendacion.descripcion}`,
          importe: 0
        });
        fila.querySelector('.servicio-nombre')?.focus();
        const resultado = Almacen.marcarRecomendacionAtendida(idHistorial, indice);
        if (resultado.ok) {
          actualizarRecomendacionesPendientes();
          window.dispatchEvent(new CustomEvent('historial:actualizado'));
          mostrarToast('Recomendación agregada como servicio sin costo.', 'exito');
        }
        return;
      }

      if (boton.dataset.accion === 'marcar-recomendacion') {
        const resultado = Almacen.marcarRecomendacionAtendida(idHistorial, indice);
        if (!resultado.ok) {
          mostrarToast(resultado.mensaje || 'No se pudo actualizar la recomendación.', 'error');
          return;
        }
        actualizarRecomendacionesPendientes();
        window.dispatchEvent(new CustomEvent('historial:actualizado'));
        mostrarToast('Recomendación marcada como atendida.', 'exito');
      }
    });

    elementos.btnHistorialCompleto?.addEventListener('click', () => {
      const idVehiculo = elementos.modalHistorialRapido?.dataset.vehiculo || estado.idVehiculo;
      if (!idVehiculo) return;
      Modal.cerrar('modal-historial-rapido');
      if (window.mostrarVista) window.mostrarVista('clientes');
      if (window.Clientes && typeof Clientes.abrirVehiculo === 'function') {
        Clientes.abrirVehiculo(idVehiculo);
      }
    });
  }

  function sugerenciasClientes(texto) {
    const clientes = Almacen.obtenerClientes();
    const vehiculos = Almacen.obtenerVehiculos();
    const historial = Almacen.obtenerHistorial();
    const visitas = new Map();
    historial.forEach((registro) => {
      visitas.set(registro.id_cliente, (visitas.get(registro.id_cliente) || 0) + 1);
    });

    const buscado = normalizarNombre(texto);
    return clientes
      .filter((cliente) => {
        if (!buscado) return true;
        return normalizarNombre([
          cliente.nombre_razon_social,
          cliente.nit,
          cliente.celular,
          cliente.telefono
        ].join(' ')).includes(buscado);
      })
      .sort((a, b) => {
        const diferencia = (visitas.get(b.id) || 0) - (visitas.get(a.id) || 0);
        if (diferencia !== 0) return diferencia;
        return String(a.nombre_razon_social || '').localeCompare(String(b.nombre_razon_social || ''), 'es');
      })
      .slice(0, 8)
      .map((cliente) => {
        const propios = vehiculos.filter((vehiculo) => vehiculo.id_cliente === cliente.id);
        const datos = [
          cliente.nit ? `NIT ${cliente.nit}` : '',
          cliente.celular || ''
        ].filter(Boolean).join(' · ');
        return {
          tipo: 'cliente',
          id: cliente.id,
          titulo: cliente.nombre_razon_social || 'Cliente sin nombre',
          subtitulo: datos || 'Sin NIT ni celular registrado',
          extra: `${propios.length} veh.`
        };
      });
  }

  function sugerenciasVehiculos(texto) {
    const vehiculos = Almacen.obtenerVehiculos();
    const clientes = Almacen.obtenerClientes();
    const duenios = new Map(clientes.map((cliente) => [cliente.id, cliente]));
    const buscado = normalizarNombre(texto);

    const lista = vehiculos.filter((vehiculo) => {
      if (!buscado) return true;
      const duenio = duenios.get(vehiculo.id_cliente);
      return normalizarNombre([
        vehiculo.placa,
        vehiculo.marca,
        vehiculo.modelo,
        duenio?.nombre_razon_social
      ].join(' ')).includes(buscado);
    });

    if (estado.idCliente) {
      lista.sort((a, b) => (
        Number(b.id_cliente === estado.idCliente) - Number(a.id_cliente === estado.idCliente)
      ));
    }

    return lista.slice(0, 8).map((vehiculo) => ({
      tipo: 'vehiculo',
      id: vehiculo.id,
      titulo: [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || vehiculo.placa || 'Vehículo',
      subtitulo: [
        vehiculo.placa || 'Sin placa',
        duenios.get(vehiculo.id_cliente)?.nombre_razon_social || 'Sin dueño'
      ].filter(Boolean).join(' · '),
      extra: `${(Number(vehiculo.kilometraje_actual) || 0).toLocaleString('es-BO')} km`
    }));
  }

  function abrirSugerencias(input, tipo, texto) {
    if (!elementos.autocompletar) return;
    const items = tipo === 'cliente' ? sugerenciasClientes(texto) : sugerenciasVehiculos(texto);
    estado.autocompletar.input = input;
    estado.autocompletar.items = items;
    estado.autocompletar.indice = -1;
    estado.autocompletar.tipo = tipo;
    renderizarSugerencias(tipo);
    posicionarAutocompletar(input);
    elementos.autocompletar.classList.remove('oculto');
    estado.autocompletar.abierto = true;
    input.setAttribute('aria-expanded', 'true');
  }

  function renderizarSugerencias(tipo) {
    if (!elementos.autocompletar) return;
    const { items, indice } = estado.autocompletar;
    if (!items.length) {
      elementos.autocompletar.innerHTML = `
        <div class="autocompletar-vacio">
          ${tipo === 'cliente'
            ? 'Sin coincidencias. El cliente se creará al guardar la orden.'
            : 'Sin coincidencias. El vehículo se creará al guardar la orden.'}
        </div>
      `;
      return;
    }

    elementos.autocompletar.innerHTML = items.map((item, posicion) => `
      <button type="button" class="autocompletar-opcion${posicion === indice ? ' activa' : ''}"
        role="option" aria-selected="${posicion === indice}" data-indice="${posicion}">
        <span class="autocompletar-icono">${icono(item.tipo === 'cliente' ? 'usuario' : 'auto')}</span>
        <span class="autocompletar-texto">
          <strong>${escaparHTML(item.titulo)}</strong>
          <small>${escaparHTML(item.subtitulo)}</small>
        </span>
        <span class="autocompletar-tipo">${escaparHTML(item.extra || (item.tipo === 'cliente' ? 'Cliente' : 'Vehículo'))}</span>
      </button>
    `).join('');
  }

  function posicionarAutocompletar(input) {
    if (!elementos.autocompletar) return;
    const rect = input.getBoundingClientRect();
    const ancho = Math.min(Math.max(rect.width, 300), window.innerWidth - 20);
    const izquierda = Math.max(10, Math.min(rect.left, window.innerWidth - ancho - 10));
    const alto = 300;
    const abajo = rect.bottom + 6;
    const arriba = rect.top - alto - 6;
    elementos.autocompletar.style.width = `${ancho}px`;
    elementos.autocompletar.style.left = `${izquierda}px`;
    elementos.autocompletar.style.top = `${abajo + alto > window.innerHeight && rect.top > alto ? arriba : abajo}px`;
  }

  function cerrarAutocompletar() {
    if (!elementos.autocompletar) return;
    elementos.autocompletar.classList.add('oculto');
    elementos.autocompletar.innerHTML = '';
    estado.autocompletar.abierto = false;
    estado.autocompletar.indice = -1;
    estado.autocompletar.items = [];
    estado.autocompletar.input?.setAttribute('aria-expanded', 'false');
    estado.autocompletar.input = null;
  }

  function manejarTeclaAutocompletar(evento) {
    if (!estado.autocompletar.abierto) {
      if (evento.key === 'ArrowDown') {
        abrirSugerencias(evento.target, evento.target.id === 'vehiculo-placa' ? 'vehiculo' : 'cliente', evento.target.value);
        evento.preventDefault();
      }
      return;
    }

    const total = estado.autocompletar.items.length;
    if (evento.key === 'ArrowDown' && total) {
      evento.preventDefault();
      estado.autocompletar.indice = (estado.autocompletar.indice + 1 + total) % total;
      renderizarSugerencias(estado.autocompletar.tipo);
    } else if (evento.key === 'ArrowUp' && total) {
      evento.preventDefault();
      estado.autocompletar.indice = (estado.autocompletar.indice - 1 + total) % total;
      renderizarSugerencias(estado.autocompletar.tipo);
    } else if (evento.key === 'Enter' && estado.autocompletar.indice >= 0) {
      evento.preventDefault();
      seleccionarSugerencia(estado.autocompletar.indice);
    } else if (evento.key === 'Escape') {
      cerrarAutocompletar();
    }
  }

  function seleccionarSugerencia(indice) {
    const item = estado.autocompletar.items[indice];
    if (!item) return;
    cerrarAutocompletar();
    if (item.tipo === 'cliente') {
      const cliente = Almacen.obtenerCliente(item.id);
      if (cliente) aplicarCliente(cliente);
    } else {
      const vehiculo = Almacen.obtenerVehiculo(item.id);
      if (vehiculo) aplicarVehiculo(vehiculo);
    }
  }

  function aplicarCliente(cliente) {
    if (!cliente) return;
    estado.idCliente = cliente.id;
    if (elementos.idCliente) elementos.idCliente.value = cliente.id;
    elementos.clienteNombre.value = cliente.nombre_razon_social || '';
    elementos.clienteNit.value = cliente.nit || '';
    elementos.clienteDireccion.value = cliente.direccion || '';
    elementos.clienteTelefono.value = cliente.telefono || '';
    elementos.clienteCelular.value = cliente.celular || '';

    const vehiculos = Almacen.obtenerVehiculos().filter((vehiculo) => vehiculo.id_cliente === cliente.id);
    const actual = vehiculos.find((vehiculo) => vehiculo.id === estado.idVehiculo);
    if (!actual && estado.idVehiculo) limpiarVehiculo();

    if (vehiculos.length === 1) {
      aplicarVehiculo(vehiculos[0]);
      mostrarToast(`Cliente y vehículo cargados: ${vehiculos[0].placa}.`, 'info');
    } else if (vehiculos.length > 1) {
      if (actual) {
        aplicarVehiculo(actual);
      } else {
        actualizarAvisoVehiculo();
        actualizarRecomendacionesPendientes();
        mostrarToast(`${cliente.nombre_razon_social} tiene ${vehiculos.length} vehículos. Elegí la placa.`, 'info', 5000);
        elementos.vehiculoPlaca.focus();
        abrirSugerencias(elementos.vehiculoPlaca, 'vehiculo', '');
      }
    } else {
      mostrarToast('El cliente no tiene vehículos registrados. Completá los datos del vehículo.', 'info', 5000);
      elementos.vehiculoPlaca.focus();
    }
  }

  function limpiarVehiculo() {
    estado.idVehiculo = '';
    if (elementos.idVehiculo) elementos.idVehiculo.value = '';
    [
      'vehiculoMarca',
      'vehiculoModelo',
      'vehiculoAnio',
      'vehiculoPlaca',
      'vehiculoKilometraje',
      'vehiculoColor',
      'vehiculoBateria',
      'vehiculoMotor',
      'vehiculoVin'
    ].forEach((clave) => {
      if (elementos[clave]) elementos[clave].value = '';
    });
    if (elementos.vehiculoTipo) elementos.vehiculoTipo.value = 'Sedán';
    if (elementos.avisoVehiculo) {
      elementos.avisoVehiculo.classList.add('oculto');
      elementos.avisoVehiculo.innerHTML = '';
    }
    if (elementos.recomendaciones) {
      elementos.recomendaciones.classList.add('oculto');
      elementos.recomendaciones.innerHTML = '';
    }
  }

  function aplicarVehiculo(vehiculo) {
    if (!vehiculo) return;
    cerrarAutocompletar();
    estado.idVehiculo = vehiculo.id;
    if (elementos.idVehiculo) elementos.idVehiculo.value = vehiculo.id;

    if (!estado.idCliente && vehiculo.id_cliente) {
      const cliente = Almacen.obtenerCliente(vehiculo.id_cliente);
      if (cliente) {
        estado.idCliente = cliente.id;
        if (elementos.idCliente) elementos.idCliente.value = cliente.id;
        elementos.clienteNombre.value = cliente.nombre_razon_social || '';
        elementos.clienteNit.value = cliente.nit || '';
        elementos.clienteDireccion.value = cliente.direccion || '';
        elementos.clienteTelefono.value = cliente.telefono || '';
        elementos.clienteCelular.value = cliente.celular || '';
      }
    }

    elementos.vehiculoMarca.value = vehiculo.marca || '';
    elementos.vehiculoModelo.value = vehiculo.modelo || '';
    elementos.vehiculoTipo.value = vehiculo.tipo || 'Sedán';
    elementos.vehiculoAnio.value = vehiculo.anio || '';
    elementos.vehiculoPlaca.value = vehiculo.placa || '';
    elementos.vehiculoKilometraje.value = vehiculo.kilometraje_actual ?? '';
    elementos.vehiculoColor.value = vehiculo.color || '';
    elementos.vehiculoBateria.value = vehiculo.bateria || '';
    elementos.vehiculoMotor.value = vehiculo.nro_motor || '';
    elementos.vehiculoVin.value = vehiculo.vin_chasis || '';

    actualizarAvisoVehiculo();
    actualizarRecomendacionesPendientes();
  }

  function actualizarAvisoVehiculo() {
    if (!elementos.avisoVehiculo) return;
    const placa = normalizarPlaca(elementos.vehiculoPlaca?.value || '');
    const vehiculos = Almacen.obtenerVehiculos();
    let vehiculo = placa ? Almacen.buscarVehiculoEnLista(vehiculos, placa) : null;
    if (!vehiculo && estado.idVehiculo) {
      vehiculo = vehiculos.find((item) => item.id === estado.idVehiculo) || null;
    }

    if (!vehiculo) {
      elementos.avisoVehiculo.classList.add('oculto');
      elementos.avisoVehiculo.innerHTML = '';
      return;
    }

    const cliente = Almacen.obtenerCliente(vehiculo.id_cliente);
    const registros = Historial.registrosDeVehiculo(vehiculo.id);
    const ultimo = registros[0];
    const vinculado = estado.idVehiculo === vehiculo.id;
    const otroDuenio = Boolean(estado.idCliente && vehiculo.id_cliente && vehiculo.id_cliente !== estado.idCliente);
    const nombre = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo';
    const detalle = registros.length
      ? `${registros.length} ${registros.length === 1 ? 'visita' : 'visitas'} · Último servicio ${formatearFecha(ultimo.fecha_entrega || ultimo.fecha_ingreso)}`
      : 'Sin visitas registradas';

    elementos.avisoVehiculo.className = `aviso-vehiculo${otroDuenio ? ' aviso-vehiculo-alerta' : ''}`;
    elementos.avisoVehiculo.innerHTML = `
      <span class="aviso-vehiculo-icono">${icono(otroDuenio ? 'alerta' : 'auto')}</span>
      <span class="aviso-vehiculo-texto">
        <strong>${escaparHTML(vinculado ? `Vehículo conocido: ${nombre} · ${vehiculo.placa}` : `La placa ${vehiculo.placa} ya está registrada`)}</strong>
        <span>${escaparHTML(otroDuenio
          ? `Pertenece a ${cliente?.nombre_razon_social || 'otro cliente'}. Al guardar se pedirá confirmación para reasignarlo.`
          : `${detalle}${cliente ? ` · ${cliente.nombre_razon_social}` : ''}`)}</span>
      </span>
      <span class="aviso-vehiculo-acciones">
        ${vinculado ? '' : '<button type="button" class="btn btn-secundario btn-sm" data-accion="usar-vehiculo">Usar estos datos</button>'}
        <button type="button" class="btn btn-secundario btn-sm" data-accion="ver-historial-rapido" data-vehiculo="${escaparHTML(vehiculo.id)}">Ver historial</button>
      </span>
    `;
    elementos.avisoVehiculo.classList.remove('oculto');
  }

  function actualizarRecomendacionesPendientes() {
    if (!elementos.recomendaciones) return;
    const vehiculo = estado.idVehiculo ? Almacen.obtenerVehiculo(estado.idVehiculo) : null;
    if (!vehiculo) {
      elementos.recomendaciones.classList.add('oculto');
      elementos.recomendaciones.innerHTML = '';
      return;
    }

    const registros = Historial.registrosDeVehiculo(vehiculo.id);
    const pendientes = Historial.calcularEstadoMantenimiento(vehiculo, registros).recomendaciones;
    if (!pendientes.length) {
      elementos.recomendaciones.classList.add('oculto');
      elementos.recomendaciones.innerHTML = '';
      return;
    }

    elementos.recomendaciones.innerHTML = `
      <div class="panel-recomendaciones-cabecera">
        <strong>Recomendaciones pendientes</strong>
        <span>Agregalas como servicio sin costo o marcalas atendidas.</span>
      </div>
      <ul>
        ${pendientes.map((recomendacion) => `
          <li>
            <span>
              ${escaparHTML(recomendacion.descripcion)}
              <span class="badge badge-urgencia badge-urgencia-${recomendacion.urgencia}">${escaparHTML(URGENCIAS_RECOMENDACION[recomendacion.urgencia])}</span>
            </span>
            <span class="panel-recomendaciones-acciones">
              <button type="button" class="btn btn-secundario btn-sm" data-accion="agregar-recomendacion"
                data-historial="${escaparHTML(recomendacion.id_historial)}" data-indice="${recomendacion.indice}">Agregar a la orden</button>
              <button type="button" class="btn btn-secundario btn-sm" data-accion="marcar-recomendacion"
                data-historial="${escaparHTML(recomendacion.id_historial)}" data-indice="${recomendacion.indice}">Marcar atendida</button>
            </span>
          </li>
        `).join('')}
      </ul>
    `;
    elementos.recomendaciones.classList.remove('oculto');
  }

  function abrirHistorialRapido(idVehiculo) {
    const vehiculo = Almacen.obtenerVehiculo(idVehiculo || estado.idVehiculo);
    if (!vehiculo) {
      mostrarToast('No se encontró el vehículo.', 'aviso');
      return;
    }
    const cliente = Almacen.obtenerCliente(vehiculo.id_cliente);
    const registros = Historial.registrosDeVehiculo(vehiculo.id);
    const ultimos = registros.slice(0, 3);
    if (elementos.historialRapidoContenido) {
      elementos.historialRapidoContenido.innerHTML = `
        <div class="historial-rapido-resumen">
          <div><span>Placa</span><strong>${escaparHTML(vehiculo.placa || '—')}</strong></div>
          <div><span>Vehículo</span><strong>${escaparHTML([vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || '—')}</strong></div>
          <div><span>Kilometraje</span><strong>${(Number(vehiculo.kilometraje_actual) || 0).toLocaleString('es-BO')} km</strong></div>
          <div><span>Dueño</span><strong>${escaparHTML(cliente?.nombre_razon_social || 'Sin dueño')}</strong></div>
        </div>
        <h3 class="historial-rapido-titulo">Últimas visitas</h3>
        ${Historial.renderizarLineaTiempo(ultimos, {
          vacio: 'Este vehículo todavía no tiene visitas entregadas.'
        })}
        ${registros.length > ultimos.length
          ? `<p class="texto-suave">Se muestran las últimas ${ultimos.length} de ${registros.length} visitas.</p>`
          : ''}
      `;
    }
    if (elementos.modalHistorialRapido) elementos.modalHistorialRapido.dataset.vehiculo = vehiculo.id;
    Modal.abrir('modal-historial-rapido');
  }

  /* ---------------------------------------------------------
     Servicios dinámicos y total
     --------------------------------------------------------- */
  /** Rellena el datalist con los mecánicos conocidos. */
  function actualizarListaMecanicos() {
    if (!elementos.listaMecanicos) return;
    elementos.listaMecanicos.innerHTML = MECANICOS
      .map((nombre) => `<option value="${escaparHTML(nombre)}"></option>`)
      .join('');
  }

  /** Rellena el datalist con los servicios del catálogo. */
  function actualizarListaServicios() {
    if (!elementos.listaServicios) return;
    const catalogo = [...Almacen.obtenerCatalogo()]
      .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
    elementos.listaServicios.innerHTML = catalogo.map((item) => `
      <option value="${escaparHTML(item.nombre)}" label="${escaparHTML(formatearMoneda(item.importe))}"></option>
    `).join('');
  }

  /** Si el servicio escrito está en el catálogo, completa su importe habitual. */
  function sugerirImporteCatalogo(input) {
    const nombre = input.value.trim();
    if (!nombre) return;
    const item = Almacen.obtenerCatalogo()
      .find((servicio) => normalizarNombre(servicio.nombre) === normalizarNombre(nombre));
    if (!item) return;
    const fila = input.closest('tr');
    const importe = fila?.querySelector('.servicio-importe');
    if (importe && importe.value.trim() === '') {
      importe.value = Number(item.importe) || 0;
      recalcularTotal();
    }
  }

  function agregarFilaServicio(servicio = {}) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td class="celda-servicio">
        <input type="text" class="servicio-nombre" maxlength="120" list="lista-servicios" placeholder="Ej.: Cambio de aceite y filtro"
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

  function agregarFilaRepuesto(repuesto = {}) {
    if (!elementos.cuerpoRepuestos) return null;
    const fila = document.createElement('tr');
    const cantidad = Number(repuesto.cantidad);
    fila.innerHTML = `
      <td class="celda-servicio">
        <input type="text" class="repuesto-nombre" maxlength="120" placeholder="Ej.: Filtro de aceite"
          aria-label="Nombre del repuesto" value="${escaparHTML(repuesto.nombre || '')}">
      </td>
      <td class="celda-servicio celda-cantidad">
        <input type="number" class="repuesto-cantidad" min="1" step="1" inputmode="numeric" placeholder="1"
          aria-label="Cantidad del repuesto" value="${Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1}">
      </td>
      <td class="celda-quitar">
        <button type="button" class="btn-icono btn-icono-sm" data-accion="quitar-repuesto" aria-label="Quitar repuesto" title="Quitar repuesto">${icono('basura')}</button>
      </td>
    `;
    elementos.cuerpoRepuestos.appendChild(fila);
    return fila;
  }

  function agregarFilaRecomendacion(recomendacion = {}) {
    if (!elementos.listaRecomendacionesForm) return null;
    const fila = document.createElement('div');
    fila.className = 'recomendacion-fila';
    const urgencia = URGENCIAS_RECOMENDACION[recomendacion.urgencia] ? recomendacion.urgencia : 'media';
    fila.innerHTML = `
      <input type="text" class="recomendacion-descripcion" maxlength="160" placeholder="Ej.: Cambiar pastillas de freno"
        aria-label="Descripción de la recomendación" value="${escaparHTML(recomendacion.descripcion || '')}">
      <select class="recomendacion-urgencia" aria-label="Urgencia de la recomendación">
        ${Object.entries(URGENCIAS_RECOMENDACION).map(([clave, etiqueta]) => `
          <option value="${clave}"${clave === urgencia ? ' selected' : ''}>${escaparHTML(etiqueta)}</option>
        `).join('')}
      </select>
      <button type="button" class="btn-icono btn-icono-sm" data-accion="quitar-recomendacion" aria-label="Quitar recomendación" title="Quitar recomendación">${icono('basura')}</button>
    `;
    elementos.listaRecomendacionesForm.appendChild(fila);
    actualizarVacioRecomendaciones();
    return fila;
  }

  function actualizarVacioRecomendaciones() {
    if (!elementos.listaRecomendacionesForm) return;
    const vacio = elementos.listaRecomendacionesForm.querySelector('.recomendacion-vacia');
    const hayFilas = Boolean(elementos.listaRecomendacionesForm.querySelector('.recomendacion-fila'));
    if (hayFilas) {
      vacio?.remove();
      return;
    }
    if (!vacio) {
      const mensaje = document.createElement('p');
      mensaje.className = 'recomendacion-vacia';
      mensaje.textContent = 'Sin recomendaciones. Agregá las tareas sugeridas para la próxima visita.';
      elementos.listaRecomendacionesForm.appendChild(mensaje);
    }
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

    const filasRepuesto = elementos.cuerpoRepuestos
      ? Array.from(elementos.cuerpoRepuestos.querySelectorAll('tr')).map((fila) => ({
        fila,
        nombre: fila.querySelector('.repuesto-nombre'),
        cantidad: fila.querySelector('.repuesto-cantidad')
      })).filter((item) => item.nombre && item.nombre.value.trim())
      : [];
    const repuestos = filasRepuesto.map((item) => {
      const cantidad = Number(item.cantidad?.value);
      return {
        nombre: item.nombre.value.trim(),
        cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1
      };
    });

    const filasRecomendacion = elementos.listaRecomendacionesForm
      ? Array.from(elementos.listaRecomendacionesForm.querySelectorAll('.recomendacion-fila')).map((fila) => ({
        fila,
        descripcion: fila.querySelector('.recomendacion-descripcion'),
        urgencia: fila.querySelector('.recomendacion-urgencia')
      })).filter((item) => item.descripcion && item.descripcion.value.trim())
      : [];
    const recomendaciones = filasRecomendacion.map((item) => ({
      descripcion: item.descripcion.value.trim(),
      urgencia: URGENCIAS_RECOMENDACION[item.urgencia?.value] ? item.urgencia.value : 'media',
      atendida: false
    }));

    const numeroOpcional = (elemento) => {
      const valor = elemento?.value?.trim() || '';
      return valor === '' ? '' : Number(valor);
    };

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
      mecanico: elementos.mecanico?.value.trim() || '',
      categoria: CATEGORIAS_TRABAJO[elementos.categoria?.value] ? elementos.categoria.value : 'mantenimiento',
      garantia: {
        dias: numeroOpcional(elementos.garantiaDias),
        km: numeroOpcional(elementos.garantiaKm)
      },
      proximo_servicio: {
        fecha: elementos.proximoFecha?.value || '',
        km: numeroOpcional(elementos.proximoKm),
        descripcion: elementos.proximoDesc?.value.trim() || ''
      },
      repuestos,
      filasRepuesto,
      recomendaciones,
      filasRecomendacion,
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

    if (datos.garantia.dias !== '' && (!Number.isFinite(datos.garantia.dias) || datos.garantia.dias < 0)) {
      agregar(elementos.garantiaDias, 'La garantía en días debe ser un número igual o mayor a cero.');
    }
    if (datos.garantia.km !== '' && (!Number.isFinite(datos.garantia.km) || datos.garantia.km < 0)) {
      agregar(elementos.garantiaKm, 'La garantía en kilómetros debe ser un número igual o mayor a cero.');
    }
    if (datos.proximo_servicio.km !== '' && (!Number.isFinite(datos.proximo_servicio.km) || datos.proximo_servicio.km <= 0)) {
      agregar(elementos.proximoKm, 'El próximo servicio en kilómetros debe ser mayor a cero.');
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
    if (objetivo.classList.contains('servicio-nombre')) sugerirImporteCatalogo(objetivo);
    if (objetivo === elementos.vehiculoPlaca) verificarPlacaConocida();
  }

  function verificarPlacaConocida() {
    actualizarAvisoVehiculo();
  }

  async function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    limpiarErrores();
    const datos = leerFormulario();
    const errores = validarFormulario(datos);
    if (errores.length) {
      mostrarErrores(errores);
      mostrarToast('Faltan datos obligatorios en la orden.', 'error');
      return;
    }
    await guardarOrden(datos);
  }

  /* ---------------------------------------------------------
     Guardar y eliminar
     --------------------------------------------------------- */
  /** Busca un cliente por NIT o celular, sin comparar nombres. */
  function buscarClientePorContacto(clientes, datos) {
    const nit = normalizarDocumento(datos?.nit);
    const celular = normalizarCelular(datos?.celular);
    if (nit) {
      const porNit = clientes.find((cliente) => normalizarDocumento(cliente.nit) === nit);
      if (porNit) return porNit;
    }
    if (celular) {
      const porCelular = clientes.find((cliente) => normalizarCelular(cliente.celular) === celular);
      if (porCelular) return porCelular;
    }
    return null;
  }

  async function guardarOrden(datos) {
    const ordenes = Almacen.obtenerOrdenes();
    const existente = estado.ordenActual
      ? ordenes.find((orden) => orden.numero_ficha === estado.ordenActual)
      : null;
    const numero = existente ? existente.numero_ficha : generarId('OT', ordenes);
    const ahora = aISOlocal(new Date());

    let clientes = Almacen.obtenerClientes();
    let vehiculos = Almacen.obtenerVehiculos();

    /* 1. Resolver el cliente: por id, por NIT/celular o creando uno nuevo. */
    let cliente = estado.idCliente
      ? clientes.find((item) => item.id === estado.idCliente)
      : null;
    if (!cliente) cliente = buscarClientePorContacto(clientes, datos.cliente);

    if (cliente) {
      const actualizado = {
        ...cliente,
        nombre_razon_social: datos.cliente.nombre_razon_social || cliente.nombre_razon_social,
        nit: datos.cliente.nit || cliente.nit || '',
        direccion: datos.cliente.direccion || cliente.direccion || '',
        telefono: datos.cliente.telefono || cliente.telefono || '',
        celular: datos.cliente.celular || cliente.celular || ''
      };
      clientes = clientes.map((item) => (item.id === cliente.id ? actualizado : item));
      cliente = actualizado;
    } else {
      cliente = Almacen.crearClienteDesdeDatos(datos.cliente, clientes);
      clientes = [...clientes, cliente];
    }

    /* 2. Resolver el vehículo por id o por placa. */
    let vehiculo = estado.idVehiculo
      ? vehiculos.find((item) => item.id === estado.idVehiculo)
      : null;
    if (!vehiculo) vehiculo = Almacen.buscarVehiculoEnLista(vehiculos, datos.vehiculo.placa);

    if (vehiculo && vehiculo.id_cliente !== cliente.id) {
      const duenio = Almacen.obtenerCliente(vehiculo.id_cliente);
      const confirmado = await confirmarAccion({
        titulo: 'Placa registrada con otro dueño',
        mensaje: `La placa ${datos.vehiculo.placa} figura a nombre de ${duenio?.nombre_razon_social || 'otro cliente'}. ¿Reasignar el vehículo a ${cliente.nombre_razon_social}? El historial anterior se conserva como copia fija.`,
        textoAceptar: 'Reasignar y guardar',
        peligro: false
      });
      if (!confirmado) return;
    }

    const km = Number(datos.vehiculo.kilometraje);
    const kmAnterior = Number(vehiculo?.kilometraje_actual) || 0;
    if (vehiculo && Number.isFinite(km) && km < kmAnterior) {
      const confirmado = await confirmarAccion({
        titulo: 'Kilometraje menor al registrado',
        mensaje: `El kilometraje ingresado (${km.toLocaleString('es-BO')} km) es menor al último registrado (${kmAnterior.toLocaleString('es-BO')} km). ¿Guardar la orden de todos modos?`,
        textoAceptar: 'Guardar igual',
        peligro: false
      });
      if (!confirmado) return;
    }

    if (vehiculo) {
      const actualizado = {
        ...vehiculo,
        id_cliente: cliente.id,
        placa: datos.vehiculo.placa || vehiculo.placa,
        marca: datos.vehiculo.marca || vehiculo.marca,
        modelo: datos.vehiculo.modelo || vehiculo.modelo,
        tipo: datos.vehiculo.tipo || vehiculo.tipo,
        anio: datos.vehiculo.anio === '' ? vehiculo.anio : datos.vehiculo.anio,
        color: datos.vehiculo.color || vehiculo.color,
        kilometraje_actual: Math.max(Number.isFinite(km) ? km : 0, kmAnterior),
        nro_motor: datos.vehiculo.nro_motor || vehiculo.nro_motor,
        vin_chasis: datos.vehiculo.vin_chasis || vehiculo.vin_chasis,
        bateria: datos.vehiculo.bateria || vehiculo.bateria
      };
      vehiculos = vehiculos.map((item) => (item.id === vehiculo.id ? actualizado : item));
      vehiculo = actualizado;
    } else {
      vehiculo = Almacen.crearVehiculoDesdeDatos(datos.vehiculo, cliente.id, vehiculos);
      vehiculos = [...vehiculos, vehiculo];
    }

    const resultadoClientes = Almacen.guardarClientes(clientes);
    if (!resultadoClientes.ok) {
      mostrarToast(Almacen.mensajeDeError(resultadoClientes), 'error', 6500);
      return;
    }
    const resultadoVehiculos = Almacen.guardarVehiculos(vehiculos);
    if (!resultadoVehiculos.ok) {
      mostrarToast(Almacen.mensajeDeError(resultadoVehiculos), 'error', 6500);
      return;
    }

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
      id_cliente: cliente.id,
      id_vehiculo: vehiculo.id,
      cliente: { ...datos.cliente },
      vehiculo: { ...datos.vehiculo },
      servicios,
      total,
      estado: datos.estado,
      notas: datos.notas,
      mecanico: datos.mecanico,
      categoria: datos.categoria,
      repuestos: datos.repuestos,
      garantia: {
        dias: Number(datos.garantia.dias) || 0,
        km: Number(datos.garantia.km) || 0
      },
      proximo_servicio: {
        fecha: datos.proximo_servicio.fecha,
        km: datos.proximo_servicio.km === '' ? '' : Number(datos.proximo_servicio.km),
        descripcion: datos.proximo_servicio.descripcion
      },
      recomendaciones: datos.recomendaciones,
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
    estado.idCliente = cliente.id;
    estado.idVehiculo = vehiculo.id;

    elementos.original.value = numero;
    elementos.ficha.value = numero;
    elementos.idCliente.value = cliente.id;
    elementos.idVehiculo.value = vehiculo.id;
    elementos.tituloForm.textContent = `Orden ${numero}`;
    elementos.migaForm.textContent = `Órdenes / ${numero}`;
    actualizarBotonesFormulario();
    recalcularTotal();
    renderizarGaleria();
    actualizarAvisoVehiculo();
    actualizarRecomendacionesPendientes();
    registrarServiciosEnCatalogo(servicios);
    actualizarListaServicios();

    const sincronizacion = Almacen.sincronizarHistorialOrden(orden);
    if (!sincronizacion.ok) {
      mostrarToast('La orden se guardó, pero no se pudo actualizar el historial.', 'aviso', 6000);
    } else {
      window.dispatchEvent(new CustomEvent('historial:actualizado'));
    }

    if (window.establecerTituloApp) {
      window.establecerTituloApp(`Orden ${numero}`, `Operación / Órdenes de trabajo / ${numero}`);
    }
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();

    mostrarToast(
      existente ? `Orden ${numero} actualizada correctamente.` : `Orden ${numero} creada correctamente.`,
      'exito'
    );
    if (sincronizacion.creado) {
      mostrarToast(`Visita registrada en el historial de ${vehiculo.placa}.`, 'info', 5000);
    }
  }

  /** Agrega al catálogo los servicios nuevos escritos en una orden. */
  function registrarServiciosEnCatalogo(servicios) {
    const catalogo = Almacen.obtenerCatalogo();
    let cambios = false;
    servicios.forEach((servicio) => {
      if (!servicio.nombre) return;
      const existente = catalogo.find((item) => normalizarNombre(item.nombre) === normalizarNombre(servicio.nombre));
      if (existente) {
        if (Number(servicio.importe) > 0 && Number(existente.importe) !== Number(servicio.importe)) {
          existente.importe = Number(servicio.importe);
          cambios = true;
        }
      } else {
        catalogo.push({ nombre: servicio.nombre, importe: Number(servicio.importe) || 0 });
        cambios = true;
      }
    });
    if (cambios) Almacen.guardarCatalogo(catalogo);
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

    const repuestos = (orden.repuestos || []).map((repuesto) => `
      <tr>
        <td>${escaparHTML(repuesto.nombre)}</td>
        <td class="impreso-der">${Number(repuesto.cantidad) || 1}</td>
      </tr>
    `).join('');

    const garantia = orden.garantia && typeof orden.garantia === 'object' ? orden.garantia : {};
    const garantiaPartes = [
      Number(garantia.dias) > 0 ? `${Number(garantia.dias)} días` : '',
      Number(garantia.km) > 0 ? `${Number(garantia.km).toLocaleString('es-BO')} km` : ''
    ].filter(Boolean);
    const proximo = orden.proximo_servicio && typeof orden.proximo_servicio === 'object' ? orden.proximo_servicio : {};
    const proximoPartes = [
      proximo.fecha ? formatearFecha(proximo.fecha) : '',
      Number(proximo.km) > 0 ? `${Number(proximo.km).toLocaleString('es-BO')} km` : ''
    ].filter(Boolean);
    const recomendaciones = (orden.recomendaciones || [])
      .filter((item) => item && item.descripcion)
      .map((item) => `<li>${escaparHTML(item.descripcion)} <span class="impreso-urgencia">${escaparHTML(URGENCIAS_RECOMENDACION[item.urgencia] || 'Media')}</span></li>`)
      .join('');

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

        ${repuestos ? `
        <section class="impreso-bloque">
          <h2>Repuestos utilizados</h2>
          <table class="impreso-tabla">
            <thead><tr><th>Repuesto</th><th class="impreso-der">Cantidad</th></tr></thead>
            <tbody>${repuestos}</tbody>
          </table>
        </section>` : ''}

        ${(orden.mecanico || orden.categoria || garantiaPartes.length || proximoPartes.length || recomendaciones) ? `
        <section class="impreso-bloque">
          <h2>Trabajo y seguimiento</h2>
          <div class="impreso-datos">
            <p><span>Mecánico asignado</span><strong>${escaparHTML(orden.mecanico || 'Sin asignar')}</strong></p>
            <p><span>Categoría</span><strong>${escaparHTML(CATEGORIAS_TRABAJO[orden.categoria] || 'Mantenimiento')}</strong></p>
            <p><span>Garantía</span><strong>${escaparHTML(garantiaPartes.join(' · ') || 'Sin garantía')}</strong></p>
            <p><span>Próximo servicio</span><strong>${escaparHTML([proximoPartes.join(' · '), proximo.descripcion].filter(Boolean).join(' — ') || 'Sin programar')}</strong></p>
          </div>
          ${recomendaciones ? `<div class="impreso-recomendaciones"><span>Recomendaciones</span><ul>${recomendaciones}</ul></div>` : ''}
        </section>` : ''}

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

  /** Abre una orden nueva con cliente y/o vehículo precargados. */
  function nuevaPara(idCliente = '', idVehiculo = '') {
    if (window.mostrarVista) window.mostrarVista('ordenes');
    abrirFormulario();
    const cliente = idCliente
      ? Almacen.obtenerCliente(idCliente)
      : (idVehiculo ? Almacen.obtenerCliente(Almacen.obtenerVehiculo(idVehiculo)?.id_cliente) : null);
    if (cliente) aplicarCliente(cliente);
    if (idVehiculo) {
      const vehiculo = Almacen.obtenerVehiculo(idVehiculo);
      if (vehiculo) aplicarVehiculo(vehiculo);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return {
    iniciar,
    recargar,
    mostrarListado,
    abrirOrden: abrirFormulario,
    imprimirOrden,
    abrirWhatsApp: abrirWhatsAppOrden,
    nuevaPara
  };
})();

/* Se expone en window para que el arranque de index.html pueda usarlo. */
window.Ordenes = Ordenes;
