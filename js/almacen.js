'use strict';

/* =========================================================
   ALMACÉN DE DATOS
   Capa única de acceso a localStorage. Si en el futuro se
   conecta un backend, solo hay que reemplazar estas funciones.
   ========================================================= */

const Almacen = (() => {
  const CLAVES = {
    EVENTOS: 'taller_eventos',
    ORDENES: 'taller_ordenes',
    CLIENTES: 'taller_clientes',
    VEHICULOS: 'taller_vehiculos',
    HISTORIAL: 'taller_historial',
    CATALOGO: 'taller_catalogo',
    RECORDATORIOS: 'taller_recordatorios',
    INICIALIZADO: 'taller_demo_inicializado'
  };

  /* Catálogo base de servicios frecuentes con importe en bolivianos. */
  const CATALOGO_BASE = [
    { nombre: 'Cambio de aceite y filtro', importe: 350 },
    { nombre: 'Cambio de aceite', importe: 280 },
    { nombre: 'Alineación y balanceo', importe: 200 },
    { nombre: 'Filtro de aire', importe: 90 },
    { nombre: 'Revisión de frenos', importe: 250 },
    { nombre: 'Cambio de pastillas de freno', importe: 380 },
    { nombre: 'Diagnóstico de inyección', importe: 400 },
    { nombre: 'Limpieza de inyectores', importe: 300 },
    { nombre: 'Cambio de bujías', importe: 220 },
    { nombre: 'Cambio de batería', importe: 550 },
    { nombre: 'Mantenimiento preventivo', importe: 600 },
    { nombre: 'Cambio de correa de distribución', importe: 900 },
    { nombre: 'Reparación de suspensión', importe: 750 },
    { nombre: 'Cambio de bomba de combustible', importe: 850 },
    { nombre: 'Lavado y encerado', importe: 120 }
  ];

  /* Se comprueba una vez si localStorage está disponible. */
  const DISPONIBLE = (() => {
    try {
      const prueba = '__taller_prueba__';
      window.localStorage.setItem(prueba, '1');
      window.localStorage.removeItem(prueba);
      return true;
    } catch (error) {
      return false;
    }
  })();

  /* Respaldo en memoria para navegadores que bloquean localStorage. */
  const memoria = {};

  function esErrorDeCuota(error) {
    return Boolean(error) && (
      error.name === 'QuotaExceededError'
      || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || error.code === 22
      || error.code === 1014
    );
  }

  function leerCrudo(clave) {
    if (DISPONIBLE) {
      try {
        return window.localStorage.getItem(clave);
      } catch (error) {
        /* Se usa el respaldo en memoria. */
      }
    }
    return Object.prototype.hasOwnProperty.call(memoria, clave) ? memoria[clave] : null;
  }

  function escribirCrudo(clave, valor) {
    if (DISPONIBLE) {
      try {
        window.localStorage.setItem(clave, valor);
        return { ok: true };
      } catch (error) {
        return { ok: false, cuota: esErrorDeCuota(error) };
      }
    }
    memoria[clave] = valor;
    return { ok: true, soloMemoria: true };
  }

  function leerJSON(clave, valorPorDefecto) {
    const crudo = leerCrudo(clave);
    if (crudo === null || crudo === undefined || crudo === '') return valorPorDefecto;
    try {
      const datos = JSON.parse(crudo);
      return datos === null || datos === undefined ? valorPorDefecto : datos;
    } catch (error) {
      return valorPorDefecto;
    }
  }

  function escribirJSON(clave, datos) {
    try {
      return escribirCrudo(clave, JSON.stringify(datos));
    } catch (error) {
      return { ok: false, cuota: false };
    }
  }

  function obtenerLista(clave) {
    const datos = leerJSON(clave, []);
    return Array.isArray(datos) ? datos : [];
  }

  function guardarLista(clave, datos) {
    if (!Array.isArray(datos)) return { ok: false, cuota: false };
    return escribirJSON(clave, datos);
  }

  /* ---------------------------------------------------------
     Eventos y órdenes
     --------------------------------------------------------- */
  function obtenerEventos() {
    return obtenerLista(CLAVES.EVENTOS);
  }

  function guardarEventos(eventos) {
    return guardarLista(CLAVES.EVENTOS, eventos);
  }

  function obtenerOrdenes() {
    return obtenerLista(CLAVES.ORDENES);
  }

  function guardarOrdenes(ordenes) {
    return guardarLista(CLAVES.ORDENES, ordenes);
  }

  function obtenerOrden(numeroFicha) {
    return obtenerOrdenes().find((orden) => orden.numero_ficha === numeroFicha) || null;
  }

  /* ---------------------------------------------------------
     Clientes, vehículos, historial y catálogo
     --------------------------------------------------------- */
  function obtenerClientes() {
    return obtenerLista(CLAVES.CLIENTES);
  }

  function guardarClientes(clientes) {
    return guardarLista(CLAVES.CLIENTES, clientes);
  }

  function obtenerVehiculos() {
    return obtenerLista(CLAVES.VEHICULOS);
  }

  function guardarVehiculos(vehiculos) {
    return guardarLista(CLAVES.VEHICULOS, vehiculos);
  }

  function obtenerHistorial() {
    return obtenerLista(CLAVES.HISTORIAL);
  }

  function guardarHistorial(historial) {
    return guardarLista(CLAVES.HISTORIAL, historial);
  }

  function obtenerCatalogo() {
    return obtenerLista(CLAVES.CATALOGO);
  }

  function guardarCatalogo(catalogo) {
    return guardarLista(CLAVES.CATALOGO, catalogo);
  }

  function obtenerRecordatorios() {
    const datos = leerJSON(CLAVES.RECORDATORIOS, {});
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
  }

  function guardarRecordatorios(recordatorios) {
    const datos = recordatorios && typeof recordatorios === 'object' && !Array.isArray(recordatorios)
      ? recordatorios
      : {};
    return escribirJSON(CLAVES.RECORDATORIOS, datos);
  }

  function obtenerCliente(id) {
    return obtenerClientes().find((cliente) => cliente.id === id) || null;
  }

  function obtenerVehiculo(id) {
    return obtenerVehiculos().find((vehiculo) => vehiculo.id === id) || null;
  }

  function obtenerVehiculoPorPlaca(placa) {
    const buscada = normalizarPlaca(placa);
    if (!buscada) return null;
    return obtenerVehiculos().find((vehiculo) => normalizarPlaca(vehiculo.placa) === buscada) || null;
  }

  function obtenerHistorialVehiculo(idVehiculo) {
    return obtenerHistorial()
      .filter((registro) => registro.id_vehiculo === idVehiculo)
      .sort((a, b) => String(b.fecha_ingreso || '').localeCompare(String(a.fecha_ingreso || '')));
  }

  function obtenerHistorialOrden(idOrden) {
    return obtenerHistorial().find((registro) => registro.id_orden === idOrden) || null;
  }

  /** Copia del catálogo base para la carga inicial o una migración. */
  function catalogoPredeterminado() {
    return CATALOGO_BASE.map((servicio) => ({ ...servicio }));
  }

  /* ---------------------------------------------------------
     Normalización y búsquedas sin duplicados
     --------------------------------------------------------- */
  function buscarClienteEnLista(clientes, datos) {
    const lista = Array.isArray(clientes) ? clientes : [];
    const nit = normalizarDocumento(datos?.nit);
    const celular = normalizarCelular(datos?.celular);
    const nombre = normalizarNombre(datos?.nombre_razon_social);

    if (nit) {
      const porNit = lista.find((cliente) => normalizarDocumento(cliente.nit) === nit);
      if (porNit) return porNit;
    }
    if (celular) {
      const porCelular = lista.find((cliente) => normalizarCelular(cliente.celular) === celular);
      if (porCelular) return porCelular;
    }
    if (nombre) {
      const porNombre = lista.find((cliente) => normalizarNombre(cliente.nombre_razon_social) === nombre);
      if (porNombre) return porNombre;
    }
    return null;
  }

  function buscarVehiculoEnLista(vehiculos, placa) {
    const buscada = normalizarPlaca(placa);
    if (!buscada) return null;
    return (Array.isArray(vehiculos) ? vehiculos : [])
      .find((vehiculo) => normalizarPlaca(vehiculo.placa) === buscada) || null;
  }

  function crearClienteDesdeDatos(datos, clientes) {
    const lista = Array.isArray(clientes) ? clientes : [];
    const ahora = aISOlocal(new Date());
    return {
      id: generarId('CL', lista),
      nombre_razon_social: String(datos?.nombre_razon_social || '').trim() || 'Cliente sin nombre',
      nit: String(datos?.nit || '').trim(),
      direccion: String(datos?.direccion || '').trim(),
      telefono: String(datos?.telefono || '').trim(),
      celular: String(datos?.celular || '').trim(),
      email: String(datos?.email || '').trim(),
      notas: String(datos?.notas || '').trim(),
      creado_en: datos?.creado_en || ahora
    };
  }

  function crearVehiculoDesdeDatos(datos, idCliente, vehiculos) {
    const lista = Array.isArray(vehiculos) ? vehiculos : [];
    const anio = Number(datos?.anio);
    const km = Number(datos?.kilometraje ?? datos?.kilometraje_actual);
    return {
      id: generarId('VH', lista),
      id_cliente: idCliente || '',
      placa: normalizarPlaca(datos?.placa),
      marca: String(datos?.marca || '').trim(),
      modelo: String(datos?.modelo || '').trim(),
      tipo: String(datos?.tipo || 'Sedán').trim() || 'Sedán',
      anio: Number.isFinite(anio) && anio > 0 ? anio : '',
      color: String(datos?.color || '').trim(),
      nro_motor: String(datos?.nro_motor || '').trim(),
      vin_chasis: String(datos?.vin_chasis || '').trim(),
      bateria: String(datos?.bateria || '').trim(),
      kilometraje_actual: Number.isFinite(km) && km >= 0 ? km : 0,
      notas: String(datos?.notas || '').trim()
    };
  }

  /* ---------------------------------------------------------
     Historial: copia fija de cada visita
     --------------------------------------------------------- */
  function normalizarGarantia(garantia, fechaEntrega) {
    const datos = garantia && typeof garantia === 'object' ? garantia : {};
    const dias = Number(datos.dias);
    const km = Number(datos.km);
    let vence = String(datos.vence || '').trim();
    if (!vence && Number.isFinite(dias) && dias > 0) {
      const base = parsearFechaHora(fechaEntrega) || new Date();
      vence = aISOfecha(sumarDias(base, dias));
    }
    return {
      dias: Number.isFinite(dias) && dias > 0 ? dias : 0,
      km: Number.isFinite(km) && km > 0 ? km : 0,
      vence
    };
  }

  function normalizarProximo(proximo) {
    const datos = proximo && typeof proximo === 'object' ? proximo : {};
    const km = Number(datos.km);
    return {
      fecha: String(datos.fecha || '').trim(),
      km: Number.isFinite(km) && km > 0 ? km : '',
      descripcion: String(datos.descripcion || '').trim()
    };
  }

  function normalizarRecomendaciones(recomendaciones) {
    if (!Array.isArray(recomendaciones)) return [];
    return recomendaciones
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        descripcion: String(item.descripcion || '').trim(),
        urgencia: URGENCIAS_RECOMENDACION[item.urgencia] ? item.urgencia : 'media',
        atendida: Boolean(item.atendida)
      }))
      .filter((item) => item.descripcion);
  }

  function normalizarRepuestos(repuestos) {
    if (!Array.isArray(repuestos)) return [];
    return repuestos
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const cantidad = Number(item.cantidad);
        return {
          nombre: String(item.nombre || '').trim(),
          cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1
        };
      })
      .filter((item) => item.nombre);
  }

  /**
   * Construye el registro de historial a partir de una orden.
   * Si se pasa un registro existente conserva su id y su fecha de entrega.
   */
  function construirRegistroHistorial(orden, idCliente, idVehiculo, existente = null, lista = []) {
    const cliente = orden?.cliente || {};
    const vehiculo = orden?.vehiculo || {};
    const servicios = (Array.isArray(orden?.servicios) ? orden.servicios : [])
      .map((servicio) => ({
        nombre: String(servicio?.nombre || '').trim(),
        importe: Number(servicio?.importe) || 0
      }))
      .filter((servicio) => servicio.nombre);
    const totalCalculado = servicios.reduce((suma, servicio) => suma + servicio.importe, 0);
    const total = Number(orden?.total);
    const fechaIngreso = orden?.fecha
      ? `${orden.fecha}T${orden.hora || '00:00'}`
      : aISOlocal(new Date());
    const fechaEntrega = existente?.fecha_entrega || orden?.actualizado_en || aISOlocal(new Date());
    const categoria = CATEGORIAS_TRABAJO[orden?.categoria] ? orden.categoria : 'mantenimiento';
    const km = Number(vehiculo.kilometraje);

    return {
      id: existente?.id || generarId('HI', lista),
      id_orden: orden?.numero_ficha || '',
      id_cliente: idCliente || orden?.id_cliente || '',
      id_vehiculo: idVehiculo || orden?.id_vehiculo || '',
      fecha_ingreso: fechaIngreso,
      fecha_entrega: fechaEntrega,
      kilometraje: Number.isFinite(km) && km >= 0 ? km : 0,
      mecanico: String(orden?.mecanico || '').trim(),
      categoria,
      servicios,
      repuestos: normalizarRepuestos(orden?.repuestos),
      total: Number.isFinite(total) ? total : totalCalculado,
      forma_pago: orden?.forma_pago === 'credito' ? 'credito' : 'contado',
      garantia: normalizarGarantia(orden?.garantia, fechaEntrega),
      proximo_servicio: normalizarProximo(orden?.proximo_servicio),
      recomendaciones: normalizarRecomendaciones(orden?.recomendaciones),
      observaciones: String(orden?.notas || '').trim(),
      /* Copia fija de la identidad visible del cliente y del vehículo. */
      cliente_nombre: String(cliente.nombre_razon_social || '').trim(),
      vehiculo_marca: String(vehiculo.marca || '').trim(),
      vehiculo_modelo: String(vehiculo.modelo || '').trim(),
      vehiculo_placa: normalizarPlaca(vehiculo.placa),
      vehiculo_anio: vehiculo.anio ?? '',
      vehiculo_color: String(vehiculo.color || '').trim()
    };
  }

  /**
   * Genera o actualiza el registro de historial de una orden.
   * Solo crea uno nuevo si la orden está entregada.
   */
  function sincronizarHistorialOrden(orden) {
    if (!orden || !orden.numero_ficha) return { ok: true, creado: false };
    const historial = obtenerHistorial();
    const indice = historial.findIndex((registro) => registro.id_orden === orden.numero_ficha);
    if (indice === -1 && orden.estado !== 'entregado') {
      return { ok: true, creado: false };
    }

    const existente = indice >= 0 ? historial[indice] : null;
    const registro = construirRegistroHistorial(
      orden,
      orden.id_cliente,
      orden.id_vehiculo,
      existente,
      historial
    );

    if (indice >= 0) historial[indice] = registro;
    else historial.push(registro);

    const resultado = guardarHistorial(historial);
    return { ...resultado, creado: indice === -1, registro };
  }

  /** Actualiza el kilometraje de un vehículo si el nuevo valor es mayor. */
  function actualizarKilometrajeVehiculo(idVehiculo, kilometraje) {
    const km = Number(kilometraje);
    if (!idVehiculo || !Number.isFinite(km) || km < 0) return { ok: true, actualizado: false };
    const vehiculos = obtenerVehiculos();
    const vehiculo = vehiculos.find((item) => item.id === idVehiculo);
    if (!vehiculo) return { ok: true, actualizado: false };
    if (km <= Number(vehiculo.kilometraje_actual || 0)) return { ok: true, actualizado: false };
    vehiculo.kilometraje_actual = km;
    const resultado = guardarVehiculos(vehiculos);
    return { ...resultado, actualizado: true };
  }

  function marcarRecomendacionAtendida(idHistorial, indice) {
    const historial = obtenerHistorial();
    const registro = historial.find((item) => item.id === idHistorial);
    if (!registro || !Array.isArray(registro.recomendaciones)) {
      return { ok: false, mensaje: 'No se encontró la recomendación.' };
    }
    const recomendacion = registro.recomendaciones[Number(indice)];
    if (!recomendacion) return { ok: false, mensaje: 'No se encontró la recomendación.' };
    recomendacion.atendida = true;
    return guardarHistorial(historial);
  }

  function marcarContactado(clave, fecha = aISOlocal(new Date())) {
    if (!clave) return { ok: false };
    const recordatorios = obtenerRecordatorios();
    if (fecha === null) delete recordatorios[clave];
    else recordatorios[clave] = { contactado_en: fecha };
    return guardarRecordatorios(recordatorios);
  }

  /* ---------------------------------------------------------
     Migración de datos anteriores
     --------------------------------------------------------- */
  /**
   * Vincula las órdenes antiguas con clientes y vehículos.
   * No borra nada: crea los registros que falten y evita duplicados.
   */
  function migrarDatos() {
    const ordenes = obtenerOrdenes();
    let clientes = obtenerClientes();
    let vehiculos = obtenerVehiculos();
    let historial = obtenerHistorial();
    let catalogo = obtenerCatalogo();

    let cambioClientes = false;
    let cambioVehiculos = false;
    let cambioHistorial = false;
    let cambioCatalogo = false;
    let cambioOrdenes = false;

    if (!catalogo.length) {
      catalogo = catalogoPredeterminado();
      cambioCatalogo = true;
    }

    ordenes.forEach((orden) => {
      if (!orden || typeof orden !== 'object') return;
      const datosCliente = orden.cliente || {};
      const datosVehiculo = orden.vehiculo || {};

      let cliente = orden.id_cliente
        ? clientes.find((item) => item.id === orden.id_cliente)
        : null;
      if (!cliente) cliente = buscarClienteEnLista(clientes, datosCliente);
      if (!cliente) {
        cliente = crearClienteDesdeDatos(datosCliente, clientes);
        clientes.push(cliente);
        cambioClientes = true;
      }

      let vehiculo = orden.id_vehiculo
        ? vehiculos.find((item) => item.id === orden.id_vehiculo)
        : null;
      if (!vehiculo) vehiculo = buscarVehiculoEnLista(vehiculos, datosVehiculo.placa);
      if (!vehiculo) {
        vehiculo = crearVehiculoDesdeDatos(datosVehiculo, cliente.id, vehiculos);
        vehiculos.push(vehiculo);
        cambioVehiculos = true;
      } else if (!vehiculo.id_cliente) {
        vehiculo.id_cliente = cliente.id;
        cambioVehiculos = true;
      }

      if (orden.id_cliente !== cliente.id) {
        orden.id_cliente = cliente.id;
        cambioOrdenes = true;
      }
      if (orden.id_vehiculo !== vehiculo.id) {
        orden.id_vehiculo = vehiculo.id;
        cambioOrdenes = true;
      }

      const kmOrden = Number(datosVehiculo.kilometraje);
      if (Number.isFinite(kmOrden) && kmOrden > Number(vehiculo.kilometraje_actual || 0)) {
        vehiculo.kilometraje_actual = kmOrden;
        cambioVehiculos = true;
      }

      const registro = historial.find((item) => item.id_orden === orden.numero_ficha);
      if (registro) {
        if (registro.id_cliente !== cliente.id) {
          registro.id_cliente = cliente.id;
          cambioHistorial = true;
        }
        if (registro.id_vehiculo !== vehiculo.id) {
          registro.id_vehiculo = vehiculo.id;
          cambioHistorial = true;
        }
      } else if (orden.estado === 'entregado') {
        historial.push(construirRegistroHistorial(orden, cliente.id, vehiculo.id, null, historial));
        cambioHistorial = true;
      }
    });

    if (cambioClientes) guardarClientes(clientes);
    if (cambioVehiculos) guardarVehiculos(vehiculos);
    if (cambioHistorial) guardarHistorial(historial);
    if (cambioCatalogo) guardarCatalogo(catalogo);
    if (cambioOrdenes) guardarOrdenes(ordenes);

    return {
      migrado: cambioClientes || cambioVehiculos || cambioHistorial || cambioCatalogo || cambioOrdenes,
      clientes: clientes.length,
      vehiculos: vehiculos.length,
      historial: historial.length
    };
  }

  /* ---------------------------------------------------------
     Inicialización, demo y exportación
     --------------------------------------------------------- */
  function marcarInicializado() {
    return escribirCrudo(CLAVES.INICIALIZADO, '1');
  }

  function estaInicializado() {
    return leerCrudo(CLAVES.INICIALIZADO) === '1';
  }

  /** Carga los datos de demostración la primera vez que se abre la app. */
  function inicializar() {
    let sembrado = false;
    if (!estaInicializado()) {
      if (typeof DatosDemo !== 'undefined' && typeof DatosDemo.cargar === 'function') {
        DatosDemo.cargar();
      }
      marcarInicializado();
      sembrado = true;
    }

    /* Si las claves se perdieron o están dañadas, se dejan listas vacías. */
    if (!Array.isArray(leerJSON(CLAVES.EVENTOS, null))) escribirJSON(CLAVES.EVENTOS, []);
    if (!Array.isArray(leerJSON(CLAVES.ORDENES, null))) escribirJSON(CLAVES.ORDENES, []);
    if (!Array.isArray(leerJSON(CLAVES.CLIENTES, null))) escribirJSON(CLAVES.CLIENTES, []);
    if (!Array.isArray(leerJSON(CLAVES.VEHICULOS, null))) escribirJSON(CLAVES.VEHICULOS, []);
    if (!Array.isArray(leerJSON(CLAVES.HISTORIAL, null))) escribirJSON(CLAVES.HISTORIAL, []);
    if (!Array.isArray(leerJSON(CLAVES.CATALOGO, null))) escribirJSON(CLAVES.CATALOGO, []);

    const migracion = migrarDatos();
    return { sembrado, ...migracion };
  }

  /** Borra todo y vuelve a generar los ejemplos. */
  function restablecerDemo() {
    if (typeof DatosDemo === 'undefined' || typeof DatosDemo.cargar !== 'function') {
      return { ok: false, mensaje: 'No están disponibles los datos de demostración.' };
    }
    return DatosDemo.cargar();
  }

  /** Devuelve un JSON legible con todos los datos. */
  function exportarTodo() {
    return JSON.stringify({
      app: 'taller-demo',
      version: 2,
      exportado_en: aISOlocal(new Date()),
      eventos: obtenerEventos(),
      ordenes: obtenerOrdenes(),
      clientes: obtenerClientes(),
      vehiculos: obtenerVehiculos(),
      historial: obtenerHistorial(),
      catalogo: obtenerCatalogo(),
      recordatorios: obtenerRecordatorios()
    }, null, 2);
  }

  /** Valida la estructura mínima de un archivo importado. */
  function validarImportacion(datos) {
    if (!datos || typeof datos !== 'object') {
      return 'El archivo no contiene un objeto JSON válido.';
    }
    if (!Array.isArray(datos.eventos) || !Array.isArray(datos.ordenes)) {
      return 'El archivo debe incluir las listas "eventos" y "ordenes".';
    }

    const listasOpcionales = ['clientes', 'vehiculos', 'historial', 'catalogo'];
    const listaInvalida = listasOpcionales.find((clave) => {
      return datos[clave] !== undefined && !Array.isArray(datos[clave]);
    });
    if (listaInvalida) return `La lista "${listaInvalida}" tiene un formato incorrecto.`;
    if (datos.recordatorios !== undefined && (
      !datos.recordatorios || typeof datos.recordatorios !== 'object' || Array.isArray(datos.recordatorios)
    )) {
      return 'La lista "recordatorios" tiene un formato incorrecto.';
    }

    const ordenInvalida = datos.ordenes.find((orden) => {
      return !orden
        || typeof orden !== 'object'
        || typeof orden.numero_ficha !== 'string'
        || !orden.cliente
        || !orden.vehiculo
        || !Array.isArray(orden.servicios);
    });
    if (ordenInvalida) {
      return 'Hay una orden con datos incompletos o con un formato incorrecto.';
    }

    const eventoInvalido = datos.eventos.find((evento) => {
      return !evento
        || typeof evento !== 'object'
        || typeof evento.id !== 'string'
        || typeof evento.titulo !== 'string'
        || typeof evento.fecha_inicio !== 'string'
        || typeof evento.fecha_fin !== 'string';
    });
    if (eventoInvalido) {
      return 'Hay un evento con datos incompletos o con un formato incorrecto.';
    }

    const clienteInvalido = (datos.clientes || []).find((cliente) => {
      return !cliente || typeof cliente !== 'object' || typeof cliente.id !== 'string';
    });
    if (clienteInvalido) return 'Hay un cliente con datos incompletos o con un formato incorrecto.';

    const vehiculoInvalido = (datos.vehiculos || []).find((vehiculo) => {
      return !vehiculo || typeof vehiculo !== 'object' || typeof vehiculo.id !== 'string';
    });
    if (vehiculoInvalido) return 'Hay un vehículo con datos incompletos o con un formato incorrecto.';

    const historialInvalido = (datos.historial || []).find((registro) => {
      return !registro
        || typeof registro !== 'object'
        || typeof registro.id !== 'string'
        || typeof registro.id_orden !== 'string'
        || !Array.isArray(registro.servicios);
    });
    if (historialInvalido) return 'Hay un registro de historial con datos incompletos o con un formato incorrecto.';

    const catalogoInvalido = (datos.catalogo || []).find((servicio) => {
      return !servicio || typeof servicio !== 'object' || typeof servicio.nombre !== 'string';
    });
    if (catalogoInvalido) return 'Hay un servicio del catálogo con un formato incorrecto.';

    return '';
  }

  /**
   * Reemplaza todos los datos con un JSON importado.
   * Si falla una escritura, intenta restaurar el estado anterior.
   */
  function importarTodo(texto) {
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch (error) {
      return { ok: false, mensaje: 'El archivo no es un JSON válido.' };
    }
    const problema = validarImportacion(datos);
    if (problema) return { ok: false, mensaje: problema };

    const claves = [
      CLAVES.EVENTOS, CLAVES.ORDENES, CLAVES.CLIENTES, CLAVES.VEHICULOS,
      CLAVES.HISTORIAL, CLAVES.CATALOGO, CLAVES.RECORDATORIOS
    ];
    const previos = {};
    claves.forEach((clave) => { previos[clave] = leerCrudo(clave); });

    const nuevas = {
      [CLAVES.EVENTOS]: datos.eventos,
      [CLAVES.ORDENES]: datos.ordenes,
      [CLAVES.CLIENTES]: datos.clientes || [],
      [CLAVES.VEHICULOS]: datos.vehiculos || [],
      [CLAVES.HISTORIAL]: datos.historial || [],
      [CLAVES.CATALOGO]: datos.catalogo || [],
      [CLAVES.RECORDATORIOS]: datos.recordatorios || {}
    };

    for (const clave of claves) {
      const resultado = escribirJSON(clave, nuevas[clave]);
      if (!resultado.ok) {
        /* Se intenta volver al estado anterior. */
        claves.forEach((otra) => {
          if (previos[otra] !== null && previos[otra] !== undefined) escribirCrudo(otra, previos[otra]);
          else if (DISPONIBLE) {
            try { window.localStorage.removeItem(otra); } catch (error) { /* sin acción */ }
          }
        });
        return {
          ok: false,
          cuota: resultado.cuota,
          mensaje: resultado.cuota
            ? 'No hay espacio suficiente para importar los datos. Probá con fotos más livianas.'
            : 'No se pudieron guardar los datos importados.'
        };
      }
    }

    marcarInicializado();
    const migracion = migrarDatos();
    return {
      ok: true,
      eventos: datos.eventos,
      ordenes: datos.ordenes,
      clientes: obtenerClientes(),
      vehiculos: obtenerVehiculos(),
      historial: obtenerHistorial(),
      catalogo: obtenerCatalogo(),
      migracion
    };
  }

  /** Mensaje uniforme para errores de escritura. */
  function mensajeDeError(resultado) {
    if (!resultado) return 'No se pudieron guardar los datos.';
    if (resultado.cuota) {
      return 'No hay espacio en el navegador. Eliminá algunas fotos o exportá y restablecé los datos de demo.';
    }
    if (resultado.soloMemoria) {
      return 'El navegador bloquea el almacenamiento; los datos solo se conservarán mientras la pestaña esté abierta.';
    }
    return 'No se pudieron guardar los datos en este navegador.';
  }

  return {
    CLAVES,
    persistenciaDisponible: DISPONIBLE,
    obtenerEventos,
    guardarEventos,
    obtenerOrdenes,
    guardarOrdenes,
    obtenerOrden,
    obtenerClientes,
    guardarClientes,
    obtenerVehiculos,
    guardarVehiculos,
    obtenerHistorial,
    guardarHistorial,
    obtenerCatalogo,
    guardarCatalogo,
    obtenerRecordatorios,
    guardarRecordatorios,
    obtenerCliente,
    obtenerVehiculo,
    obtenerVehiculoPorPlaca,
    obtenerHistorialVehiculo,
    obtenerHistorialOrden,
    catalogoPredeterminado,
    buscarClienteEnLista,
    buscarVehiculoEnLista,
    crearClienteDesdeDatos,
    crearVehiculoDesdeDatos,
    construirRegistroHistorial,
    sincronizarHistorialOrden,
    actualizarKilometrajeVehiculo,
    marcarRecomendacionAtendida,
    marcarContactado,
    migrarDatos,
    inicializar,
    restablecerDemo,
    exportarTodo,
    importarTodo,
    mensajeDeError,
    estaInicializado,
    marcarInicializado
  };
})();
