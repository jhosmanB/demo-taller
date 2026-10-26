'use strict';

/* =========================================================
   MÓDULO DE AGENDA
   Calendario mensual, semanal y diario, edición de eventos,
   filtros por tipo y detección de superposiciones.
   ========================================================= */

const Agenda = (() => {
  const HORA_INICIO = 7;
  const HORA_FIN = 20;
  const ALTO_HORA = 60;
  const PX_POR_MINUTO = ALTO_HORA / 60;
  const MAX_PILDORAS_MES = 3;

  const estado = {
    fecha: new Date(),
    miniFecha: new Date(),
    vista: 'mes',
    eventos: [],
    tiposVisibles: new Set(Object.keys(TIPOS_EVENTO)),
    eventoDetalleId: null,
    eventoEnEdicion: null,
    guardadoPendiente: null,
    iniciado: false
  };

  const elementos = {};

  /* ---------------------------------------------------------
     Arranque y conexión de eventos
     --------------------------------------------------------- */
  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;
    estado.fecha = new Date();
    estado.miniFecha = new Date();
    estado.eventos = Almacen.obtenerEventos();

    elementos.contenido = document.getElementById('agenda-contenido');
    elementos.tituloPeriodo = document.getElementById('agenda-titulo-periodo');
    elementos.contadorConflictos = document.getElementById('contador-conflictos');
    elementos.botonConflictos = document.getElementById('btn-ver-conflictos');
    elementos.badgeConflictos = document.getElementById('badge-conflictos');
    elementos.listaConflictosLateral = document.getElementById('lista-conflictos-lateral');
    elementos.listaConflictosModal = document.getElementById('lista-conflictos-modal');
    elementos.miniCalendario = document.getElementById('mini-calendario');
    elementos.miniTitulo = document.getElementById('mini-titulo');
    elementos.leyenda = document.getElementById('leyenda-tipos');
    elementos.selectorTipo = document.getElementById('selector-tipo-evento');
    elementos.formEvento = document.getElementById('form-evento');
    elementos.cuerpoEvento = elementos.formEvento?.querySelector('.modal-cuerpo');
    elementos.scrollControles = document.getElementById('evento-scroll-controles');
    elementos.scrollArriba = document.getElementById('evento-scroll-arriba');
    elementos.scrollAbajo = document.getElementById('evento-scroll-abajo');
    elementos.modalEventoTitulo = document.getElementById('modal-evento-titulo');
    elementos.eventoTitulo = document.getElementById('evento-titulo');
    elementos.eventoFecha = document.getElementById('evento-fecha');
    elementos.eventoHoraInicio = document.getElementById('evento-hora-inicio');
    elementos.eventoHoraFin = document.getElementById('evento-hora-fin');
    elementos.eventoCliente = document.getElementById('evento-cliente');
    elementos.eventoPlaca = document.getElementById('evento-placa');
    elementos.eventoOrden = document.getElementById('evento-orden');
    elementos.eventoNotas = document.getElementById('evento-notas');
    elementos.eventoAviso = document.getElementById('evento-aviso-conflicto');
    elementos.listaAvisoConflicto = document.getElementById('lista-aviso-conflicto');
    elementos.detalleContenido = document.getElementById('detalle-evento-contenido');

    conectarEventos();
    renderizarSelectorTipo('recepcion');
    renderizar();
    iniciarReloj();
  }

  function conectarEventos() {
    document.getElementById('btn-agenda-hoy')?.addEventListener('click', irAHoy);
    document.getElementById('btn-agenda-anterior')?.addEventListener('click', () => navegar(-1));
    document.getElementById('btn-agenda-siguiente')?.addEventListener('click', () => navegar(1));
    document.getElementById('btn-crear-evento')?.addEventListener('click', () => abrirNuevoEvento());
    document.getElementById('btn-mini-anterior')?.addEventListener('click', () => cambiarMesMini(-1));
    document.getElementById('btn-mini-siguiente')?.addEventListener('click', () => cambiarMesMini(1));
    document.getElementById('btn-ver-conflictos')?.addEventListener('click', abrirModalConflictos);

    document.querySelectorAll('[data-vista-calendario]').forEach((boton) => {
      boton.addEventListener('click', () => cambiarVista(boton.dataset.vistaCalendario));
    });

    /* Clics dentro del calendario. */
    elementos.contenido?.addEventListener('click', manejarClicCalendario);
    elementos.contenido?.addEventListener('keydown', (evento) => {
      if (evento.key !== 'Enter' && evento.key !== ' ') return;
      const objetivo = evento.target.closest('[data-evento-id], [data-accion]');
      if (!objetivo) return;
      evento.preventDefault();
      objetivo.click();
    });

    /* Mini calendario. */
    elementos.miniCalendario?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-fecha-mini]');
      if (!boton) return;
      const fecha = parsearFechaHora(boton.dataset.fechaMini);
      if (!fecha) return;
      estado.fecha = fecha;
      estado.miniFecha = new Date(fecha.getTime());
      estado.vista = 'dia';
      renderizar();
    });

    /* Leyenda de tipos. */
    elementos.leyenda?.addEventListener('change', (evento) => {
      const input = evento.target.closest('input[data-tipo]');
      if (!input) return;
      if (input.checked) estado.tiposVisibles.add(input.dataset.tipo);
      else estado.tiposVisibles.delete(input.dataset.tipo);
      renderizar();
    });

    /* Selector de tipo del formulario. */
    elementos.selectorTipo?.addEventListener('change', () => {
      /* El estilo del selector se resuelve con :has; no hace falta más. */
    });

    /* Órdenes vinculadas. */
    elementos.eventoOrden?.addEventListener('change', completarDesdeOrden);

    /* Formulario de evento. */
    elementos.formEvento?.addEventListener('submit', manejarEnvioFormulario);
    elementos.cuerpoEvento?.addEventListener('scroll', actualizarControlesScrollEvento, { passive: true });
    elementos.scrollArriba?.addEventListener('click', () => desplazarFormularioEvento('arriba'));
    elementos.scrollAbajo?.addEventListener('click', () => desplazarFormularioEvento('abajo'));
    window.addEventListener('resize', actualizarControlesScrollEvento);

    /* Detalle: editar, eliminar y abrir orden. */
    document.getElementById('btn-editar-evento')?.addEventListener('click', () => {
      const evento = estado.eventos.find((item) => item.id === estado.eventoDetalleId);
      if (!evento) return;
      Modal.cerrar('modal-detalle-evento');
      abrirFormularioEvento({ evento });
    });

    document.getElementById('btn-eliminar-evento')?.addEventListener('click', eliminarEventoDetalle);

    elementos.detalleContenido?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-accion="ir-orden"]');
      if (!boton) return;
      irAOrden(boton.dataset.orden);
    });

    /* Lista de conflictos: abrir detalle del evento. */
    elementos.listaConflictosModal?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-evento-id]');
      if (!boton) return;
      Modal.cerrar('modal-conflictos');
      abrirDetalleEvento(boton.dataset.eventoId);
    });

    elementos.listaConflictosLateral?.addEventListener('click', (evento) => {
      const verTodos = evento.target.closest('[data-accion="ver-conflictos"]');
      if (verTodos) {
        abrirModalConflictos();
        return;
      }
      const boton = evento.target.closest('[data-evento-id]');
      if (!boton) return;
      abrirDetalleEvento(boton.dataset.eventoId);
    });

    /* Aviso al guardar un evento superpuesto. */
    document.getElementById('btn-guardar-igual')?.addEventListener('click', () => {
      const pendiente = estado.guardadoPendiente;
      if (!pendiente) return;
      Modal.cerrar('modal-aviso-conflicto');
      guardarEventoDefinitivo(pendiente.datos, pendiente.idOriginal);
    });

    document.getElementById('btn-cambiar-horario')?.addEventListener('click', () => {
      Modal.cerrar('modal-aviso-conflicto');
      setTimeout(() => {
        elementos.eventoHoraInicio?.focus();
        if (elementos.eventoHoraInicio && elementos.eventoHoraInicio.select) {
          elementos.eventoHoraInicio.select();
        }
      }, 100);
    });
  }

  /* ---------------------------------------------------------
     Utilidades de eventos y conflictos
     --------------------------------------------------------- */
  function solapan(eventoA, eventoB) {
    const inicioA = parsearFechaHora(eventoA.fecha_inicio);
    const finA = parsearFechaHora(eventoA.fecha_fin);
    const inicioB = parsearFechaHora(eventoB.fecha_inicio);
    const finB = parsearFechaHora(eventoB.fecha_fin);
    if (!inicioA || !finA || !inicioB || !finB) return false;
    return inicioA < finB && inicioB < finA;
  }

  function detectarConflictos(eventos) {
    const pares = [];
    const ordenados = [...eventos].sort((a, b) => {
      const inicioA = parsearFechaHora(a.fecha_inicio);
      const inicioB = parsearFechaHora(b.fecha_inicio);
      return (inicioA ? inicioA.getTime() : 0) - (inicioB ? inicioB.getTime() : 0);
    });
    for (let i = 0; i < ordenados.length; i += 1) {
      const actual = ordenados[i];
      const finActual = parsearFechaHora(actual.fecha_fin);
      for (let j = i + 1; j < ordenados.length; j += 1) {
        const siguiente = ordenados[j];
        const inicioSiguiente = parsearFechaHora(siguiente.fecha_inicio);
        if (finActual && inicioSiguiente && inicioSiguiente >= finActual) break;
        if (solapan(actual, siguiente)) {
          pares.push({ a: actual, b: siguiente });
        }
      }
    }
    return pares;
  }

  function conflictosCon(datos, idExcluir) {
    const candidato = {
      id: idExcluir || '__nuevo__',
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin
    };
    return estado.eventos
      .filter((evento) => evento.id !== idExcluir && solapan(candidato, evento))
      .sort((a, b) => parsearFechaHora(a.fecha_inicio) - parsearFechaHora(b.fecha_inicio));
  }

  function idsEnConflicto(pares) {
    const ids = new Set();
    pares.forEach(({ a, b }) => {
      ids.add(a.id);
      ids.add(b.id);
    });
    return ids;
  }

  function eventosDelDia(dia, eventos) {
    return eventos
      .filter((evento) => mismoDia(parsearFechaHora(evento.fecha_inicio), dia))
      .sort((a, b) => parsearFechaHora(a.fecha_inicio) - parsearFechaHora(b.fecha_inicio));
  }

  function tituloPeriodo() {
    const fecha = estado.fecha;
    if (estado.vista === 'mes') {
      return `${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
    }
    if (estado.vista === 'semana') {
      const inicio = inicioSemana(fecha);
      const fin = sumarDias(inicio, 6);
      if (inicio.getFullYear() !== fin.getFullYear()) {
        return `${inicio.getDate()} de ${MESES[inicio.getMonth()]} de ${inicio.getFullYear()} – ${fin.getDate()} de ${MESES[fin.getMonth()]} de ${fin.getFullYear()}`;
      }
      if (inicio.getMonth() !== fin.getMonth()) {
        return `${inicio.getDate()} de ${MESES[inicio.getMonth()]} – ${fin.getDate()} de ${MESES[fin.getMonth()]} de ${fin.getFullYear()}`;
      }
      return `${inicio.getDate()} – ${fin.getDate()} de ${MESES[inicio.getMonth()]} de ${fin.getFullYear()}`;
    }
    return `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  }

  /* ---------------------------------------------------------
     Render principal
     --------------------------------------------------------- */
  function renderizar() {
    if (!elementos.contenido) return;
    const pares = detectarConflictos(estado.eventos);
    const ids = idsEnConflicto(pares);
    const visibles = estado.eventos.filter((evento) => estado.tiposVisibles.has(evento.tipo));

    actualizarCabecera(pares);
    renderizarContenido(visibles, ids);
    renderizarMiniCalendario();
    renderizarLeyenda();
    renderizarPanelConflictos(pares);
    actualizarBotonesVista();
    if (window.actualizarContadoresApp) window.actualizarContadoresApp();
  }

  function actualizarCabecera(pares) {
    elementos.tituloPeriodo.textContent = capitalizar(tituloPeriodo());
    const cantidad = pares.length;
    elementos.contadorConflictos.textContent = `${cantidad} conflicto${cantidad === 1 ? '' : 's'}`;
    elementos.botonConflictos.classList.toggle('con-conflictos', cantidad > 0);
    elementos.badgeConflictos.textContent = String(cantidad);
  }

  function actualizarBotonesVista() {
    document.querySelectorAll('[data-vista-calendario]').forEach((boton) => {
      boton.classList.toggle('activo', boton.dataset.vistaCalendario === estado.vista);
      boton.setAttribute('aria-pressed', boton.dataset.vistaCalendario === estado.vista ? 'true' : 'false');
    });
  }

  function renderizarContenido(visibles, ids) {
    if (estado.vista === 'mes') {
      elementos.contenido.innerHTML = renderizarMes(visibles, ids);
      return;
    }
    const dias = estado.vista === 'semana'
      ? Array.from({ length: 7 }, (_, indice) => sumarDias(inicioSemana(estado.fecha), indice))
      : [inicioDelDia(estado.fecha)];
    elementos.contenido.innerHTML = renderizarSemana(dias, visibles, ids);
    ajustarScrollSemana();
  }

  function renderizarMes(visibles, ids) {
    const anio = estado.fecha.getFullYear();
    const mes = estado.fecha.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = sumarDias(primerDia, -desplazamiento);
    const hoy = new Date();
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    let html = '<div class="calendario-mes tarjeta">';
    html += '<div class="mes-encabezados">';
    diasSemana.forEach((dia) => { html += `<div class="mes-encabezado">${dia}</div>`; });
    html += '</div><div class="mes-cuadricula">';

    for (let indice = 0; indice < 42; indice += 1) {
      const dia = sumarDias(inicio, indice);
      const clave = aISOfecha(dia);
      const eventosDia = eventosDelDia(dia, visibles);
      const fueraDeMes = dia.getMonth() !== mes;
      const esHoy = mismoDia(dia, hoy);
      const esFinDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
      const clases = ['dia-mes', fueraDeMes ? 'fuera' : '', esHoy ? 'hoy' : '', esFinDeSemana ? 'fin-semana' : ''].filter(Boolean).join(' ');

      html += `<div class="${clases}" data-accion="nuevo-evento" data-fecha="${clave}" aria-label="${formatearFechaCorta(dia)}">`;
      html += `<div class="dia-mes-cabecera"><button type="button" class="numero-dia" data-accion="nuevo-evento" data-fecha="${clave}" aria-label="Crear evento el ${formatearFechaCorta(dia)}">${dia.getDate()}</button>`;
      if (eventosDia.length) {
        html += `<span class="dia-cuenta">${eventosDia.length}</span>`;
      }
      html += '</div><div class="dia-mes-eventos">';

      eventosDia.slice(0, MAX_PILDORAS_MES).forEach((evento) => {
        const conflicto = ids.has(evento.id);
        html += `<button type="button" class="evento-pildora tipo-${evento.tipo} ${conflicto ? 'en-conflicto' : ''}" data-evento-id="${escaparHTML(evento.id)}" title="${escaparHTML(evento.titulo)} · ${formatearRangoHoras(evento.fecha_inicio, evento.fecha_fin)}">
          <span class="pildora-hora">${formatearHora(evento.fecha_inicio)}</span>
          <span class="pildora-titulo">${escaparHTML(evento.titulo)}</span>
          ${conflicto ? '<span class="pildora-alerta" aria-label="Evento superpuesto">⚠</span>' : ''}
        </button>`;
      });

      if (eventosDia.length > MAX_PILDORAS_MES) {
        const restantes = eventosDia.length - MAX_PILDORAS_MES;
        html += `<button type="button" class="mas-eventos" data-accion="ver-dia" data-fecha="${clave}">+${restantes} más</button>`;
      }

      html += '</div></div>';
    }

    html += '</div></div>';
    return html;
  }

  function renderizarSemana(dias, visibles, ids) {
    const columnas = `64px repeat(${dias.length}, minmax(0, 1fr))`;
    const altoTotal = (HORA_FIN - HORA_INICIO) * ALTO_HORA;
    const hoy = new Date();
    const nombresCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    let html = `<div class="calendario-semana tarjeta ${dias.length === 1 ? 'vista-dia' : ''}">`;
    html += '<div class="semana-scroll"><div class="semana-interior">';
    html += `<div class="semana-cabecera" style="grid-template-columns:${columnas}">`;
    html += '<div class="esquina-hora"><span>Hora</span></div>';

    dias.forEach((dia) => {
      const esHoy = mismoDia(dia, hoy);
      html += `<div class="dia-cabecera ${esHoy ? 'hoy' : ''}">
        <span class="dia-cabecera-nombre">${nombresCortos[dia.getDay()]}</span>
        <span class="dia-cabecera-numero">${dia.getDate()}</span>
        <span class="dia-cabecera-mes">${MESES[dia.getMonth()].slice(0, 3)}</span>
      </div>`;
    });
    html += '</div>';

    html += `<div class="semana-cuerpo" style="grid-template-columns:${columnas};height:${altoTotal}px">`;
    html += '<div class="columna-horas">';
    for (let hora = HORA_INICIO; hora < HORA_FIN; hora += 1) {
      html += `<div class="hora-etiqueta" style="height:${ALTO_HORA}px">${dosDigitos(hora)}:00</div>`;
    }
    html += '</div>';

    dias.forEach((dia) => {
      const clave = aISOfecha(dia);
      const eventosDia = eventosDelDia(dia, visibles);
      const posiciones = calcularDisposicion(eventosDia);
      const esHoy = mismoDia(dia, hoy);
      html += `<div class="columna-dia ${esHoy ? 'hoy' : ''}" data-accion="nuevo-evento-hora" data-fecha="${clave}" style="height:${altoTotal}px">`;

      eventosDia.forEach((evento) => {
        const posicion = posiciones.get(evento.id) || { columna: 0, total: 1 };
        const inicio = parsearFechaHora(evento.fecha_inicio);
        const fin = parsearFechaHora(evento.fecha_fin);
        if (!inicio || !fin) return;
        const inicioMin = Math.max(minutosDesdeMedianoche(inicio), HORA_INICIO * 60);
        const finMin = Math.min(minutosDesdeMedianoche(fin), HORA_FIN * 60);
        if (finMin <= inicioMin) return;
        const top = (inicioMin - HORA_INICIO * 60) * PX_POR_MINUTO;
        const alto = Math.max(24, (finMin - inicioMin) * PX_POR_MINUTO - 2);
        const ancho = 100 / posicion.total;
        const izquierda = posicion.columna * ancho;
        const conflicto = ids.has(evento.id);
        const mostrarMeta = alto >= 58 && (evento.cliente || evento.placa);
        const meta = [evento.cliente, evento.placa].filter(Boolean).join(' · ');

        html += `<button type="button" class="evento-bloque tipo-${evento.tipo} ${conflicto ? 'en-conflicto' : ''}" data-evento-id="${escaparHTML(evento.id)}"
          style="top:${top}px;height:${alto}px;left:calc(${izquierda}% + 2px);width:calc(${ancho}% - 4px)"
          title="${escaparHTML(evento.titulo)} · ${formatearRangoHoras(evento.fecha_inicio, evento.fecha_fin)}">
          <span class="evento-bloque-hora">${formatearRangoHoras(evento.fecha_inicio, evento.fecha_fin)}</span>
          <span class="evento-bloque-titulo">${escaparHTML(evento.titulo)}</span>
          ${mostrarMeta ? `<span class="evento-bloque-meta">${escaparHTML(meta)}</span>` : ''}
          ${conflicto ? '<span class="evento-bloque-alerta" aria-label="Evento superpuesto">⚠</span>' : ''}
        </button>`;
      });

      html += '</div>';
    });

    const ahora = new Date();
    const diaDeHoy = dias.some((dia) => mismoDia(dia, ahora));
    const minutosAhora = minutosDesdeMedianoche(ahora);
    if (diaDeHoy && minutosAhora >= HORA_INICIO * 60 && minutosAhora <= HORA_FIN * 60) {
      const top = (minutosAhora - HORA_INICIO * 60) * PX_POR_MINUTO;
      html += `<div class="linea-ahora" style="top:${top}px"><span class="linea-ahora-punto"></span><span class="linea-ahora-etiqueta">${formatearHora(ahora)}</span></div>`;
    }

    html += '</div></div></div></div>';
    return html;
  }

  /**
   * Distribuye eventos superpuestos en columnas, como Google Calendar.
   * Devuelve un Map con id → { columna, total }.
   */
  function calcularDisposicion(eventos) {
    const resultado = new Map();
    if (!eventos.length) return resultado;

    const ordenados = [...eventos].sort((a, b) => {
      const inicioA = parsearFechaHora(a.fecha_inicio);
      const inicioB = parsearFechaHora(b.fecha_inicio);
      const finA = parsearFechaHora(a.fecha_fin);
      const finB = parsearFechaHora(b.fecha_fin);
      return (inicioA - inicioB) || (finA - finB);
    });

    const grupos = [];
    let grupoActual = [];
    let finMaximo = -Infinity;

    ordenados.forEach((evento) => {
      const inicio = parsearFechaHora(evento.fecha_inicio);
      const fin = parsearFechaHora(evento.fecha_fin);
      if (!inicio || !fin) return;
      const inicioMin = minutosDesdeMedianoche(inicio);
      const finMin = minutosDesdeMedianoche(fin);
      if (grupoActual.length && inicioMin >= finMaximo) {
        grupos.push(grupoActual);
        grupoActual = [];
        finMaximo = -Infinity;
      }
      grupoActual.push({ evento, inicioMin, finMin });
      finMaximo = Math.max(finMaximo, finMin);
    });
    if (grupoActual.length) grupos.push(grupoActual);

    grupos.forEach((grupo) => {
      const finesPorColumna = [];
      grupo.forEach((item) => {
        let columna = finesPorColumna.findIndex((fin) => fin <= item.inicioMin);
        if (columna === -1) {
          columna = finesPorColumna.length;
          finesPorColumna.push(item.finMin);
        } else {
          finesPorColumna[columna] = item.finMin;
        }
        item.columna = columna;
      });
      const total = finesPorColumna.length;
      grupo.forEach((item) => {
        resultado.set(item.evento.id, { columna: item.columna, total });
      });
    });

    return resultado;
  }

  function ajustarScrollSemana() {
    const contenedor = elementos.contenido.querySelector('.semana-scroll');
    if (!contenedor) return;
    requestAnimationFrame(() => {
      const ahora = new Date();
      const esHoyVisible = estado.vista === 'dia'
        ? mismoDia(estado.fecha, ahora)
        : [0, 1, 2, 3, 4, 5, 6].some((indice) => mismoDia(sumarDias(inicioSemana(estado.fecha), indice), ahora));
      const minutos = minutosDesdeMedianoche(ahora);
      const objetivo = esHoyVisible && minutos > HORA_INICIO * 60
        ? (minutos - HORA_INICIO * 60) * PX_POR_MINUTO - 90
        : 60;
      contenedor.scrollTop = Math.max(0, Math.min(objetivo, (HORA_FIN - HORA_INICIO) * ALTO_HORA - 200));
    });
  }

  function renderizarMiniCalendario() {
    const fecha = estado.miniFecha;
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = sumarDias(primerDia, -desplazamiento);
    const hoy = new Date();
    const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    elementos.miniTitulo.textContent = `${capitalizar(MESES[mes])} ${anio}`;
    let html = '<div class="mini-dias-semana">';
    letras.forEach((letra) => { html += `<span>${letra}</span>`; });
    html += '</div><div class="mini-dias">';

    for (let indice = 0; indice < 42; indice += 1) {
      const dia = sumarDias(inicio, indice);
      const clave = aISOfecha(dia);
      const fuera = dia.getMonth() !== mes;
      const esHoy = mismoDia(dia, hoy);
      const seleccionado = mismoDia(dia, estado.fecha);
      const tieneEventos = estado.eventos.some((evento) => aISOfecha(parsearFechaHora(evento.fecha_inicio)) === clave);
      const clases = ['mini-dia', fuera ? 'fuera' : '', esHoy ? 'hoy' : '', seleccionado ? 'seleccionado' : '', tieneEventos ? 'con-eventos' : ''].filter(Boolean).join(' ');
      html += `<button type="button" class="${clases}" data-fecha-mini="${clave}" aria-label="${formatearFechaCorta(dia)}${tieneEventos ? ', con eventos' : ''}">${dia.getDate()}</button>`;
    }

    html += '</div>';
    elementos.miniCalendario.innerHTML = html;
  }

  function renderizarLeyenda() {
    const conteos = {};
    estado.eventos.forEach((evento) => {
      conteos[evento.tipo] = (conteos[evento.tipo] || 0) + 1;
    });

    elementos.leyenda.innerHTML = Object.entries(TIPOS_EVENTO).map(([clave, tipo]) => {
      const visible = estado.tiposVisibles.has(clave);
      return `<label class="leyenda-item ${visible ? '' : 'leyenda-item-oculta'}">
        <input type="checkbox" data-tipo="${clave}" ${visible ? 'checked' : ''}>
        <span class="leyenda-check" aria-hidden="true"></span>
        <span class="leyenda-color" style="background:${tipo.color}"></span>
        <span class="leyenda-icono" style="color:${tipo.color}">${icono(tipo.icono)}</span>
        <span class="leyenda-nombre">${escaparHTML(tipo.etiqueta)}</span>
        <span class="leyenda-cuenta">${conteos[clave] || 0}</span>
      </label>`;
    }).join('');
  }

  function renderizarPanelConflictos(pares) {
    if (!pares.length) {
      elementos.listaConflictosLateral.innerHTML = `
        <div class="sin-conflictos">
          <span class="sin-conflictos-icono">✓</span>
          <p>Sin superposiciones por ahora.</p>
        </div>`;
      return;
    }

    elementos.listaConflictosLateral.innerHTML = pares.slice(0, 4).map(({ a, b }) => `
      <button type="button" class="conflicto-mini" data-evento-id="${escaparHTML(a.id)}">
        <span class="conflicto-mini-hora">${formatearFecha(a.fecha_inicio)} · ${formatearRangoHoras(a.fecha_inicio, a.fecha_fin)}</span>
        <span class="conflicto-mini-titulo">${escaparHTML(a.titulo)}</span>
        <span class="conflicto-mini-cruce">se cruza con ${escaparHTML(b.titulo)}</span>
      </button>
    `).join('') + (pares.length > 4
      ? `<button type="button" class="ver-todos-conflictos" data-accion="ver-conflictos">Ver los ${pares.length} conflictos</button>`
      : '');
  }

  function renderizarListaConflictos(pares) {
    if (!pares.length) {
      return `<div class="sin-conflictos sin-conflictos-grande"><span class="sin-conflictos-icono">✓</span><p>No hay eventos superpuestos en la agenda.</p></div>`;
    }
    return pares.map(({ a, b }) => `
      <div class="conflicto-item">
        <div class="conflicto-item-cabecera">
          <span>${capitalizar(formatearFechaCorta(a.fecha_inicio))} · ${formatearRangoHoras(a.fecha_inicio, a.fecha_fin)}</span>
          <span class="conflicto-etiqueta">Superposición</span>
        </div>
        <div class="conflicto-eventos">
          <button type="button" class="conflicto-evento" data-evento-id="${escaparHTML(a.id)}">
            <span class="conflicto-evento-hora">${formatearHora(a.fecha_inicio)}</span>
            <span>${escaparHTML(a.titulo)}</span>
          </button>
          <span class="conflicto-vs">se cruza con</span>
          <button type="button" class="conflicto-evento" data-evento-id="${escaparHTML(b.id)}">
            <span class="conflicto-evento-hora">${formatearHora(b.fecha_inicio)}</span>
            <span>${escaparHTML(b.titulo)}</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------
     Navegación y cambio de vista
     --------------------------------------------------------- */
  function navegar(direccion) {
    if (estado.vista === 'mes') {
      const dia = estado.fecha.getDate();
      const destino = new Date(estado.fecha.getFullYear(), estado.fecha.getMonth() + direccion, 1);
      const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
      destino.setDate(Math.min(dia, ultimoDia));
      estado.fecha = destino;
    } else if (estado.vista === 'semana') {
      estado.fecha = sumarDias(estado.fecha, direccion * 7);
    } else {
      estado.fecha = sumarDias(estado.fecha, direccion);
    }
    estado.miniFecha = new Date(estado.fecha.getTime());
    renderizar();
  }

  function irAHoy() {
    estado.fecha = new Date();
    estado.miniFecha = new Date();
    renderizar();
  }

  function cambiarVista(vista) {
    if (!['mes', 'semana', 'dia'].includes(vista)) return;
    estado.vista = vista;
    estado.miniFecha = new Date(estado.fecha.getTime());
    renderizar();
  }

  function cambiarMesMini(direccion) {
    estado.miniFecha = new Date(estado.miniFecha.getFullYear(), estado.miniFecha.getMonth() + direccion, 1);
    renderizarMiniCalendario();
  }

  function manejarClicCalendario(evento) {
    const botonEvento = evento.target.closest('[data-evento-id]');
    if (botonEvento) {
      evento.stopPropagation();
      abrirDetalleEvento(botonEvento.dataset.eventoId);
      return;
    }

    const verDia = evento.target.closest('[data-accion="ver-dia"]');
    if (verDia) {
      evento.stopPropagation();
      const fecha = parsearFechaHora(verDia.dataset.fecha);
      if (fecha) {
        estado.fecha = fecha;
        estado.miniFecha = new Date(fecha.getTime());
        estado.vista = 'dia';
        renderizar();
      }
      return;
    }

    const verConflictos = evento.target.closest('[data-accion="ver-conflictos"]');
    if (verConflictos) {
      abrirModalConflictos();
      return;
    }

    const nuevoEnHora = evento.target.closest('[data-accion="nuevo-evento-hora"]');
    if (nuevoEnHora) {
      const fecha = parsearFechaHora(nuevoEnHora.dataset.fecha);
      if (!fecha) return;
      const rect = nuevoEnHora.getBoundingClientRect();
      const desplazamiento = Math.max(0, evento.clientY - rect.top);
      let minutos = HORA_INICIO * 60 + Math.floor((desplazamiento / PX_POR_MINUTO) / 30) * 30;
      minutos = Math.max(HORA_INICIO * 60, Math.min(minutos, (HORA_FIN - 1) * 60));
      const horaInicio = `${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`;
      const minutosFin = Math.min(minutos + 60, HORA_FIN * 60);
      const horaFin = `${dosDigitos(Math.floor(minutosFin / 60))}:${dosDigitos(minutosFin % 60)}`;
      abrirFormularioEvento({
        fecha: aISOfecha(fecha),
        horaInicio,
        horaFin,
        tipo: 'recepcion'
      });
      return;
    }

    const nuevo = evento.target.closest('[data-accion="nuevo-evento"]');
    if (nuevo) {
      const fecha = parsearFechaHora(nuevo.dataset.fecha);
      if (!fecha) return;
      abrirFormularioEvento({
        fecha: aISOfecha(fecha),
        horaInicio: '09:00',
        horaFin: '10:00',
        tipo: 'recepcion'
      });
    }
  }

  /* ---------------------------------------------------------
     Formulario de evento
     --------------------------------------------------------- */
  function renderizarSelectorTipo(tipoSeleccionado) {
    elementos.selectorTipo.innerHTML = Object.entries(TIPOS_EVENTO).map(([clave, tipo]) => `
      <label class="tipo-opcion" style="--tipo-color:${tipo.color}">
        <input type="radio" name="evento-tipo" value="${clave}" ${clave === tipoSeleccionado ? 'checked' : ''}>
        <span class="tipo-opcion-contenido">
          <span class="tipo-opcion-icono">${icono(tipo.icono)}</span>
          <span>${escaparHTML(tipo.etiqueta)}</span>
        </span>
      </label>
    `).join('');
  }

  function tipoSeleccionado() {
    const input = elementos.formEvento.querySelector('input[name="evento-tipo"]:checked');
    return input ? input.value : 'recepcion';
  }

  function cargarOpcionesOrdenes(idSeleccionado) {
    const ordenes = Almacen.obtenerOrdenes().sort((a, b) => b.numero_ficha.localeCompare(a.numero_ficha));
    let opciones = '<option value="">Sin orden vinculada</option>';
    ordenes.forEach((orden) => {
      const etiqueta = `${orden.numero_ficha} · ${orden.cliente.nombre_razon_social} · ${orden.vehiculo.placa}`;
      opciones += `<option value="${escaparHTML(orden.numero_ficha)}">${escaparHTML(etiqueta)}</option>`;
    });
    if (idSeleccionado && !ordenes.some((orden) => orden.numero_ficha === idSeleccionado)) {
      opciones += `<option value="${escaparHTML(idSeleccionado)}">${escaparHTML(idSeleccionado)} (orden no encontrada)</option>`;
    }
    elementos.eventoOrden.innerHTML = opciones;
    elementos.eventoOrden.value = idSeleccionado || '';
  }

  /**
   * Muestra u oculta los controles de desplazamiento del formulario
   * y deshabilita la flecha que ya no tiene recorrido.
   */
  function actualizarControlesScrollEvento() {
    const cuerpo = elementos.cuerpoEvento;
    const controles = elementos.scrollControles;
    if (!cuerpo || !controles) return;

    const desborda = cuerpo.scrollHeight > cuerpo.clientHeight + 4;
    controles.hidden = !desborda;
    if (!desborda) return;

    const maximo = cuerpo.scrollHeight - cuerpo.clientHeight;
    if (elementos.scrollArriba) elementos.scrollArriba.disabled = cuerpo.scrollTop <= 2;
    if (elementos.scrollAbajo) elementos.scrollAbajo.disabled = cuerpo.scrollTop >= maximo - 2;
  }

  /** Lleva el cuerpo del formulario al inicio o al final. */
  function desplazarFormularioEvento(direccion) {
    const cuerpo = elementos.cuerpoEvento;
    if (!cuerpo) return;

    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    cuerpo.scrollTo({
      top: direccion === 'arriba' ? 0 : cuerpo.scrollHeight,
      behavior: reducido ? 'auto' : 'smooth'
    });
    setTimeout(actualizarControlesScrollEvento, 350);
  }

  function abrirNuevoEvento() {
    abrirFormularioEvento({});
  }

  function abrirFormularioEvento(opciones = {}) {
    const {
      evento = null,
      fecha = aISOfecha(new Date()),
      horaInicio = '09:00',
      horaFin = '10:00',
      tipo = 'recepcion',
      titulo = '',
      idOrden = '',
      cliente = '',
      placa = ''
    } = opciones;

    estado.eventoEnEdicion = evento ? evento.id : null;
    estado.guardadoPendiente = null;

    elementos.formEvento.reset();
    elementos.eventoAviso.classList.add('oculto');
    elementos.eventoAviso.innerHTML = '';

    if (evento) {
      const inicio = parsearFechaHora(evento.fecha_inicio);
      const fin = parsearFechaHora(evento.fecha_fin);
      elementos.modalEventoTitulo.textContent = 'Editar evento';
      elementos.eventoTitulo.value = evento.titulo || '';
      renderizarSelectorTipo(evento.tipo || 'recepcion');
      elementos.eventoFecha.value = inicio ? aISOfecha(inicio) : fecha;
      elementos.eventoHoraInicio.value = inicio ? aISOhora(inicio) : horaInicio;
      elementos.eventoHoraFin.value = fin ? aISOhora(fin) : horaFin;
      elementos.eventoCliente.value = evento.cliente || '';
      elementos.eventoPlaca.value = evento.placa || '';
      elementos.eventoNotas.value = evento.notas || '';
      cargarOpcionesOrdenes(evento.id_orden || '');
    } else {
      elementos.modalEventoTitulo.textContent = 'Nuevo evento';
      elementos.eventoTitulo.value = titulo;
      renderizarSelectorTipo(tipo);
      elementos.eventoFecha.value = fecha;
      elementos.eventoHoraInicio.value = horaInicio;
      elementos.eventoHoraFin.value = horaFin;
      elementos.eventoCliente.value = cliente;
      elementos.eventoPlaca.value = placa;
      elementos.eventoNotas.value = '';
      cargarOpcionesOrdenes(idOrden);
    }

    if (elementos.cuerpoEvento) elementos.cuerpoEvento.scrollTop = 0;
    Modal.abrir('modal-evento');
    setTimeout(() => {
      actualizarControlesScrollEvento();
      if (!elementos.eventoTitulo.value) elementos.eventoTitulo.focus();
      else elementos.eventoTitulo.select();
    }, 100);
    /* Segundo ajuste por si las fuentes o el alto del modal cambian. */
    setTimeout(actualizarControlesScrollEvento, 320);
  }

  function completarDesdeOrden() {
    const id = elementos.eventoOrden.value;
    if (!id) return;
    const orden = Almacen.obtenerOrden(id);
    if (!orden) return;
    if (!elementos.eventoCliente.value.trim()) {
      elementos.eventoCliente.value = orden.cliente.nombre_razon_social;
    }
    if (!elementos.eventoPlaca.value.trim()) {
      elementos.eventoPlaca.value = orden.vehiculo.placa;
    }
    if (!elementos.eventoTitulo.value.trim()) {
      const tipo = tipoSeleccionado();
      const prefijo = tipo === 'entrega' ? 'Entrega' : tipo === 'recepcion' ? 'Recepción' : TIPOS_EVENTO[tipo].etiqueta;
      const primerNombre = String(orden.cliente.nombre_razon_social).split(' ')[0];
      elementos.eventoTitulo.value = `${prefijo} ${orden.vehiculo.marca} ${orden.vehiculo.modelo} - ${primerNombre}`;
    }
  }

  function leerFormularioEvento() {
    const fecha = elementos.eventoFecha.value;
    const inicio = elementos.eventoHoraInicio.value;
    const fin = elementos.eventoHoraFin.value;
    return {
      titulo: elementos.eventoTitulo.value.trim(),
      tipo: tipoSeleccionado(),
      fecha_inicio: fecha && inicio ? `${fecha}T${inicio}` : '',
      fecha_fin: fecha && fin ? `${fecha}T${fin}` : '',
      cliente: elementos.eventoCliente.value.trim(),
      placa: normalizarPlaca(elementos.eventoPlaca.value),
      id_orden: elementos.eventoOrden.value,
      notas: elementos.eventoNotas.value.trim()
    };
  }

  function validarEvento(datos) {
    if (!datos.titulo) return 'Escribí un título para el evento.';
    if (!datos.fecha_inicio || !datos.fecha_fin) return 'Completá la fecha y las horas de inicio y fin.';
    const inicio = parsearFechaHora(datos.fecha_inicio);
    const fin = parsearFechaHora(datos.fecha_fin);
    if (!inicio || !fin) return 'La fecha u hora ingresada no es válida.';
    if (fin <= inicio) return 'La hora de fin debe ser posterior a la hora de inicio.';
    return '';
  }

  function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    const datos = leerFormularioEvento();
    const problema = validarEvento(datos);
    if (problema) {
      mostrarToast(problema, 'error');
      elementos.eventoAviso.className = 'aviso-inline';
      elementos.eventoAviso.textContent = problema;
      return;
    }
    elementos.eventoAviso.className = 'aviso-inline oculto';

    const idOriginal = estado.eventoEnEdicion;
    const conflictos = conflictosCon(datos, idOriginal);

    if (conflictos.length) {
      estado.guardadoPendiente = { datos, idOriginal };
      elementos.listaAvisoConflicto.innerHTML = conflictos.map((eventoConflicto) => `
        <div class="conflicto-aviso-linea">
          ${tipoEventoBadge(eventoConflicto.tipo)}
          <div>
            <strong>${escaparHTML(eventoConflicto.titulo)}</strong>
            <span>${formatearFecha(eventoConflicto.fecha_inicio)} · ${formatearRangoHoras(eventoConflicto.fecha_inicio, eventoConflicto.fecha_fin)}</span>
          </div>
        </div>
      `).join('');
      Modal.abrir('modal-aviso-conflicto');
      return;
    }

    guardarEventoDefinitivo(datos, idOriginal);
  }

  function guardarEventoDefinitivo(datos, idOriginal) {
    const eventos = Almacen.obtenerEventos();
    let id = idOriginal;
    let mensaje = 'Evento actualizado.';

    if (id) {
      const indice = eventos.findIndex((evento) => evento.id === id);
      if (indice === -1) {
        mostrarToast('El evento ya no existe. Se recargó la agenda.', 'error');
        recargar();
        return;
      }
      eventos[indice] = { ...eventos[indice], ...datos, id };
    } else {
      id = generarId('EV', eventos);
      eventos.push({ id, ...datos });
      mensaje = 'Evento creado en la agenda.';
    }

    const resultado = Almacen.guardarEventos(eventos);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6500);
      return;
    }

    estado.eventos = eventos;
    estado.eventoEnEdicion = null;
    estado.guardadoPendiente = null;
    Modal.cerrar('modal-aviso-conflicto');
    Modal.cerrar('modal-evento');
    mostrarToast(mensaje, 'exito');
    renderizar();
  }

  function abrirDetalleEvento(id) {
    const evento = estado.eventos.find((item) => item.id === id);
    if (!evento) {
      mostrarToast('No se encontró el evento.', 'error');
      return;
    }
    estado.eventoDetalleId = id;
    const inicio = parsearFechaHora(evento.fecha_inicio);
    const fin = parsearFechaHora(evento.fecha_fin);
    const conflictos = conflictosCon(evento, evento.id);
    const notas = evento.notas ? escaparHTML(evento.notas) : '<span class="texto-suave">Sin notas.</span>';

    let html = `
      <div class="detalle-evento-cabecera">
        ${tipoEventoBadge(evento.tipo)}
        <h3>${escaparHTML(evento.titulo)}</h3>
        ${conflictos.length ? `<div class="alerta-detalle">⚠ Este evento se superpone con ${conflictos.length} evento${conflictos.length === 1 ? '' : 's'}.</div>` : ''}
      </div>
      <dl class="detalle-evento">
        <div><dt>Fecha y hora</dt><dd>${inicio ? capitalizar(formatearFechaLarga(inicio)) : '—'}</dd></div>
        <div><dt>Horario</dt><dd>${formatearRangoHoras(evento.fecha_inicio, evento.fecha_fin)}</dd></div>
        <div><dt>Cliente</dt><dd>${evento.cliente ? escaparHTML(evento.cliente) : '<span class="texto-suave">No especificado</span>'}</dd></div>
        <div><dt>Placa</dt><dd>${evento.placa ? escaparHTML(evento.placa) : '<span class="texto-suave">No especificada</span>'}</dd></div>
        <div><dt>Notas</dt><dd>${notas}</dd></div>
      </dl>
    `;

    if (evento.id_orden) {
      html += `<button type="button" class="enlace-orden" data-accion="ir-orden" data-orden="${escaparHTML(evento.id_orden)}">
        ${icono('ordenes')} Ver orden de trabajo ${escaparHTML(evento.id_orden)}
      </button>`;
    }

    if (conflictos.length) {
      html += `<div class="detalle-conflictos"><strong>Eventos en conflicto</strong>${conflictos.map((otro) => `
        <div class="detalle-conflicto-linea">
          <span>${formatearHora(otro.fecha_inicio)} · ${escaparHTML(otro.titulo)}</span>
        </div>
      `).join('')}</div>`;
    }

    elementos.detalleContenido.innerHTML = html;
    Modal.abrir('modal-detalle-evento');
  }

  async function eliminarEventoDetalle() {
    const evento = estado.eventos.find((item) => item.id === estado.eventoDetalleId);
    if (!evento) return;
    const confirmado = await confirmarAccion({
      titulo: 'Eliminar evento',
      mensaje: `¿Eliminar "${evento.titulo}" del ${formatearFecha(evento.fecha_inicio)}? Esta acción no se puede deshacer.`,
      textoAceptar: 'Eliminar',
      peligro: true
    });
    if (!confirmado) return;

    const eventos = Almacen.obtenerEventos().filter((item) => item.id !== evento.id);
    const resultado = Almacen.guardarEventos(eventos);
    if (!resultado.ok) {
      mostrarToast(Almacen.mensajeDeError(resultado), 'error', 6500);
      return;
    }
    estado.eventos = eventos;
    Modal.cerrar('modal-detalle-evento');
    mostrarToast('Evento eliminado.', 'exito');
    renderizar();
  }

  function abrirModalConflictos() {
    const pares = detectarConflictos(estado.eventos);
    elementos.listaConflictosModal.innerHTML = renderizarListaConflictos(pares);
    Modal.abrir('modal-conflictos');
  }

  function irAOrden(idOrden) {
    if (!idOrden) return;
    Modal.cerrar('modal-detalle-evento');
    if (window.mostrarVista) window.mostrarVista('ordenes');
    if (window.Ordenes && typeof Ordenes.abrirOrden === 'function') {
      Ordenes.abrirOrden(idOrden);
    } else {
      mostrarToast(`La orden ${idOrden} no está disponible en esta vista.`, 'aviso');
    }
  }

  /* ---------------------------------------------------------
     API pública y reloj
     --------------------------------------------------------- */
  function recargar() {
    estado.eventos = Almacen.obtenerEventos();
    if (estado.iniciado) renderizar();
  }

  function programarEntrega(orden) {
    if (!orden) return;
    const manana = sumarDias(new Date(), 1);
    const primerNombre = String(orden.cliente.nombre_razon_social).split(' ')[0];
    abrirFormularioEvento({
      fecha: aISOfecha(manana),
      horaInicio: '10:00',
      horaFin: '11:00',
      tipo: 'entrega',
      titulo: `Entrega ${orden.vehiculo.marca} ${orden.vehiculo.modelo} - ${primerNombre}`,
      idOrden: orden.numero_ficha,
      cliente: orden.cliente.nombre_razon_social,
      placa: orden.vehiculo.placa
    });
  }

  function iniciarReloj() {
    setInterval(() => {
      const linea = elementos.contenido?.querySelector('.linea-ahora');
      if (!linea) return;
      const ahora = new Date();
      const minutos = minutosDesdeMedianoche(ahora);
      if (minutos < HORA_INICIO * 60 || minutos > HORA_FIN * 60) return;
      linea.style.top = `${(minutos - HORA_INICIO * 60) * PX_POR_MINUTO}px`;
      const etiqueta = linea.querySelector('.linea-ahora-etiqueta');
      if (etiqueta) etiqueta.textContent = formatearHora(ahora);
    }, 60000);
  }

  return {
    iniciar,
    recargar,
    abrirEvento: abrirDetalleEvento,
    programarEntrega,
    irAOrden
  };
})();

/* Se expone en window para que el arranque de index.html pueda usarlo. */
window.Agenda = Agenda;
