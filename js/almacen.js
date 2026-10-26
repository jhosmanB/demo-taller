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
    INICIALIZADO: 'taller_demo_inicializado'
  };

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

  function obtenerEventos() {
    const eventos = leerJSON(CLAVES.EVENTOS, []);
    return Array.isArray(eventos) ? eventos : [];
  }

  function guardarEventos(eventos) {
    if (!Array.isArray(eventos)) return { ok: false, cuota: false };
    return escribirJSON(CLAVES.EVENTOS, eventos);
  }

  function obtenerOrdenes() {
    const ordenes = leerJSON(CLAVES.ORDENES, []);
    return Array.isArray(ordenes) ? ordenes : [];
  }

  function guardarOrdenes(ordenes) {
    if (!Array.isArray(ordenes)) return { ok: false, cuota: false };
    return escribirJSON(CLAVES.ORDENES, ordenes);
  }

  function obtenerOrden(numeroFicha) {
    return obtenerOrdenes().find((orden) => orden.numero_ficha === numeroFicha) || null;
  }

  function marcarInicializado() {
    return escribirCrudo(CLAVES.INICIALIZADO, '1');
  }

  function estaInicializado() {
    return leerCrudo(CLAVES.INICIALIZADO) === '1';
  }

  /** Carga los datos de demostración la primera vez que se abre la app. */
  function inicializar() {
    if (!estaInicializado()) {
      if (typeof DatosDemo !== 'undefined' && typeof DatosDemo.cargar === 'function') {
        DatosDemo.cargar();
      }
      marcarInicializado();
      return { sembrado: true };
    }
    /* Si las claves se perdieron o están dañadas, se dejan listas vacías. */
    if (!Array.isArray(leerJSON(CLAVES.EVENTOS, null))) {
      escribirJSON(CLAVES.EVENTOS, []);
    }
    if (!Array.isArray(leerJSON(CLAVES.ORDENES, null))) {
      escribirJSON(CLAVES.ORDENES, []);
    }
    return { sembrado: false };
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
      version: 1,
      exportado_en: aISOlocal(new Date()),
      eventos: obtenerEventos(),
      ordenes: obtenerOrdenes()
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

    const eventosPrevios = leerCrudo(CLAVES.EVENTOS);
    const ordenesPrevias = leerCrudo(CLAVES.ORDENES);

    const resultadoEventos = escribirJSON(CLAVES.EVENTOS, datos.eventos);
    if (!resultadoEventos.ok) {
      return {
        ok: false,
        cuota: resultadoEventos.cuota,
        mensaje: resultadoEventos.cuota
          ? 'No hay espacio suficiente para importar los eventos.'
          : 'No se pudieron guardar los eventos importados.'
      };
    }

    const resultadoOrdenes = escribirJSON(CLAVES.ORDENES, datos.ordenes);
    if (!resultadoOrdenes.ok) {
      /* Se intenta volver al estado anterior. */
      if (eventosPrevios !== null) escribirCrudo(CLAVES.EVENTOS, eventosPrevios);
      if (ordenesPrevias !== null) escribirCrudo(CLAVES.ORDENES, ordenesPrevias);
      return {
        ok: false,
        cuota: resultadoOrdenes.cuota,
        mensaje: resultadoOrdenes.cuota
          ? 'No hay espacio suficiente para importar las órdenes. Probá con fotos más livianas.'
          : 'No se pudieron guardar las órdenes importadas.'
      };
    }

    marcarInicializado();
    return { ok: true, eventos: datos.eventos, ordenes: datos.ordenes };
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
    inicializar,
    restablecerDemo,
    exportarTodo,
    importarTodo,
    mensajeDeError,
    estaInicializado,
    marcarInicializado
  };
})();
