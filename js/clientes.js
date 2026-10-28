'use strict';

/* =========================================================
   MÓDULO DE CLIENTES Y VEHÍCULOS
   Listado, fichas, carnet de servicio y CRUD. Reutiliza el
   historial y los componentes visuales del resto de la app.
   ========================================================= */

const Clientes = (() => {
  const LIMITE_INICIAL = 10;

  const estado = {
    iniciado: false,
    vista: 'listado', // listado | cliente | vehiculo
    modoListado: 'clientes', // clientes | vehiculos
    busqueda: '',
    ordenColumna: 'ultima',
    ordenDireccion: 'desc',
    idCliente: null,
    idVehiculo: null,
    limiteCliente: LIMITE_INICIAL,
    limiteVehiculo: LIMITE_INICIAL
  };

  const elementos = {};

  /* ---------------------------------------------------------
     Arranque y navegación
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;

    elementos.listado = document.getElementById('clientes-listado');
    elementos.fichaCliente = document.getElementById('clientes-ficha');
    elementos.fichaVehiculo = document.getElementById('vehiculo-ficha');
    elementos.resumen = document.getElementById('clientes-resumen');
    elementos.buscar = document.getElementById('buscar-clientes');
    elementos.conteo = document.getElementById('clientes-conteo');
    elementos.tabla = document.getElementById('clientes-tabla');

    conectarEventos();
    renderizarListado();
  }

  function conectarEventos() {
    document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => abrirModalCliente());
    document.getElementById('btn-nuevo-vehiculo')?.addEventListener('click', () => abrirModalVehiculo());

    elementos.buscar?.addEventListener('input', () => {
      estado.busqueda = elementos.buscar.value;
      renderizarListado();
    });

    document.querySelectorAll('[data-modo-listado]').forEach((boton) => {
      boton.addEventListener('click', () => {
        estado.modoListado = boton.dataset.modoListado === 'vehiculos' ? 'vehiculos' : 'clientes';
        estado.ordenColumna = estado.modoListado === 'vehiculos' ? 'ultima' : 'ultima';
        estado.ordenDireccion = 'desc';
        actualizarBotonesModo();
        renderizarListado();
      });
    });

    document.getElementById('vista-clientes')?.addEventListener('click', manejarClicVista);
    document.getElementById('form-cliente')?.addEventListener('submit', guardarCliente);
    document.getElementById('form-vehiculo')?.addEventListener('submit', guardarVehiculo);

    window.addEventListener('historial:actualizado', () => {
      if (estado.vista === 'cliente') renderizarFichaCliente();
      else if (estado.vista === 'vehiculo') renderizarFichaVehiculo();
      else renderizarListado();
    });
  }

  function actualizarBotonesModo() {
    document.querySelectorAll('[data-modo-listado]').forEach((boton) => {
      boton.classList.toggle('activo', boton.dataset.modoListado === estado.modoListado);
    });
  }

  function mostrarListado() {
    estado.vista = 'listado';
    estado.idCliente = null;
    estado.idVehiculo = null;
    elementos.listado?.classList.remove('oculto');
    elementos.fichaCliente?.classList.add('oculto');
    elementos.fichaVehiculo?.classList.add('oculto');
    renderizarListado();
    if (window.establecerTituloApp) {
      window.establecerTituloApp('Clientes y vehículos', 'Relaciones / Clientes');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirCliente(id) {
    const cliente = Almacen.obtenerCliente(id);
    if (!cliente) {
      mostrarToast('No se encontró el cliente.', 'error');
      mostrarListado();
      return;
    }
    estado.vista = 'cliente';
    estado.idCliente = id;
    estado.idVehiculo = null;
    estado.limiteCliente = LIMITE_INICIAL;
    elementos.listado?.classList.add('oculto');
    elementos.fichaCliente?.classList.remove('oculto');
    elementos.fichaVehiculo?.classList.add('oculto');
    renderizarFichaCliente();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirVehiculo(id) {
    const vehiculo = Almacen.obtenerVehiculo(id);
    if (!vehiculo) {
      mostrarToast('No se encontró el vehículo.', 'error');
      mostrarListado();
      return;
    }
    estado.vista = 'vehiculo';
    estado.idVehiculo = id;
    estado.idCliente = vehiculo.id_cliente || null;
    estado.limiteVehiculo = LIMITE_INICIAL;
    elementos.listado?.classList.add('oculto');
    elementos.fichaCliente?.classList.add('oculto');
    elementos.fichaVehiculo?.classList.remove('oculto');
    renderizarFichaVehiculo();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------
     Datos calculados para listados
     --------------------------------------------------------- */
  function agruparHistorial(historial) {
    const porCliente = new Map();
    const porVehiculo = new Map();
    historial.forEach((registro) => {
      if (registro.id_cliente) {
        if (!porCliente.has(registro.id_cliente)) porCliente.set(registro.id_cliente, []);
        porCliente.get(registro.id_cliente).push(registro);
      }
      if (registro.id_vehiculo) {
        if (!porVehiculo.has(registro.id_vehiculo)) porVehiculo.set(registro.id_vehiculo, []);
        porVehiculo.get(registro.id_vehiculo).push(registro);
      }
    });

    /* Las tarjetas usan el primer registro como "último servicio":
       se ordena cada grupo de más reciente a más antiguo. */
    const ordenarDesc = (registros) => registros.sort((a, b) => {
      const claveA = String(a.fecha_ingreso || a.fecha_entrega || '');
      const claveB = String(b.fecha_ingreso || b.fecha_entrega || '');
      return claveB.localeCompare(claveA);
    });
    porCliente.forEach(ordenarDesc);
    porVehiculo.forEach(ordenarDesc);

    return { porCliente, porVehiculo };
  }

  function ultimaVisita(registros) {
    return registros.reduce((ultima, registro) => {
      const fecha = registro.fecha_entrega || registro.fecha_ingreso || '';
      return fecha > ultima ? fecha : ultima;
    }, '');
  }

  function construirFilasClientes() {
    const clientes = Almacen.obtenerClientes();
    const vehiculos = Almacen.obtenerVehiculos();
    const historial = Almacen.obtenerHistorial();
    const { porCliente } = agruparHistorial(historial);

    return clientes.map((cliente) => {
      const propios = porCliente.get(cliente.id) || [];
      const visitas = propios.length;
      const total = propios.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0);
      return {
        id: cliente.id,
        nombre: cliente.nombre_razon_social || 'Cliente sin nombre',
        nit: cliente.nit || '',
        celular: cliente.celular || cliente.telefono || '',
        vehiculos: vehiculos.filter((vehiculo) => vehiculo.id_cliente === cliente.id).length,
        visitas,
        ultima: ultimaVisita(propios),
        total,
        etiquetas: etiquetasCliente(visitas, ultimaVisita(propios))
      };
    });
  }

  function construirFilasVehiculos() {
    const clientes = Almacen.obtenerClientes();
    const vehiculos = Almacen.obtenerVehiculos();
    const historial = Almacen.obtenerHistorial();
    const { porVehiculo } = agruparHistorial(historial);
    const clientesPorId = new Map(clientes.map((cliente) => [cliente.id, cliente]));

    return vehiculos.map((vehiculo) => {
      const propios = porVehiculo.get(vehiculo.id) || [];
      const cliente = clientesPorId.get(vehiculo.id_cliente);
      return {
        id: vehiculo.id,
        placa: vehiculo.placa || '—',
        vehiculo: [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin datos',
        detalle: [vehiculo.anio, vehiculo.color].filter(Boolean).join(' · '),
        duenio: cliente?.nombre_razon_social || 'Sin dueño asignado',
        idCliente: cliente?.id || '',
        kilometraje: Number(vehiculo.kilometraje_actual) || 0,
        visitas: propios.length,
        ultima: ultimaVisita(propios)
      };
    });
  }

  function etiquetasCliente(visitas, ultima) {
    const etiquetas = [];
    if (visitas >= 3) etiquetas.push({ texto: 'Frecuente', clase: 'etiqueta-frecuente' });
    else if (visitas === 1) etiquetas.push({ texto: 'Nuevo', clase: 'etiqueta-nuevo' });
    else if (visitas === 0) etiquetas.push({ texto: 'Sin visitas', clase: 'etiqueta-neutra' });

    if (ultima) {
      const fecha = parsearFechaHora(ultima);
      if (fecha) {
        const meses = (new Date().getFullYear() - fecha.getFullYear()) * 12
          + (new Date().getMonth() - fecha.getMonth());
        if (meses >= 12) etiquetas.push({ texto: 'Inactivo', clase: 'etiqueta-inactivo' });
      }
    }
    return etiquetas;
  }

  function etiquetasHTML(etiquetas) {
    if (!etiquetas.length) return '<span class="texto-suave">—</span>';
    return etiquetas.map((etiqueta) => (
      `<span class="badge ${etiqueta.clase}">${escaparHTML(etiqueta.texto)}</span>`
    )).join('');
  }

  function filtrarFilas(filas) {
    const buscado = normalizarNombre(estado.busqueda).trim();
    if (!buscado) return filas;
    return filas.filter((fila) => {
      const campos = estado.modoListado === 'vehiculos'
        ? [fila.placa, fila.vehiculo, fila.detalle, fila.duenio]
        : [fila.nombre, fila.nit, fila.celular];
      return normalizarNombre(campos.join(' ')).includes(buscado);
    });
  }

  function ordenarFilas(filas) {
    const direccion = estado.ordenDireccion === 'asc' ? 1 : -1;
    return [...filas].sort((a, b) => {
      const valorA = a[estado.ordenColumna];
      const valorB = b[estado.ordenColumna];
      if (typeof valorA === 'number' && typeof valorB === 'number') {
        return (valorA - valorB) * direccion;
      }
      return String(valorA ?? '').localeCompare(String(valorB ?? ''), 'es', { numeric: true }) * direccion;
    });
  }

  /* ---------------------------------------------------------
     Listado
     --------------------------------------------------------- */
  function encabezadoOrdenable(columna, texto, clase = '') {
    const activa = estado.ordenColumna === columna;
    const flecha = activa ? (estado.ordenDireccion === 'asc' ? '↑' : '↓') : '↕';
    return `
      <th class="${clase}" aria-sort="${activa ? (estado.ordenDireccion === 'asc' ? 'ascending' : 'descending') : 'none'}">
        <button type="button" class="th-orden" data-ordenar="${columna}">${escaparHTML(texto)} <span aria-hidden="true">${flecha}</span></button>
      </th>
    `;
  }

  function renderizarResumen() {
    if (!elementos.resumen) return;
    const clientes = Almacen.obtenerClientes();
    const vehiculos = Almacen.obtenerVehiculos();
    const historial = Almacen.obtenerHistorial();
    const ingresos = historial.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0);
    const tarjetas = [
      { valor: clientes.length, etiqueta: 'Clientes', detalle: 'Fichas registradas', icono: 'usuarios', clase: 'estadistica-azul' },
      { valor: vehiculos.length, etiqueta: 'Vehículos', detalle: 'Unidades en cartera', icono: 'auto', clase: 'estadistica-naranja' },
      { valor: historial.length, etiqueta: 'Visitas', detalle: 'Trabajos entregados', icono: 'historial', clase: 'estadistica-amarilla' },
      { valor: formatearMoneda(ingresos), etiqueta: 'Ingresos históricos', detalle: 'Suma de visitas', icono: 'moneda', clase: 'estadistica-verde' }
    ];
    elementos.resumen.innerHTML = tarjetas.map((tarjeta) => `
      <div class="tarjeta estadistica ${tarjeta.clase}">
        <span class="estadistica-icono">${icono(tarjeta.icono)}</span>
        <span class="estadistica-datos">
          <strong>${escaparHTML(tarjeta.valor)}</strong>
          <span>${escaparHTML(tarjeta.etiqueta)}</span>
          <small>${escaparHTML(tarjeta.detalle)}</small>
        </span>
      </div>
    `).join('');
  }

  function filaClienteHTML(fila) {
    return `
      <tr data-accion="abrir-cliente" data-cliente="${escaparHTML(fila.id)}">
        <td data-etiqueta="Cliente">
          <span class="celda-cliente">${escaparHTML(fila.nombre)}</span>
          <span class="celda-sub">${fila.nit ? `NIT ${escaparHTML(fila.nit)}` : 'Sin NIT registrado'}</span>
        </td>
        <td data-etiqueta="Celular">${escaparHTML(fila.celular || '—')}</td>
        <td data-etiqueta="Vehículos" class="columna-numero">${fila.vehiculos}</td>
        <td data-etiqueta="Visitas" class="columna-numero">${fila.visitas}</td>
        <td data-etiqueta="Última visita">${fila.ultima ? formatearFecha(fila.ultima) : '—'}</td>
        <td data-etiqueta="Total gastado" class="columna-total">${formatearMoneda(fila.total)}</td>
        <td data-etiqueta="Etiquetas"><div class="ficha-etiquetas">${etiquetasHTML(fila.etiquetas)}</div></td>
        <td class="columna-acciones">
          <button type="button" class="btn-icono btn-icono-sm" data-accion="abrir-cliente" data-cliente="${escaparHTML(fila.id)}" aria-label="Ver ficha de ${escaparHTML(fila.nombre)}" title="Ver ficha">${icono('usuario')}</button>
          <button type="button" class="btn-icono btn-icono-sm" data-accion="editar-cliente" data-cliente="${escaparHTML(fila.id)}" aria-label="Editar ${escaparHTML(fila.nombre)}" title="Editar cliente">${icono('editar')}</button>
          <button type="button" class="btn-icono btn-icono-sm" data-accion="nueva-orden-cliente" data-cliente="${escaparHTML(fila.id)}" aria-label="Nueva orden para ${escaparHTML(fila.nombre)}" title="Nueva orden">${icono('ordenes')}</button>
        </td>
      </tr>
    `;
  }

  function filaVehiculoHTML(fila) {
    return `
      <tr data-accion="abrir-vehiculo" data-vehiculo="${escaparHTML(fila.id)}">
        <td data-etiqueta="Placa"><span class="placa-chip">${escaparHTML(fila.placa)}</span></td>
        <td data-etiqueta="Vehículo">
          <span class="celda-vehiculo">${escaparHTML(fila.vehiculo)}</span>
          <span class="celda-sub">${escaparHTML(fila.detalle || 'Sin detalles')}</span>
        </td>
        <td data-etiqueta="Dueño">${escaparHTML(fila.duenio)}</td>
        <td data-etiqueta="Kilometraje" class="columna-numero">${fila.kilometraje.toLocaleString('es-BO')} km</td>
        <td data-etiqueta="Visitas" class="columna-numero">${fila.visitas}</td>
        <td data-etiqueta="Último servicio">${fila.ultima ? formatearFecha(fila.ultima) : '—'}</td>
        <td class="columna-acciones">
          <button type="button" class="btn-icono btn-icono-sm" data-accion="abrir-vehiculo" data-vehiculo="${escaparHTML(fila.id)}" aria-label="Ver carnet de ${escaparHTML(fila.placa)}" title="Ver carnet">${icono('auto')}</button>
          <button type="button" class="btn-icono btn-icono-sm" data-accion="editar-vehiculo" data-vehiculo="${escaparHTML(fila.id)}" aria-label="Editar ${escaparHTML(fila.placa)}" title="Editar vehículo">${icono('editar')}</button>
          <button type="button" class="btn-icono btn-icono-sm" data-accion="nueva-orden-vehiculo" data-vehiculo="${escaparHTML(fila.id)}" aria-label="Nueva orden para ${escaparHTML(fila.placa)}" title="Nueva orden">${icono('ordenes')}</button>
        </td>
      </tr>
    `;
  }

  function renderizarTablaClientes() {
    const filas = ordenarFilas(filtrarFilas(construirFilasClientes()));
    const total = Almacen.obtenerClientes().length;
    const hayFiltro = Boolean(estado.busqueda.trim());

    elementos.conteo.textContent = !total
      ? 'Sin clientes registrados'
      : hayFiltro
        ? `${filas.length} de ${total} clientes`
        : `${total} ${total === 1 ? 'cliente' : 'clientes'}`;

    if (!filas.length) {
      elementos.tabla.innerHTML = estadoVacioHTML(
        hayFiltro ? 'No hay clientes con esa búsqueda' : 'Todavía no hay clientes registrados',
        hayFiltro ? 'Probá con otro nombre, NIT, celular o placa.' : 'Creá el primer cliente para empezar a registrar vehículos y visitas.',
        hayFiltro ? '' : '<button type="button" class="btn btn-primario" data-accion="nuevo-cliente">Nuevo cliente</button>'
      );
      return;
    }

    elementos.tabla.innerHTML = `
      <table class="tabla-clientes">
        <thead>
          <tr>
            ${encabezadoOrdenable('nombre', 'Cliente')}
            ${encabezadoOrdenable('celular', 'Celular')}
            ${encabezadoOrdenable('vehiculos', 'Vehículos', 'columna-numero')}
            ${encabezadoOrdenable('visitas', 'Visitas', 'columna-numero')}
            ${encabezadoOrdenable('ultima', 'Última visita')}
            ${encabezadoOrdenable('total', 'Total gastado', 'columna-total')}
            <th>Etiquetas</th>
            <th class="columna-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>${filas.map(filaClienteHTML).join('')}</tbody>
      </table>
    `;
  }

  function renderizarTablaVehiculos() {
    const filas = ordenarFilas(filtrarFilas(construirFilasVehiculos()));
    const total = Almacen.obtenerVehiculos().length;
    const hayFiltro = Boolean(estado.busqueda.trim());

    elementos.conteo.textContent = !total
      ? 'Sin vehículos registrados'
      : hayFiltro
        ? `${filas.length} de ${total} vehículos`
        : `${total} ${total === 1 ? 'vehículo' : 'vehículos'}`;

    if (!filas.length) {
      elementos.tabla.innerHTML = estadoVacioHTML(
        hayFiltro ? 'No hay vehículos con esa búsqueda' : 'Todavía no hay vehículos registrados',
        hayFiltro ? 'Probá con otra placa, marca, modelo o cliente.' : 'Agregá un vehículo desde la ficha de un cliente o con el botón superior.',
        hayFiltro ? '' : '<button type="button" class="btn btn-primario" data-accion="nuevo-vehiculo">Nuevo vehículo</button>'
      );
      return;
    }

    elementos.tabla.innerHTML = `
      <table class="tabla-clientes">
        <thead>
          <tr>
            ${encabezadoOrdenable('placa', 'Placa')}
            ${encabezadoOrdenable('vehiculo', 'Vehículo')}
            ${encabezadoOrdenable('duenio', 'Dueño')}
            ${encabezadoOrdenable('kilometraje', 'Kilometraje', 'columna-numero')}
            ${encabezadoOrdenable('visitas', 'Visitas', 'columna-numero')}
            ${encabezadoOrdenable('ultima', 'Último servicio')}
            <th class="columna-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>${filas.map(filaVehiculoHTML).join('')}</tbody>
      </table>
    `;
  }

  function estadoVacioHTML(titulo, descripcion, accion = '') {
    return `
      <div class="estado-vacio">
        <div class="estado-vacio-icono">${estado.modoListado === 'vehiculos' ? icono('auto') : icono('usuarios')}</div>
        <h3>${escaparHTML(titulo)}</h3>
        <p>${escaparHTML(descripcion)}</p>
        ${accion}
      </div>
    `;
  }

  function renderizarListado() {
    actualizarBotonesModo();
    renderizarResumen();
    if (estado.modoListado === 'vehiculos') renderizarTablaVehiculos();
    else renderizarTablaClientes();
  }

  /* ---------------------------------------------------------
     Ficha del cliente
     --------------------------------------------------------- */
  function datoHTML(etiqueta, valor, ancho = false) {
    return `
      <div class="dato${ancho ? ' dato-ancho' : ''}">
        <dt>${escaparHTML(etiqueta)}</dt>
        <dd>${valor || '<span class="texto-suave">—</span>'}</dd>
      </div>
    `;
  }

  function resumenClienteHTML(registros) {
    const total = registros.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0);
    const ticket = registros.length ? total / registros.length : 0;
    const primera = registros.length ? registros[registros.length - 1].fecha_ingreso : '';
    const ultima = registros.length ? registros[0].fecha_entrega || registros[0].fecha_ingreso : '';
    const tarjetas = [
      { valor: registros.length, etiqueta: 'Visitas', detalle: 'Trabajos entregados', icono: 'historial' },
      { valor: formatearMoneda(total), etiqueta: 'Total gastado', detalle: 'En toda la relación', icono: 'moneda' },
      { valor: formatearMoneda(ticket), etiqueta: 'Ticket promedio', detalle: 'Por visita', icono: 'recibo' },
      { valor: primera ? formatearFecha(primera) : '—', etiqueta: 'Primera visita', detalle: ultima ? `Última: ${formatearFecha(ultima)}` : 'Sin visitas', icono: 'calendario' }
    ];
    return `
      <div class="ficha-resumen">
        ${tarjetas.map((tarjeta) => `
          <div class="tarjeta ficha-resumen-item">
            <span class="ficha-resumen-icono">${icono(tarjeta.icono)}</span>
            <span class="ficha-resumen-datos">
              <strong>${escaparHTML(tarjeta.valor)}</strong>
              <span>${escaparHTML(tarjeta.etiqueta)}</span>
              <small>${escaparHTML(tarjeta.detalle)}</small>
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function vehiculoCardHTML(vehiculo, registros) {
    const km = Number(vehiculo.kilometraje_actual) || 0;
    const ultima = registros[0];
    const nombre = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin datos';
    return `
      <button type="button" class="tarjeta vehiculo-card" data-accion="abrir-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">
        <span class="vehiculo-card-superior">
          <span class="placa-chip">${escaparHTML(vehiculo.placa || '—')}</span>
          <span class="vehiculo-card-visitas">${registros.length} ${registros.length === 1 ? 'visita' : 'visitas'}</span>
        </span>
        <strong class="vehiculo-card-nombre">${escaparHTML(nombre)}</strong>
        <span class="vehiculo-card-detalle">${escaparHTML([vehiculo.anio, vehiculo.color].filter(Boolean).join(' · ') || 'Sin año ni color')}</span>
        <span class="vehiculo-card-km">${km.toLocaleString('es-BO')} km</span>
        <span class="vehiculo-card-pie">
          <span>${ultima ? `Último servicio: ${formatearFecha(ultima.fecha_entrega || ultima.fecha_ingreso)}` : 'Sin servicios registrados'}</span>
          <span class="vehiculo-card-enlace">Ver carnet →</span>
        </span>
      </button>
    `;
  }

  function renderizarFichaCliente() {
    const cliente = Almacen.obtenerCliente(estado.idCliente);
    if (!cliente) {
      mostrarListado();
      return;
    }
    const registros = Historial.registrosDeCliente(cliente.id);
    const vehiculos = Almacen.obtenerVehiculos().filter((vehiculo) => vehiculo.id_cliente === cliente.id);
    const { porVehiculo } = agruparHistorial(Almacen.obtenerHistorial());
    const etiquetas = etiquetasCliente(registros.length, registros[0]?.fecha_entrega || registros[0]?.fecha_ingreso || '');
    const visibles = registros.slice(0, estado.limiteCliente);
    const restantes = Math.max(0, registros.length - visibles.length);

    const tarjetasVehiculos = vehiculos.length
      ? vehiculos.map((vehiculo) => vehiculoCardHTML(vehiculo, porVehiculo.get(vehiculo.id) || [])).join('')
      : `
        <div class="vehiculos-vacio">
          <p>Este cliente todavía no tiene vehículos registrados.</p>
          <button type="button" class="btn btn-secundario" data-accion="nuevo-vehiculo-cliente" data-cliente="${escaparHTML(cliente.id)}">＋ Agregar vehículo</button>
        </div>
      `;

    elementos.fichaCliente.innerHTML = `
      <div class="ficha-cabecera">
        <button type="button" class="btn-icono btn-volver" data-accion="volver-clientes" aria-label="Volver al listado">${icono('volver')}</button>
        <div class="ficha-cabecera-texto">
          <p class="seccion-etiqueta">Clientes / Ficha</p>
          <h2>${escaparHTML(cliente.nombre_razon_social)}</h2>
          <div class="ficha-etiquetas">${etiquetasHTML(etiquetas)}</div>
        </div>
        <div class="ficha-acciones">
          <button type="button" class="btn btn-secundario" data-accion="editar-cliente" data-cliente="${escaparHTML(cliente.id)}">${icono('editar')} Editar</button>
          <button type="button" class="btn btn-secundario" data-accion="agendar-cliente" data-cliente="${escaparHTML(cliente.id)}">${icono('calendario')} Agendar cita</button>
          <button type="button" class="btn btn-whatsapp" data-accion="whatsapp-cliente" data-cliente="${escaparHTML(cliente.id)}">${icono('whatsapp')} WhatsApp</button>
          <button type="button" class="btn btn-primario" data-accion="nueva-orden-cliente" data-cliente="${escaparHTML(cliente.id)}">${icono('ordenes')} Nueva orden</button>
        </div>
      </div>

      ${resumenClienteHTML(registros)}

      <div class="ficha-grid">
        <section class="tarjeta ficha-datos" aria-labelledby="ficha-datos-cliente">
          <div class="tarjeta-cabecera">
            <h3 id="ficha-datos-cliente">Datos del cliente</h3>
            <span>${escaparHTML(cliente.id)}</span>
          </div>
          <dl class="lista-datos">
            ${datoHTML('NIT / CI', escaparHTML(cliente.nit || ''))}
            ${datoHTML('Celular', escaparHTML(cliente.celular || ''))}
            ${datoHTML('Teléfono fijo', escaparHTML(cliente.telefono || ''))}
            ${datoHTML('Email', escaparHTML(cliente.email || ''))}
            ${datoHTML('Dirección', escaparHTML(cliente.direccion || ''), true)}
            ${datoHTML('Notas', escaparHTML(cliente.notas || ''), true)}
            ${datoHTML('Cliente desde', formatearFechaLarga(cliente.creado_en, false))}
          </dl>
          <div class="ficha-datos-pie">
            <button type="button" class="btn btn-peligro-suave" data-accion="eliminar-cliente" data-cliente="${escaparHTML(cliente.id)}">Eliminar cliente</button>
          </div>
        </section>

        <section class="tarjeta ficha-vehiculos" aria-labelledby="ficha-vehiculos-cliente">
          <div class="tarjeta-cabecera">
            <h3 id="ficha-vehiculos-cliente">Vehículos</h3>
            <span>${vehiculos.length} ${vehiculos.length === 1 ? 'unidad' : 'unidades'}</span>
          </div>
          <div class="vehiculos-grid">${tarjetasVehiculos}</div>
          ${vehiculos.length ? `<button type="button" class="btn btn-secundario btn-bloque" data-accion="nuevo-vehiculo-cliente" data-cliente="${escaparHTML(cliente.id)}">＋ Agregar vehículo</button>` : ''}
        </section>
      </div>

      <section class="tarjeta ficha-timeline" aria-labelledby="ficha-historial-cliente">
        <div class="tarjeta-cabecera">
          <h3 id="ficha-historial-cliente">Historial de trabajos</h3>
          <span>${registros.length} ${registros.length === 1 ? 'visita' : 'visitas'} · Todos los vehículos</span>
        </div>
        ${Historial.renderizarLineaTiempo(visibles, {
          mostrarVehiculo: true,
          vacio: 'Este cliente todavía no tiene trabajos entregados.'
        })}
        ${restantes ? `<div class="timeline-mas"><button type="button" class="btn btn-secundario" data-accion="ver-mas-cliente">Ver ${Math.min(restantes, LIMITE_INICIAL)} más de ${restantes}</button></div>` : ''}
      </section>
    `;

    if (window.establecerTituloApp) {
      window.establecerTituloApp(cliente.nombre_razon_social, `Relaciones / Clientes / ${cliente.id}`);
    }
  }

  /* ---------------------------------------------------------
     Ficha del vehículo (carnet de servicio)
     --------------------------------------------------------- */
  function renderizarFichaVehiculo() {
    const vehiculo = Almacen.obtenerVehiculo(estado.idVehiculo);
    if (!vehiculo) {
      mostrarListado();
      return;
    }
    const cliente = Almacen.obtenerCliente(vehiculo.id_cliente);
    const registros = Historial.registrosDeVehiculo(vehiculo.id);
    const visibles = registros.slice(0, estado.limiteVehiculo);
    const restantes = Math.max(0, registros.length - visibles.length);
    const nombre = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin datos';
    const km = Number(vehiculo.kilometraje_actual) || 0;

    elementos.fichaVehiculo.innerHTML = `
      <div class="ficha-cabecera">
        <button type="button" class="btn-icono btn-volver" data-accion="volver-cliente" aria-label="Volver">${icono('volver')}</button>
        <div class="ficha-cabecera-texto">
          <p class="seccion-etiqueta">Vehículos / Carnet de servicio</p>
          <h2>${escaparHTML(nombre)} <span class="placa-chip placa-chip-grande">${escaparHTML(vehiculo.placa || '—')}</span></h2>
          <p class="ficha-subtitulo">${escaparHTML([vehiculo.anio, vehiculo.color, vehiculo.tipo].filter(Boolean).join(' · ') || 'Sin detalles')} · ${km.toLocaleString('es-BO')} km</p>
        </div>
        <div class="ficha-acciones">
          <button type="button" class="btn btn-secundario" data-accion="editar-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">${icono('editar')} Editar</button>
          <button type="button" class="btn btn-secundario" data-accion="agendar-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">${icono('calendario')} Agendar cita</button>
          <button type="button" class="btn btn-secundario" data-accion="imprimir-historial" data-vehiculo="${escaparHTML(vehiculo.id)}">${icono('imprimir')} Imprimir historial</button>
          <button type="button" class="btn btn-whatsapp" data-accion="whatsapp-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">${icono('whatsapp')} WhatsApp</button>
          <button type="button" class="btn btn-primario" data-accion="nueva-orden-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">${icono('ordenes')} Nueva orden</button>
        </div>
      </div>

      <div class="vehiculo-resumen-grid">
        <section class="tarjeta ficha-datos" aria-labelledby="vehiculo-datos">
          <div class="tarjeta-cabecera">
            <h3 id="vehiculo-datos">Datos del vehículo</h3>
            <span>${escaparHTML(vehiculo.id)}</span>
          </div>
          <dl class="lista-datos">
            ${datoHTML('Placa', escaparHTML(vehiculo.placa || ''))}
            ${datoHTML('Marca', escaparHTML(vehiculo.marca || ''))}
            ${datoHTML('Modelo', escaparHTML(vehiculo.modelo || ''))}
            ${datoHTML('Año', escaparHTML(vehiculo.anio || ''))}
            ${datoHTML('Color', escaparHTML(vehiculo.color || ''))}
            ${datoHTML('Tipo', escaparHTML(vehiculo.tipo || ''))}
            ${datoHTML('N° de motor', escaparHTML(vehiculo.nro_motor || ''))}
            ${datoHTML('VIN / chasis', escaparHTML(vehiculo.vin_chasis || ''))}
            ${datoHTML('Batería', escaparHTML(vehiculo.bateria || ''))}
            ${datoHTML('Kilometraje actual', `${km.toLocaleString('es-BO')} km`)}
            ${datoHTML('Notas', escaparHTML(vehiculo.notas || ''), true)}
            ${datoHTML('Dueño actual', cliente
              ? `<button type="button" class="enlace-texto" data-accion="abrir-cliente" data-cliente="${escaparHTML(cliente.id)}">${escaparHTML(cliente.nombre_razon_social)}</button>`
              : '<span class="texto-suave">Sin dueño asignado</span>', true)}
          </dl>
          <div class="ficha-datos-pie">
            <button type="button" class="btn btn-peligro-suave" data-accion="eliminar-vehiculo" data-vehiculo="${escaparHTML(vehiculo.id)}">Eliminar vehículo</button>
          </div>
        </section>

        <section class="tarjeta ficha-grafico" aria-labelledby="vehiculo-grafico">
          <div class="tarjeta-cabecera">
            <h3 id="vehiculo-grafico">Evolución del kilometraje</h3>
            <span>${registros.length} ${registros.length === 1 ? 'visita' : 'visitas'}</span>
          </div>
          ${Historial.renderizarGraficoKilometraje(registros)}
        </section>
      </div>

      <section class="tarjeta ficha-mantenimiento" aria-labelledby="vehiculo-mantenimiento">
        <div class="tarjeta-cabecera">
          <h3 id="vehiculo-mantenimiento">Estado de mantenimiento</h3>
          <span>Próximo servicio, garantías y recomendaciones</span>
        </div>
        ${Historial.renderizarEstadoMantenimiento(vehiculo, registros)}
      </section>

      <section class="tarjeta ficha-timeline" aria-labelledby="vehiculo-historial">
        <div class="tarjeta-cabecera">
          <h3 id="vehiculo-historial">Línea de tiempo del vehículo</h3>
          <span>${registros.length} ${registros.length === 1 ? 'visita' : 'visitas'} registradas</span>
        </div>
        ${Historial.renderizarLineaTiempo(visibles, {
          vacio: 'Este vehículo todavía no tiene trabajos entregados.'
        })}
        ${restantes ? `<div class="timeline-mas"><button type="button" class="btn btn-secundario" data-accion="ver-mas-vehiculo">Ver ${Math.min(restantes, LIMITE_INICIAL)} más de ${restantes}</button></div>` : ''}
      </section>
    `;

    if (window.establecerTituloApp) {
      window.establecerTituloApp(`${nombre} · ${vehiculo.placa || ''}`, `Relaciones / Vehículos / ${vehiculo.placa || vehiculo.id}`);
    }
  }

  /* ---------------------------------------------------------
     Acciones de la vista
     --------------------------------------------------------- */
  function manejarClicVista(evento) {
    const ordenar = evento.target.closest('[data-ordenar]');
    if (ordenar) {
      const columna = ordenar.dataset.ordenar;
      if (estado.ordenColumna === columna) {
        estado.ordenDireccion = estado.ordenDireccion === 'asc' ? 'desc' : 'asc';
      } else {
        estado.ordenColumna = columna;
        estado.ordenDireccion = columna === 'nombre' || columna === 'placa' || columna === 'vehiculo' || columna === 'duenio'
          ? 'asc'
          : 'desc';
      }
      if (estado.modoListado === 'vehiculos') renderizarTablaVehiculos();
      else renderizarTablaClientes();
      return;
    }

    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;
    const idCliente = boton.dataset.cliente || '';
    const idVehiculo = boton.dataset.vehiculo || '';

    switch (accion) {
      case 'nuevo-cliente':
        abrirModalCliente();
        break;
      case 'nuevo-vehiculo':
        abrirModalVehiculo();
        break;
      case 'volver-clientes':
        mostrarListado();
        break;
      case 'volver-cliente':
        if (estado.idCliente) abrirCliente(estado.idCliente);
        else mostrarListado();
        break;
      case 'abrir-cliente':
        abrirCliente(idCliente);
        break;
      case 'editar-cliente':
        abrirModalCliente(idCliente);
        break;
      case 'eliminar-cliente':
        eliminarCliente(idCliente);
        break;
      case 'nueva-orden-cliente':
        nuevaOrden(idCliente);
        break;
      case 'agendar-cliente':
        agendarCita(idCliente);
        break;
      case 'whatsapp-cliente':
        whatsappCliente(idCliente);
        break;
      case 'nuevo-vehiculo-cliente':
        abrirModalVehiculo('', idCliente);
        break;
      case 'abrir-vehiculo':
        abrirVehiculo(idVehiculo);
        break;
      case 'editar-vehiculo':
        abrirModalVehiculo(idVehiculo);
        break;
      case 'eliminar-vehiculo':
        eliminarVehiculo(idVehiculo);
        break;
      case 'nueva-orden-vehiculo':
        nuevaOrden('', idVehiculo);
        break;
      case 'agendar-vehiculo':
        agendarCita('', idVehiculo);
        break;
      case 'whatsapp-vehiculo':
        whatsappCliente('', idVehiculo);
        break;
      case 'imprimir-historial':
        Historial.imprimirHistorialVehiculo(idVehiculo);
        break;
      case 'ver-mas-cliente':
        estado.limiteCliente += LIMITE_INICIAL;
        renderizarFichaCliente();
        break;
      case 'ver-mas-vehiculo':
        estado.limiteVehiculo += LIMITE_INICIAL;
        renderizarFichaVehiculo();
        break;
      default:
        break;
    }
  }

  function nuevaOrden(idCliente, idVehiculo) {
    if (!window.Ordenes || typeof Ordenes.nuevaPara !== 'function') {
      mostrarToast('El módulo de órdenes no está disponible.', 'aviso');
      return;
    }
    if (window.mostrarVista) window.mostrarVista('ordenes');
    Ordenes.nuevaPara(idCliente, idVehiculo);
  }

  function agendarCita(idCliente, idVehiculo) {
    const cliente = idCliente ? Almacen.obtenerCliente(idCliente) : null;
    const vehiculo = idVehiculo ? Almacen.obtenerVehiculo(idVehiculo) : null;
    const clienteFinal = cliente || (vehiculo ? Almacen.obtenerCliente(vehiculo.id_cliente) : null);
    if (!clienteFinal) {
      mostrarToast('No se encontró el cliente para agendar la cita.', 'error');
      return;
    }
    if (!window.Agenda || typeof Agenda.agendarCita !== 'function') {
      mostrarToast('La agenda no está disponible en este momento.', 'error');
      return;
    }
    const nombreVehiculo = vehiculo ? [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') : '';
    if (window.mostrarVista) window.mostrarVista('agenda');
    Agenda.agendarCita({
      cliente: clienteFinal.nombre_razon_social,
      placa: vehiculo?.placa || '',
      titulo: nombreVehiculo
        ? `Recepción ${nombreVehiculo} - ${clienteFinal.nombre_razon_social}`
        : `Cita ${clienteFinal.nombre_razon_social}`,
      notas: 'Cita creada desde la ficha del cliente.'
    });
  }

  function whatsappCliente(idCliente, idVehiculo) {
    const vehiculo = idVehiculo ? Almacen.obtenerVehiculo(idVehiculo) : null;
    const cliente = idCliente
      ? Almacen.obtenerCliente(idCliente)
      : (vehiculo ? Almacen.obtenerCliente(vehiculo.id_cliente) : null);
    if (!cliente) {
      mostrarToast('No se encontró el cliente.', 'error');
      return;
    }
    const telefono = window.WhatsApp ? WhatsApp.normalizarTelefono(cliente.celular) : '';
    if (!telefono) {
      mostrarToast('El cliente no tiene un celular registrado.', 'aviso');
      return;
    }
    const nombre = String(cliente.nombre_razon_social || '').split(/\s+/)[0] || 'cliente';
    const lineas = [`Hola ${nombre}, te saludamos de *${CONFIG.nombreTaller}*.`];
    if (vehiculo) {
      const nombreVehiculo = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ');
      lineas.push('', `Queríamos consultarte por tu ${nombreVehiculo || 'vehículo'} (placa *${vehiculo.placa || '—'}*).`);
      const registros = Historial.registrosDeVehiculo(vehiculo.id);
      const proximo = registros[0]?.proximo_servicio;
      if (proximo && (proximo.fecha || proximo.km)) {
        const detalle = [
          proximo.descripcion || 'Mantenimiento programado',
          proximo.fecha ? `para el ${formatearFecha(proximo.fecha)}` : '',
          Number(proximo.km) > 0 ? `a los ${Number(proximo.km).toLocaleString('es-BO')} km` : ''
        ].filter(Boolean).join(' ');
        lineas.push('', `Tenés pendiente: ${detalle}. ¿Querés que agendemos una cita?`);
      }
    } else {
      lineas.push('', '¿En qué podemos ayudarte con tu vehículo?');
    }
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(lineas.join('\n'))}`;
    try {
      const ventana = window.open(url, '_blank');
      if (ventana) ventana.opener = null;
      else mostrarToast('El navegador bloqueó la ventana de WhatsApp.', 'aviso');
    } catch (error) {
      mostrarToast('No se pudo abrir WhatsApp.', 'error');
    }
  }

  /* ---------------------------------------------------------
     CRUD de clientes
     --------------------------------------------------------- */
  function abrirModalCliente(id = '') {
    const cliente = id ? Almacen.obtenerCliente(id) : null;
    if (id && !cliente) {
      mostrarToast('No se encontró el cliente.', 'error');
      return;
    }
    const form = document.getElementById('form-cliente');
    if (!form) return;
    form.reset();
    document.getElementById('cli-id').value = cliente?.id || '';
    document.getElementById('cli-nombre').value = cliente?.nombre_razon_social || '';
    document.getElementById('cli-nit').value = cliente?.nit || '';
    document.getElementById('cli-celular').value = cliente?.celular || '';
    document.getElementById('cli-telefono').value = cliente?.telefono || '';
    document.getElementById('cli-email').value = cliente?.email || '';
    document.getElementById('cli-direccion').value = cliente?.direccion || '';
    document.getElementById('cli-notas').value = cliente?.notas || '';
    document.getElementById('modal-cliente-titulo').textContent = cliente ? 'Editar cliente' : 'Nuevo cliente';
    Modal.abrir('modal-cliente');
  }

  function guardarCliente(evento) {
    evento.preventDefault();
    const id = document.getElementById('cli-id').value;
    const datos = {
      nombre_razon_social: document.getElementById('cli-nombre').value.trim(),
      nit: document.getElementById('cli-nit').value.trim(),
      celular: document.getElementById('cli-celular').value.trim(),
      telefono: document.getElementById('cli-telefono').value.trim(),
      email: document.getElementById('cli-email').value.trim(),
      direccion: document.getElementById('cli-direccion').value.trim(),
      notas: document.getElementById('cli-notas').value.trim()
    };

    if (!datos.nombre_razon_social) {
      mostrarToast('Escribí el nombre o la razón social del cliente.', 'error');
      document.getElementById('cli-nombre').focus();
      return;
    }
    if (!datos.celular) {
      mostrarToast('Escribí el celular del cliente.', 'error');
      document.getElementById('cli-celular').focus();
      return;
    }
    if (normalizarCelular(datos.celular).length < 6) {
      mostrarToast('El celular debe tener al menos 6 dígitos.', 'error');
      document.getElementById('cli-celular').focus();
      return;
    }

    const clientes = Almacen.obtenerClientes();
    const duplicado = clientes.find((cliente) => {
      if (cliente.id === id) return false;
      const mismoNit = datos.nit && normalizarDocumento(cliente.nit) === normalizarDocumento(datos.nit);
      const mismoCelular = normalizarCelular(cliente.celular) === normalizarCelular(datos.celular);
      return mismoNit || mismoCelular;
    });
    if (duplicado) {
      mostrarToast(`Ya existe un cliente con ese NIT o celular: ${duplicado.nombre_razon_social}.`, 'error', 5500);
      return;
    }

    let nuevos;
    let idFinal = id;
    if (id) {
      nuevos = clientes.map((cliente) => (cliente.id === id ? { ...cliente, ...datos } : cliente));
    } else {
      const nuevo = Almacen.crearClienteDesdeDatos(datos, clientes);
      idFinal = nuevo.id;
      nuevos = [...clientes, nuevo];
    }

    const resultado = Almacen.guardarClientes(nuevos);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6000);
      return;
    }

    Modal.cerrar('modal-cliente');
    mostrarToast(id ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.', 'exito');
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();

    if (estado.vista === 'cliente' && estado.idCliente === idFinal) renderizarFichaCliente();
    else if (estado.vista === 'listado') renderizarListado();
    else abrirCliente(idFinal);
  }

  async function eliminarCliente(id) {
    const cliente = Almacen.obtenerCliente(id);
    if (!cliente) {
      mostrarToast('No se encontró el cliente.', 'error');
      return;
    }
    const historial = Almacen.obtenerHistorial().filter((registro) => registro.id_cliente === id);
    const ordenes = Almacen.obtenerOrdenes().filter((orden) => orden.id_cliente === id);
    if (historial.length || ordenes.length) {
      mostrarToast('No se puede eliminar: el cliente tiene órdenes o historial registrado.', 'aviso', 6000);
      return;
    }

    const vehiculos = Almacen.obtenerVehiculos().filter((vehiculo) => vehiculo.id_cliente === id);
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar cliente',
      mensaje: `¿Eliminar a ${cliente.nombre_razon_social}${vehiculos.length ? ` y sus ${vehiculos.length} vehículo${vehiculos.length === 1 ? '' : 's'}` : ''}? Esta acción no se puede deshacer.`,
      textoAceptar: 'Eliminar',
      peligro: true
    });
    if (!confirmado) return;

    const resultadoCliente = Almacen.guardarClientes(Almacen.obtenerClientes().filter((item) => item.id !== id));
    const resultadoVehiculos = Almacen.guardarVehiculos(Almacen.obtenerVehiculos().filter((item) => item.id_cliente !== id));
    if (!resultadoCliente.ok || !resultadoVehiculos.ok) {
      mostrarToast('No se pudieron eliminar todos los datos del cliente.', 'error');
      return;
    }
    mostrarListado();
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();
    mostrarToast('Cliente eliminado.', 'exito');
  }

  /* ---------------------------------------------------------
     CRUD de vehículos
     --------------------------------------------------------- */
  function llenarSelectClientes(idSeleccionado) {
    const select = document.getElementById('veh-id-cliente');
    if (!select) return;
    const clientes = [...Almacen.obtenerClientes()].sort((a, b) => {
      return String(a.nombre_razon_social).localeCompare(String(b.nombre_razon_social), 'es');
    });
    select.innerHTML = clientes.length
      ? clientes.map((cliente) => `<option value="${escaparHTML(cliente.id)}">${escaparHTML(cliente.nombre_razon_social)}</option>`).join('')
      : '<option value="">Sin clientes registrados</option>';
    if (idSeleccionado) select.value = idSeleccionado;
  }

  function abrirModalVehiculo(id = '', idCliente = '') {
    const vehiculo = id ? Almacen.obtenerVehiculo(id) : null;
    if (id && !vehiculo) {
      mostrarToast('No se encontró el vehículo.', 'error');
      return;
    }
    const form = document.getElementById('form-vehiculo');
    if (!form) return;
    form.reset();
    llenarSelectClientes(vehiculo?.id_cliente || idCliente || '');

    document.getElementById('veh-id').value = vehiculo?.id || '';
    document.getElementById('veh-placa').value = vehiculo?.placa || '';
    document.getElementById('veh-marca').value = vehiculo?.marca || '';
    document.getElementById('veh-modelo').value = vehiculo?.modelo || '';
    document.getElementById('veh-tipo').value = vehiculo?.tipo || 'Sedán';
    document.getElementById('veh-anio').value = vehiculo?.anio || '';
    document.getElementById('veh-color').value = vehiculo?.color || '';
    document.getElementById('veh-kilometraje').value = vehiculo?.kilometraje_actual ?? '';
    document.getElementById('veh-motor').value = vehiculo?.nro_motor || '';
    document.getElementById('veh-vin').value = vehiculo?.vin_chasis || '';
    document.getElementById('veh-bateria').value = vehiculo?.bateria || '';
    document.getElementById('veh-notas').value = vehiculo?.notas || '';
    document.getElementById('modal-vehiculo-titulo').textContent = vehiculo ? 'Editar vehículo' : 'Nuevo vehículo';
    Modal.abrir('modal-vehiculo');
  }

  async function guardarVehiculo(evento) {
    evento.preventDefault();
    const id = document.getElementById('veh-id').value;
    const datos = {
      id_cliente: document.getElementById('veh-id-cliente').value,
      placa: normalizarPlaca(document.getElementById('veh-placa').value),
      marca: document.getElementById('veh-marca').value.trim(),
      modelo: document.getElementById('veh-modelo').value.trim(),
      tipo: document.getElementById('veh-tipo').value,
      anio: document.getElementById('veh-anio').value.trim(),
      color: document.getElementById('veh-color').value.trim(),
      kilometraje_actual: document.getElementById('veh-kilometraje').value.trim(),
      nro_motor: document.getElementById('veh-motor').value.trim(),
      vin_chasis: document.getElementById('veh-vin').value.trim(),
      bateria: document.getElementById('veh-bateria').value.trim(),
      notas: document.getElementById('veh-notas').value.trim()
    };

    if (!datos.id_cliente) {
      mostrarToast('Elegí el dueño del vehículo.', 'error');
      return;
    }
    if (!datos.placa) {
      mostrarToast('Escribí la placa del vehículo.', 'error');
      document.getElementById('veh-placa').focus();
      return;
    }
    if (!datos.marca || !datos.modelo) {
      mostrarToast('Completá la marca y el modelo del vehículo.', 'error');
      return;
    }
    const anio = Number(datos.anio);
    if (datos.anio !== '' && (!Number.isInteger(anio) || anio < 1950 || anio > 2100)) {
      mostrarToast('El año debe estar entre 1950 y 2100.', 'error');
      return;
    }
    const km = Number(datos.kilometraje_actual);
    if (datos.kilometraje_actual !== '' && (!Number.isFinite(km) || km < 0)) {
      mostrarToast('El kilometraje debe ser un número igual o mayor a cero.', 'error');
      return;
    }

    const vehiculos = Almacen.obtenerVehiculos();
    const porPlaca = Almacen.buscarVehiculoEnLista(vehiculos, datos.placa);
    let objetivo = id ? vehiculos.find((vehiculo) => vehiculo.id === id) : null;

    if (porPlaca && porPlaca.id !== id) {
      const duenio = Almacen.obtenerCliente(porPlaca.id_cliente);
      const confirmado = await confirmarAccion({
        titulo: 'Placa ya registrada',
        mensaje: `La placa ${datos.placa} ya pertenece a ${duenio?.nombre_razon_social || 'otro cliente'}. ¿Reasignar el vehículo al cliente seleccionado? El historial anterior se conserva como copia fija.`,
        textoAceptar: 'Reasignar vehículo',
        peligro: false
      });
      if (!confirmado) return;
      objetivo = porPlaca;
    }

    const datosNormalizados = {
      ...datos,
      anio: datos.anio === '' ? '' : anio,
      kilometraje_actual: datos.kilometraje_actual === '' ? 0 : km
    };

    let nuevos;
    let idFinal;
    if (objetivo) {
      idFinal = objetivo.id;
      nuevos = vehiculos.map((vehiculo) => (
        vehiculo.id === objetivo.id ? { ...vehiculo, ...datosNormalizados, id: objetivo.id } : vehiculo
      ));
    } else {
      const nuevo = Almacen.crearVehiculoDesdeDatos(datosNormalizados, datos.id_cliente, vehiculos);
      idFinal = nuevo.id;
      nuevos = [...vehiculos, nuevo];
    }

    const resultado = Almacen.guardarVehiculos(nuevos);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6000);
      return;
    }

    Modal.cerrar('modal-vehiculo');
    mostrarToast(objetivo ? 'Vehículo actualizado correctamente.' : 'Vehículo creado correctamente.', 'exito');

    if (estado.vista === 'vehiculo' && estado.idVehiculo === idFinal) renderizarFichaVehiculo();
    else if (estado.vista === 'cliente') renderizarFichaCliente();
    else renderizarListado();
  }

  async function eliminarVehiculo(id) {
    const vehiculo = Almacen.obtenerVehiculo(id);
    if (!vehiculo) {
      mostrarToast('No se encontró el vehículo.', 'error');
      return;
    }
    const historial = Almacen.obtenerHistorial().filter((registro) => registro.id_vehiculo === id);
    const ordenes = Almacen.obtenerOrdenes().filter((orden) => orden.id_vehiculo === id);
    if (historial.length || ordenes.length) {
      mostrarToast('No se puede eliminar: el vehículo tiene órdenes o historial registrado.', 'aviso', 6000);
      return;
    }
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar vehículo',
      mensaje: `¿Eliminar el vehículo ${vehiculo.placa} (${[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')})? Esta acción no se puede deshacer.`,
      textoAceptar: 'Eliminar',
      peligro: true
    });
    if (!confirmado) return;

    const resultado = Almacen.guardarVehiculos(Almacen.obtenerVehiculos().filter((item) => item.id !== id));
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6000);
      return;
    }
    if (estado.idCliente) abrirCliente(estado.idCliente);
    else mostrarListado();
    mostrarToast('Vehículo eliminado.', 'exito');
  }

  /* ---------------------------------------------------------
     API pública
     --------------------------------------------------------- */
  function recargar() {
    if (estado.vista === 'cliente') renderizarFichaCliente();
    else if (estado.vista === 'vehiculo') renderizarFichaVehiculo();
    else renderizarListado();
  }

  /** Datos listos para precargar el formulario de una orden. */
  function datosParaOrden(idCliente, idVehiculo) {
    const vehiculo = idVehiculo ? Almacen.obtenerVehiculo(idVehiculo) : null;
    const cliente = idCliente
      ? Almacen.obtenerCliente(idCliente)
      : (vehiculo ? Almacen.obtenerCliente(vehiculo.id_cliente) : null);

    return {
      cliente: cliente ? {
        id: cliente.id,
        nombre_razon_social: cliente.nombre_razon_social || '',
        nit: cliente.nit || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        celular: cliente.celular || ''
      } : null,
      vehiculo: vehiculo ? {
        id: vehiculo.id,
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        tipo: vehiculo.tipo || 'Sedán',
        anio: vehiculo.anio || '',
        placa: vehiculo.placa || '',
        kilometraje: Number(vehiculo.kilometraje_actual) || 0,
        color: vehiculo.color || '',
        nro_motor: vehiculo.nro_motor || '',
        vin_chasis: vehiculo.vin_chasis || '',
        bateria: vehiculo.bateria || ''
      } : null
    };
  }

  return {
    iniciar,
    recargar,
    mostrarListado,
    abrirCliente,
    abrirVehiculo,
    abrirModalCliente,
    abrirModalVehiculo,
    datosParaOrden
  };
})();

/* Se expone en window para que el arranque y las órdenes lo usen. */
window.Clientes = Clientes;
