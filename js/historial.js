'use strict';

/* =========================================================
   HISTORIAL DE SERVICIOS
   Línea de tiempo, estado de mantenimiento, gráfico de
   kilometraje e impresión del carnet de servicio.
   ========================================================= */

const Historial = (() => {
  /* ---------------------------------------------------------
     Consultas y ordenamiento
     --------------------------------------------------------- */
  function ordenarDesc(registros) {
    return [...registros].sort((a, b) => {
      const claveA = String(a.fecha_ingreso || a.fecha_entrega || '');
      const claveB = String(b.fecha_ingreso || b.fecha_entrega || '');
      return claveB.localeCompare(claveA);
    });
  }

  function registrosDeCliente(idCliente) {
    if (!idCliente) return [];
    return ordenarDesc(Almacen.obtenerHistorial().filter((registro) => registro.id_cliente === idCliente));
  }

  function registrosDeVehiculo(idVehiculo) {
    if (!idVehiculo) return [];
    return ordenarDesc(Almacen.obtenerHistorial().filter((registro) => registro.id_vehiculo === idVehiculo));
  }

  function fechaVisita(registro) {
    return registro?.fecha_entrega || registro?.fecha_ingreso || '';
  }

  function nombreVehiculo(registro) {
    const nombre = [registro?.vehiculo_marca, registro?.vehiculo_modelo].filter(Boolean).join(' ');
    return nombre || 'Vehículo sin datos';
  }

  function fotosDeOrden(idOrden) {
    const orden = Almacen.obtenerOrden(idOrden);
    return Array.isArray(orden?.fotos) ? orden.fotos.filter((foto) => foto && foto.data) : [];
  }

  /* ---------------------------------------------------------
     Etiquetas visuales
     --------------------------------------------------------- */
  function categoriaBadge(categoria) {
    const etiqueta = CATEGORIAS_TRABAJO[categoria] || categoria || 'Sin categoría';
    return `<span class="badge badge-categoria badge-categoria-${escaparHTML(categoria || 'otro')}">${escaparHTML(etiqueta)}</span>`;
  }

  function urgenciaBadge(urgencia) {
    const valor = URGENCIAS_RECOMENDACION[urgencia] ? urgencia : 'media';
    return `<span class="badge badge-urgencia badge-urgencia-${valor}">${escaparHTML(URGENCIAS_RECOMENDACION[valor])}</span>`;
  }

  function claseEstadoMantenimiento(estado) {
    return {
      vencido: 'mantenimiento-vencido',
      proximo: 'mantenimiento-proximo',
      'al-dia': 'mantenimiento-aldia',
      'sin-datos': 'mantenimiento-sin-datos'
    }[estado] || 'mantenimiento-sin-datos';
  }

  function textoEstadoMantenimiento(estado) {
    return {
      vencido: 'Vencido',
      proximo: 'Próximo a vencer',
      'al-dia': 'Al día',
      'sin-datos': 'Sin programar'
    }[estado] || 'Sin programar';
  }

  /* ---------------------------------------------------------
     Línea de tiempo
     --------------------------------------------------------- */
  function serviciosHTML(registro) {
    const servicios = Array.isArray(registro.servicios) ? registro.servicios : [];
    if (!servicios.length) return '<li class="linea-sin-datos">Sin servicios detallados.</li>';
    return servicios.map((servicio) => `
      <li>
        <span>${escaparHTML(servicio.nombre || 'Servicio')}</span>
        <strong>${formatearMoneda(servicio.importe)}</strong>
      </li>
    `).join('');
  }

  function repuestosHTML(registro) {
    const repuestos = Array.isArray(registro.repuestos) ? registro.repuestos : [];
    if (!repuestos.length) return '';
    const items = repuestos.map((repuesto) => `
      <li>${escaparHTML(repuesto.nombre || 'Repuesto')} <span>× ${Number(repuesto.cantidad) || 1}</span></li>
    `).join('');
    return `
      <div class="linea-repuestos">
        <span class="linea-etiqueta">Repuestos</span>
        <ul>${items}</ul>
      </div>
    `;
  }

  function recomendacionesHTML(registro) {
    const recomendaciones = Array.isArray(registro.recomendaciones) ? registro.recomendaciones : [];
    if (!recomendaciones.length) return '';
    const items = recomendaciones.map((recomendacion) => `
      <li>
        <span>${escaparHTML(recomendacion.descripcion || 'Recomendación')}</span>
        ${urgenciaBadge(recomendacion.urgencia)}
        ${recomendacion.atendida ? '<span class="texto-atendida">Atendida</span>' : ''}
      </li>
    `).join('');
    return `
      <div class="linea-recomendaciones">
        <span class="linea-etiqueta">Recomendaciones</span>
        <ul>${items}</ul>
      </div>
    `;
  }

  function fotosHTML(registro) {
    const fotos = fotosDeOrden(registro.id_orden).slice(0, 4);
    if (!fotos.length) return '';
    const miniaturas = fotos.map((foto, indice) => `
      <button type="button" class="linea-foto" data-accion="ver-foto-historial"
        data-orden="${escaparHTML(registro.id_orden)}" data-indice="${indice}"
        aria-label="Ampliar foto ${indice + 1} de la orden ${escaparHTML(registro.id_orden)}">
        <img src="${foto.data}" alt="${escaparHTML(foto.descripcion || 'Foto de recepción')}" loading="lazy">
      </button>
    `).join('');
    return `<div class="linea-fotos">${miniaturas}</div>`;
  }

  function itemHTML(registro, mostrarVehiculo) {
    const garantia = registro.garantia || {};
    const proximo = registro.proximo_servicio || {};
    const detalles = [];
    if (garantia.vence) detalles.push(`Garantía hasta ${formatearFecha(garantia.vence)}`);
    else if (Number(garantia.dias) > 0) detalles.push(`Garantía ${garantia.dias} días`);
    if (Number(garantia.km) > 0) detalles.push(`${Number(garantia.km).toLocaleString('es-BO')} km`);
    const proximoTexto = [
      proximo.fecha ? `Próximo servicio: ${formatearFecha(proximo.fecha)}` : '',
      Number(proximo.km) > 0 ? `a los ${Number(proximo.km).toLocaleString('es-BO')} km` : ''
    ].filter(Boolean).join(' · ');

    return `
      <article class="linea-tiempo-item">
        <span class="linea-tiempo-punto" aria-hidden="true"></span>
        <div class="linea-tiempo-tarjeta">
          <header class="linea-cabecera">
            <div class="linea-cabecera-texto">
              <span class="linea-fecha">${capitalizar(formatearFechaLarga(registro.fecha_ingreso, false))}</span>
              <span class="linea-sub">Ingreso ${formatearFecha(registro.fecha_ingreso)} · Entrega ${formatearFecha(registro.fecha_entrega)}</span>
            </div>
            <div class="linea-badges">
              ${mostrarVehiculo ? `<span class="placa-chip">${escaparHTML(registro.vehiculo_placa || '—')}</span>` : ''}
              ${categoriaBadge(registro.categoria)}
            </div>
          </header>

          ${mostrarVehiculo ? `<p class="linea-vehiculo">${escaparHTML(nombreVehiculo(registro))}</p>` : ''}

          <div class="linea-datos">
            <p><span>Kilometraje</span><strong>${Number(registro.kilometraje || 0).toLocaleString('es-BO')} km</strong></p>
            <p><span>Mecánico</span><strong>${escaparHTML(registro.mecanico || 'Sin asignar')}</strong></p>
            <p><span>Forma de pago</span><strong>${escaparHTML(FORMAS_PAGO[registro.forma_pago] || registro.forma_pago || '—')}</strong></p>
            <p><span>Orden</span><strong>${escaparHTML(registro.id_orden || '—')}</strong></p>
          </div>

          <div class="linea-servicios-contenedor">
            <span class="linea-etiqueta">Servicios realizados</span>
            <ul class="linea-servicios">${serviciosHTML(registro)}</ul>
          </div>

          ${repuestosHTML(registro)}

          <div class="linea-pie">
            <div class="linea-total">
              <span>Total</span>
              <strong>${formatearMoneda(registro.total)}</strong>
            </div>
            <div class="linea-condiciones">
              ${detalles.length ? `<span>${escaparHTML(detalles.join(' · '))}</span>` : ''}
              ${proximoTexto ? `<span>${escaparHTML(proximoTexto)}</span>` : ''}
            </div>
            ${registro.id_orden ? `<button type="button" class="btn btn-secundario btn-sm" data-accion="abrir-orden-historial" data-orden="${escaparHTML(registro.id_orden)}">Ver orden original</button>` : ''}
          </div>

          ${recomendacionesHTML(registro)}
          ${fotosHTML(registro)}
        </div>
      </article>
    `;
  }

  function renderizarLineaTiempo(registros, opciones = {}) {
    const { mostrarVehiculo = false, vacio = 'Todavía no hay trabajos registrados.' } = opciones;
    if (!Array.isArray(registros) || !registros.length) {
      return `
        <div class="linea-tiempo-vacia">
          <span class="linea-tiempo-vacia-icono">${icono('historial')}</span>
          <p>${escaparHTML(vacio)}</p>
        </div>
      `;
    }
    return `<div class="linea-tiempo">${registros.map((registro) => itemHTML(registro, mostrarVehiculo)).join('')}</div>`;
  }

  /* ---------------------------------------------------------
     Estado de mantenimiento
     --------------------------------------------------------- */
  function garantiasDeRegistros(registros) {
    return registros
      .filter((registro) => registro.garantia && registro.garantia.vence)
      .map((registro) => ({
        vence: registro.garantia.vence,
        dias: registro.garantia.dias,
        km: registro.garantia.km,
        id_orden: registro.id_orden
      }))
      .sort((a, b) => String(a.vence).localeCompare(String(b.vence)));
  }

  function recomendacionesPendientes(registros) {
    const items = [];
    registros.forEach((registro) => {
      (Array.isArray(registro.recomendaciones) ? registro.recomendaciones : []).forEach((recomendacion, indice) => {
        if (recomendacion && !recomendacion.atendida) {
          items.push({
            ...recomendacion,
            id_historial: registro.id,
            indice,
            id_orden: registro.id_orden,
            fecha: fechaVisita(registro)
          });
        }
      });
    });
    const peso = { alta: 0, media: 1, baja: 2 };
    return items.sort((a, b) => {
      const diferencia = (peso[a.urgencia] ?? 1) - (peso[b.urgencia] ?? 1);
      if (diferencia !== 0) return diferencia;
      return String(b.fecha || '').localeCompare(String(a.fecha || ''));
    });
  }

  function calcularEstadoMantenimiento(vehiculo, registros) {
    const ultimo = registros[0] || null;
    const proximo = ultimo?.proximo_servicio || null;
    const kmActual = Number(vehiculo?.kilometraje_actual) || 0;
    const hoy = inicioDelDia(new Date());
    let estado = 'sin-datos';

    if (proximo && (proximo.fecha || Number(proximo.km) > 0)) {
      const fecha = proximo.fecha ? parsearFechaHora(proximo.fecha) : null;
      const km = Number(proximo.km) || 0;
      const vencidoFecha = Boolean(fecha) && inicioDelDia(fecha) < hoy;
      const vencidoKm = km > 0 && kmActual >= km;
      const proximoFecha = Boolean(fecha) && !vencidoFecha && fecha <= sumarDias(hoy, 30);
      const proximoKm = km > 0 && !vencidoKm && (km - kmActual) <= 500;

      if (vencidoFecha || vencidoKm) estado = 'vencido';
      else if (proximoFecha || proximoKm) estado = 'proximo';
      else estado = 'al-dia';
    }

    return {
      estado,
      ultimo,
      proximo,
      kmActual,
      garantias: garantiasDeRegistros(registros),
      recomendaciones: recomendacionesPendientes(registros)
    };
  }

  function garantiaHTML(garantia) {
    const vence = parsearFechaHora(garantia.vence);
    const hoy = inicioDelDia(new Date());
    let estado = 'vigente';
    let texto = 'Vigente';
    if (vence && inicioDelDia(vence) < hoy) {
      estado = 'vencida';
      texto = 'Vencida';
    } else if (vence && inicioDelDia(vence) <= sumarDias(hoy, 30)) {
      estado = 'por-vencer';
      texto = 'Por vencer';
    }
    return `
      <li class="mantenimiento-garantia">
        <div>
          <strong>${formatearFecha(garantia.vence)}</strong>
          <span>Orden ${escaparHTML(garantia.id_orden || '—')}</span>
        </div>
        <span class="badge badge-garantia badge-garantia-${estado}">${texto}</span>
      </li>
    `;
  }

  function recomendacionHTML(recomendacion) {
    return `
      <li class="mantenimiento-recomendacion">
        <div>
          <span>${escaparHTML(recomendacion.descripcion || 'Recomendación')}</span>
          <small>${formatearFecha(recomendacion.fecha)} · Orden ${escaparHTML(recomendacion.id_orden || '—')}</small>
        </div>
        <div class="mantenimiento-recomendacion-acciones">
          ${urgenciaBadge(recomendacion.urgencia)}
          <button type="button" class="btn btn-secundario btn-sm" data-accion="atender-recomendacion"
            data-historial="${escaparHTML(recomendacion.id_historial)}" data-indice="${recomendacion.indice}">Marcar atendida</button>
        </div>
      </li>
    `;
  }

  function renderizarEstadoMantenimiento(vehiculo, registros) {
    const datos = calcularEstadoMantenimiento(vehiculo, registros);
    const proximo = datos.proximo;
    const proximoTexto = proximo
      ? [
        proximo.descripcion || 'Mantenimiento programado',
        proximo.fecha ? formatearFecha(proximo.fecha) : '',
        Number(proximo.km) > 0 ? `a los ${Number(proximo.km).toLocaleString('es-BO')} km` : ''
      ].filter(Boolean).join(' · ')
      : 'No hay un próximo servicio programado.';

    return `
      <div class="mantenimiento-panel ${claseEstadoMantenimiento(datos.estado)}">
        <div class="mantenimiento-estado">
          <span class="mantenimiento-punto" aria-hidden="true"></span>
          <div>
            <span class="linea-etiqueta">Estado de mantenimiento</span>
            <strong>${escaparHTML(textoEstadoMantenimiento(datos.estado))}</strong>
          </div>
        </div>
        <div class="mantenimiento-proximo">
          <span class="linea-etiqueta">Próximo servicio</span>
          <p>${escaparHTML(proximoTexto)}</p>
          <small>Kilometraje actual: ${datos.kmActual.toLocaleString('es-BO')} km</small>
        </div>

        <div class="mantenimiento-bloque">
          <span class="linea-etiqueta">Garantías</span>
          ${datos.garantias.length
            ? `<ul class="mantenimiento-lista">${datos.garantias.slice(0, 4).map(garantiaHTML).join('')}</ul>`
            : '<p class="texto-suave">Sin garantías registradas.</p>'}
        </div>

        <div class="mantenimiento-bloque">
          <span class="linea-etiqueta">Recomendaciones pendientes</span>
          ${datos.recomendaciones.length
            ? `<ul class="mantenimiento-lista">${datos.recomendaciones.map(recomendacionHTML).join('')}</ul>`
            : '<p class="texto-suave">No hay recomendaciones pendientes.</p>'}
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     Gráfico de kilometraje (SVG, sin librerías)
     --------------------------------------------------------- */
  function renderizarGraficoKilometraje(registros) {
    const puntos = [...registros]
      .sort((a, b) => String(a.fecha_ingreso || '').localeCompare(String(b.fecha_ingreso || '')))
      .map((registro) => ({
        fecha: registro.fecha_ingreso,
        km: Number(registro.kilometraje) || 0
      }))
      .filter((punto) => punto.km > 0);

    if (puntos.length < 2) {
      return `
        <div class="grafico-vacio">
          ${icono('kilometro')}
          <p>Se necesitan al menos dos visitas con kilometraje para dibujar la evolución.</p>
        </div>
      `;
    }

    const ancho = 640;
    const alto = 230;
    const margen = { arriba: 26, derecha: 24, abajo: 40, izquierda: 70 };
    const areaAncho = ancho - margen.izquierda - margen.derecha;
    const areaAlto = alto - margen.arriba - margen.abajo;
    const kms = puntos.map((punto) => punto.km);
    const minimo = Math.min(...kms);
    const maximo = Math.max(...kms);
    const rango = Math.max(1, maximo - minimo);
    const pasoX = puntos.length > 1 ? areaAncho / (puntos.length - 1) : 0;

    const coordenadas = puntos.map((punto, indice) => {
      const x = margen.izquierda + pasoX * indice;
      const y = margen.arriba + areaAlto - ((punto.km - minimo) / rango) * areaAlto;
      return { ...punto, x, y };
    });

    const linea = coordenadas.map((punto) => `${punto.x.toFixed(1)},${punto.y.toFixed(1)}`).join(' ');
    const area = [
      `${margen.izquierda},${margen.arriba + areaAlto}`,
      linea,
      `${margen.izquierda + areaAncho},${margen.arriba + areaAlto}`
    ].join(' ');

    const lineasGuia = [0, 0.5, 1].map((proporcion) => {
      const y = margen.arriba + areaAlto * proporcion;
      const valor = Math.round(maximo - rango * proporcion);
      return `
        <line x1="${margen.izquierda}" y1="${y}" x2="${margen.izquierda + areaAncho}" y2="${y}"
          stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4 4"></line>
        <text x="${margen.izquierda - 10}" y="${y + 4}" text-anchor="end" class="grafico-texto">${valor.toLocaleString('es-BO')}</text>
      `;
    }).join('');

    const circulos = coordenadas.map((punto) => `
      <circle cx="${punto.x}" cy="${punto.y}" r="4.5" fill="#F97316" stroke="#fff" stroke-width="2">
        <title>${formatearFecha(punto.fecha)}: ${punto.km.toLocaleString('es-BO')} km</title>
      </circle>
    `).join('');

    const primeras = coordenadas.slice(0, 1);
    const ultimas = coordenadas.slice(-1);
    const etiquetas = [...primeras, ...ultimas].map((punto, indice) => `
      <text x="${punto.x}" y="${alto - 14}" text-anchor="${indice === 0 ? 'start' : 'end'}" class="grafico-texto">
        ${formatearFecha(punto.fecha)}
      </text>
    `).join('');

    return `
      <div class="grafico-kilometraje">
        <svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Evolución del kilometraje en ${puntos.length} visitas">
          <defs>
            <linearGradient id="degradado-km" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F97316" stop-opacity="0.28"></stop>
              <stop offset="100%" stop-color="#F97316" stop-opacity="0.02"></stop>
            </linearGradient>
          </defs>
          ${lineasGuia}
          <polygon points="${area}" fill="url(#degradado-km)"></polygon>
          <polyline points="${linea}" fill="none" stroke="#F97316" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
          ${circulos}
          ${etiquetas}
        </svg>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     Impresión del carnet de servicio
     ========================================================= */
  function filaImpresion(registro) {
    const servicios = (registro.servicios || [])
      .map((servicio) => `${servicio.nombre} (${formatearMoneda(servicio.importe)})`)
      .join(' · ');
    return `
      <tr>
        <td>${formatearFecha(registro.fecha_ingreso)}</td>
        <td>${escaparHTML(registro.id_orden || '—')}</td>
        <td class="impreso-der">${Number(registro.kilometraje || 0).toLocaleString('es-BO')} km</td>
        <td>${escaparHTML(servicios || 'Sin servicios')}</td>
        <td>${escaparHTML(registro.mecanico || '—')}</td>
        <td class="impreso-der">${formatearMoneda(registro.total)}</td>
      </tr>
    `;
  }

  function construirHojaHistorial(vehiculo, cliente, registros) {
    const total = registros.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0);
    return `
      <div class="hoja-historial">
        <header class="impreso-cabecera">
          <div class="impreso-taller">
            <p class="impreso-marca">${escaparHTML(CONFIG.nombreTaller)}</p>
            <p>${escaparHTML(CONFIG.direccion)} · ${escaparHTML(CONFIG.ciudad)}</p>
            <p>Tel. ${escaparHTML(CONFIG.telefonoVisible)} · ${escaparHTML(CONFIG.email)}</p>
          </div>
          <div class="impreso-ficha">
            <span>Carnet de servicio</span>
            <strong>${escaparHTML(vehiculo.placa || '—')}</strong>
            <span>${escaparHTML([vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo')}</span>
          </div>
        </header>

        <section class="impreso-bloque">
          <h2>Datos del vehículo</h2>
          <div class="impreso-datos">
            <p><span>Marca y modelo</span><strong>${escaparHTML([vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || '—')}</strong></p>
            <p><span>Año</span><strong>${escaparHTML(vehiculo.anio || '—')}</strong></p>
            <p><span>Color</span><strong>${escaparHTML(vehiculo.color || '—')}</strong></p>
            <p><span>Placa</span><strong>${escaparHTML(vehiculo.placa || '—')}</strong></p>
            <p><span>Kilometraje actual</span><strong>${Number(vehiculo.kilometraje_actual || 0).toLocaleString('es-BO')} km</strong></p>
            <p><span>N° de motor</span><strong>${escaparHTML(vehiculo.nro_motor || '—')}</strong></p>
            <p><span>VIN / chasis</span><strong>${escaparHTML(vehiculo.vin_chasis || '—')}</strong></p>
            <p><span>Batería</span><strong>${escaparHTML(vehiculo.bateria || '—')}</strong></p>
            <p class="impreso-ancho"><span>Propietario</span><strong>${escaparHTML(cliente?.nombre_razon_social || 'Sin cliente asignado')}</strong></p>
          </div>
        </section>

        <section class="impreso-bloque">
          <h2>Historial de servicios</h2>
          <table class="impreso-tabla impreso-tabla-historial">
            <thead>
              <tr>
                <th>Ingreso</th>
                <th>Orden</th>
                <th class="impreso-der">Kilometraje</th>
                <th>Servicios</th>
                <th>Mecánico</th>
                <th class="impreso-der">Total</th>
              </tr>
            </thead>
            <tbody>
              ${registros.length ? registros.map(filaImpresion).join('') : '<tr><td colspan="6">Sin servicios registrados.</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="impreso-der">Total histórico (${registros.length} visitas)</td>
                <td class="impreso-der">${formatearMoneda(total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <footer class="impreso-pie">
          <div class="impreso-firma"><span>Firma del cliente</span></div>
          <div class="impreso-firma"><span>Firma del taller</span></div>
        </footer>
        <p class="impreso-leyenda">Historial generado el ${formatearFechaLarga(new Date(), false)} · ${escaparHTML(CONFIG.nombreTaller)}</p>
      </div>
    `;
  }

  function imprimirHistorialVehiculo(idVehiculo) {
    const vehiculo = Almacen.obtenerVehiculo(idVehiculo);
    if (!vehiculo) {
      mostrarToast('No se encontró el vehículo para imprimir.', 'error');
      return;
    }
    const cliente = Almacen.obtenerCliente(vehiculo.id_cliente);
    const registros = registrosDeVehiculo(idVehiculo);
    const hoja = document.getElementById('hoja-impresion');
    if (!hoja) {
      mostrarToast('No se encontró la hoja de impresión.', 'error');
      return;
    }

    hoja.innerHTML = construirHojaHistorial(vehiculo, cliente, registros);
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
     Acciones globales de la línea de tiempo
     --------------------------------------------------------- */
  function abrirOrden(idOrden) {
    if (!idOrden) return;
    if (window.mostrarVista) window.mostrarVista('ordenes');
    if (window.Ordenes && typeof Ordenes.abrirOrden === 'function') {
      Ordenes.abrirOrden(idOrden);
    } else {
      mostrarToast(`La orden ${idOrden} no está disponible.`, 'aviso');
    }
  }

  /* ---------------------------------------------------------
     Historial general: filtros, paginación y CSV
     --------------------------------------------------------- */
  const estadoGeneral = {
    iniciado: false,
    pagina: 1,
    porPagina: 20,
    filtros: {
      texto: '', desde: '', hasta: '', marca: '', modelo: '',
      categoria: '', mecanico: '', pago: '', servicio: ''
    }
  };

  const general = {};

  function iniciarGeneral() {
    if (estadoGeneral.iniciado) return;
    const buscar = document.getElementById('historial-buscar');
    if (!buscar) return;
    estadoGeneral.iniciado = true;

    general.buscar = buscar;
    general.desde = document.getElementById('historial-desde');
    general.hasta = document.getElementById('historial-hasta');
    general.marca = document.getElementById('historial-marca');
    general.modelo = document.getElementById('historial-modelo');
    general.categoria = document.getElementById('historial-categoria');
    general.mecanico = document.getElementById('historial-mecanico');
    general.pago = document.getElementById('historial-pago');
    general.servicio = document.getElementById('historial-servicio');
    general.cuerpo = document.getElementById('cuerpo-historial-general');
    general.tabla = document.getElementById('tabla-historial');
    general.vacio = document.getElementById('historial-vacio');
    general.conteo = document.getElementById('historial-conteo');
    general.totales = document.getElementById('historial-totales');
    general.paginacion = document.getElementById('historial-paginacion');
    general.tarjeta = document.querySelector('.historial-tabla-tarjeta');
    general.estadisticas = document.getElementById('historial-estadisticas');

    const aplicar = () => {
      estadoGeneral.filtros = {
        texto: general.buscar.value,
        desde: general.desde.value,
        hasta: general.hasta.value,
        marca: general.marca.value,
        modelo: general.modelo.value,
        categoria: general.categoria.value,
        mecanico: general.mecanico.value,
        pago: general.pago.value,
        servicio: general.servicio.value
      };
      estadoGeneral.pagina = 1;
      renderizarGeneral();
    };

    general.buscar.addEventListener('input', aplicar);
    [general.desde, general.hasta, general.marca, general.modelo, general.categoria, general.mecanico, general.pago, general.servicio]
      .forEach((elemento) => elemento?.addEventListener('change', aplicar));

    document.getElementById('btn-limpiar-historial')?.addEventListener('click', () => {
      general.buscar.value = '';
      [general.desde, general.hasta, general.marca, general.modelo, general.categoria, general.mecanico, general.pago, general.servicio]
        .forEach((elemento) => { if (elemento) elemento.value = ''; });
      aplicar();
    });

    document.getElementById('btn-exportar-csv-historial')?.addEventListener('click', exportarCSV);

    general.paginacion?.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-pagina]');
      if (!boton) return;
      const pagina = Number(boton.dataset.pagina);
      if (!Number.isFinite(pagina)) return;
      estadoGeneral.pagina = pagina;
      renderizarGeneral();
      general.tarjeta?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.addEventListener('historial:actualizado', () => {
      if (estadoGeneral.iniciado) recargarGeneral();
    });
  }

  function valoresUnicos(valores) {
    return [...new Set(valores.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'es'));
  }

  function poblarSelect(elemento, valores, etiquetaTodos) {
    if (!elemento) return;
    const actual = elemento.value;
    elemento.innerHTML = `<option value="">${escaparHTML(etiquetaTodos)}</option>${valores
      .map((valor) => `<option value="${escaparHTML(valor)}">${escaparHTML(valor)}</option>`)
      .join('')}`;
    if (valores.includes(actual)) elemento.value = actual;
  }

  function poblarFiltros() {
    const historial = Almacen.obtenerHistorial();
    poblarSelect(general.marca, valoresUnicos(historial.map((registro) => registro.vehiculo_marca)), 'Todas');
    poblarSelect(general.modelo, valoresUnicos(historial.map((registro) => registro.vehiculo_modelo)), 'Todos');
    poblarSelect(general.mecanico, valoresUnicos([
      ...MECANICOS,
      ...historial.map((registro) => registro.mecanico)
    ]), 'Todos');
    poblarSelect(general.servicio, valoresUnicos(
      historial.flatMap((registro) => (registro.servicios || []).map((servicio) => servicio.nombre))
    ), 'Todos');
  }

  function obtenerFiltrados() {
    const filtros = estadoGeneral.filtros;
    const texto = normalizarNombre(filtros.texto).trim();
    const servicioBuscado = normalizarNombre(filtros.servicio);
    return ordenarDesc(Almacen.obtenerHistorial()).filter((registro) => {
      const fecha = String(registro.fecha_entrega || registro.fecha_ingreso || '').slice(0, 10);
      if (filtros.desde && (!fecha || fecha < filtros.desde)) return false;
      if (filtros.hasta && (!fecha || fecha > filtros.hasta)) return false;
      if (filtros.marca && normalizarNombre(registro.vehiculo_marca) !== normalizarNombre(filtros.marca)) return false;
      if (filtros.modelo && normalizarNombre(registro.vehiculo_modelo) !== normalizarNombre(filtros.modelo)) return false;
      if (filtros.categoria && registro.categoria !== filtros.categoria) return false;
      if (filtros.mecanico && normalizarNombre(registro.mecanico) !== normalizarNombre(filtros.mecanico)) return false;
      if (filtros.pago && registro.forma_pago !== filtros.pago) return false;
      if (servicioBuscado && !(registro.servicios || []).some((servicio) => normalizarNombre(servicio.nombre) === servicioBuscado)) {
        return false;
      }
      if (!texto) return true;
      const campos = [
        registro.vehiculo_placa,
        registro.cliente_nombre,
        registro.id_orden,
        registro.vehiculo_marca,
        registro.vehiculo_modelo
      ].join(' ');
      return normalizarNombre(campos).includes(texto);
    });
  }

  function filaGeneralHTML(registro) {
    const servicios = (registro.servicios || []).map((servicio) => servicio.nombre).filter(Boolean);
    const vehiculo = [registro.vehiculo_marca, registro.vehiculo_modelo].filter(Boolean).join(' ') || 'Vehículo sin datos';
    const pago = FORMAS_PAGO[registro.forma_pago] || registro.forma_pago || '—';
    return `
      <tr>
        <td class="celda-fecha" data-etiqueta="Fecha">${escaparHTML(formatearFecha(fechaVisita(registro)))}</td>
        <td data-etiqueta="Ficha">
          <button type="button" class="enlace-tabla" data-accion="abrir-orden-historial" data-orden="${escaparHTML(registro.id_orden)}">
            ${escaparHTML(registro.id_orden || '—')}
          </button>
        </td>
        <td data-etiqueta="Cliente">${escaparHTML(registro.cliente_nombre || 'Cliente sin datos')}</td>
        <td data-etiqueta="Vehículo">
          <strong class="celda-vehiculo">${escaparHTML(vehiculo)}</strong>
          <span class="celda-placa">${escaparHTML(registro.vehiculo_placa || '—')}</span>
        </td>
        <td data-etiqueta="Categoría">${categoriaBadge(registro.categoria)}</td>
        <td data-etiqueta="Mecánico">${escaparHTML(registro.mecanico || 'Sin asignar')}</td>
        <td class="celda-servicios" data-etiqueta="Servicios" title="${escaparHTML(servicios.join(' · '))}">${escaparHTML(servicios.join(' · ') || '—')}</td>
        <td data-etiqueta="Pago">${escaparHTML(pago)}</td>
        <td class="der celda-total" data-etiqueta="Total">${formatearMoneda(registro.total)}</td>
      </tr>
    `;
  }

  function paginasVisibles(pagina, total) {
    if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1);
    const items = [1];
    if (pagina > 3) items.push('...');
    const desde = Math.max(2, pagina - 1);
    const hasta = Math.min(total - 1, pagina + 1);
    for (let numero = desde; numero <= hasta; numero += 1) items.push(numero);
    if (pagina < total - 2) items.push('...');
    items.push(total);
    return items;
  }

  function paginacionHTML(pagina, totalPaginas) {
    const boton = (numero, etiqueta, opciones = {}) => `
      <button type="button" class="pagina-btn${opciones.activa ? ' activa' : ''}"
        data-pagina="${numero}" ${opciones.activa ? 'aria-current="page"' : ''}
        aria-label="${escaparHTML(opciones.etiquetaAria || `Página ${numero}`)}">${etiqueta}</button>
    `;
    return `
      ${boton(pagina - 1, '‹ Anterior', { etiquetaAria: 'Página anterior' })}
      ${paginasVisibles(pagina, totalPaginas).map((item) => (
        item === '...'
          ? '<span class="pagina-puntos" aria-hidden="true">…</span>'
          : boton(item, String(item), { activa: item === pagina })
      )).join('')}
      ${boton(pagina + 1, 'Siguiente ›', { etiquetaAria: 'Página siguiente' })}
    `;
  }

  /* ---------------------------------------------------------
     Estadísticas del historial
     --------------------------------------------------------- */
  function inicioMes(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1, 0, 0, 0, 0);
  }

  function finMes(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function nombreMes(fecha) {
    return `${capitalizar(MESES[fecha.getMonth()])} ${fecha.getFullYear()}`;
  }

  function resumenMes(historial, fechaBase) {
    const inicio = inicioMes(fechaBase);
    const fin = finMes(fechaBase);
    const registros = historial.filter((registro) => {
      const fecha = parsearFechaHora(fechaVisita(registro));
      return Boolean(fecha) && fecha >= inicio && fecha <= fin;
    });
    return {
      inicio,
      fin,
      registros,
      trabajos: registros.length,
      ingresos: registros.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0)
    };
  }

  function variacion(actual, anterior) {
    if (!anterior) {
      return actual
        ? { texto: 'Sin base el mes anterior', clase: 'positivo' }
        : { texto: 'Sin movimientos', clase: 'neutro' };
    }
    const porcentaje = Math.round(((actual - anterior) / anterior) * 100);
    return {
      texto: `${porcentaje > 0 ? '+' : ''}${porcentaje}% vs mes anterior`,
      clase: porcentaje > 0 ? 'positivo' : porcentaje < 0 ? 'negativo' : 'neutro'
    };
  }

  function claveCliente(registro) {
    if (registro.id_cliente) return `id:${registro.id_cliente}`;
    const nombre = normalizarNombre(registro.cliente_nombre);
    return nombre ? `nombre:${nombre}` : '';
  }

  function contarClientes(historial, mes) {
    const primerasVisitas = new Map();
    historial.forEach((registro) => {
      const clave = claveCliente(registro);
      const fecha = parsearFechaHora(fechaVisita(registro));
      if (!clave || !fecha) return;
      const anterior = primerasVisitas.get(clave);
      if (!anterior || fecha < anterior) primerasVisitas.set(clave, fecha);
    });

    const clientesDelMes = new Set(mes.registros.map(claveCliente).filter(Boolean));
    let nuevos = 0;
    let recurrentes = 0;
    clientesDelMes.forEach((clave) => {
      const primera = primerasVisitas.get(clave);
      if (primera && primera >= mes.inicio && primera <= mes.fin) nuevos += 1;
      else recurrentes += 1;
    });
    return { nuevos, recurrentes, total: clientesDelMes.size };
  }

  function rankingDatos(historial, obtenerClaves) {
    const mapa = new Map();
    historial.forEach((registro) => {
      const claves = obtenerClaves(registro).filter(Boolean);
      claves.forEach((clave) => {
        const actual = mapa.get(clave) || { nombre: clave, cantidad: 0 };
        actual.cantidad += 1;
        mapa.set(clave, actual);
      });
    });
    return [...mapa.values()]
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es'))
      .slice(0, 5);
  }

  function rankingHTML(items, vacio) {
    if (!items.length) return `<p class="historial-panel-vacio">${escaparHTML(vacio)}</p>`;
    const maximo = Math.max(...items.map((item) => item.cantidad), 1);
    return `
      <ol class="historial-ranking">
        ${items.map((item, indice) => `
          <li class="historial-ranking-item">
            <div class="historial-ranking-cabecera">
              <span class="historial-ranking-puesto">${indice + 1}</span>
              <span class="historial-ranking-nombre" title="${escaparHTML(item.nombre)}">${escaparHTML(item.nombre)}</span>
              <strong>${item.cantidad}</strong>
            </div>
            <div class="historial-ranking-barra" aria-hidden="true">
              <span style="width: ${Math.max(4, Math.round((item.cantidad / maximo) * 100))}%"></span>
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }

  function pagosHTML(historial) {
    const pagos = {
      contado: { etiqueta: FORMAS_PAGO.contado, cantidad: 0, importe: 0 },
      credito: { etiqueta: FORMAS_PAGO.credito, cantidad: 0, importe: 0 }
    };
    historial.forEach((registro) => {
      const clave = FORMAS_PAGO[registro.forma_pago] ? registro.forma_pago : 'contado';
      pagos[clave].cantidad += 1;
      pagos[clave].importe += Number(registro.total) || 0;
    });
    const total = pagos.contado.importe + pagos.credito.importe;
    if (!total) return '<p class="historial-panel-vacio">Todavía no hay ingresos registrados.</p>';

    const porcentaje = (valor) => Math.round((valor / total) * 100);
    const contado = porcentaje(pagos.contado.importe);
    const credito = 100 - contado;
    return `
      <div class="historial-pago-barra" role="img"
        aria-label="Contado ${contado}% de los ingresos; crédito ${credito}%">
        ${pagos.contado.importe ? `<span class="historial-pago-contado" style="width: ${contado}%"></span>` : ''}
        ${pagos.credito.importe ? `<span class="historial-pago-credito" style="width: ${credito}%"></span>` : ''}
      </div>
      <ul class="historial-pago-leyenda">
        <li>
          <span class="historial-pago-punto historial-pago-contado"></span>
          <span class="historial-pago-etiqueta">${escaparHTML(pagos.contado.etiqueta)}</span>
          <strong>${formatearMoneda(pagos.contado.importe)}</strong>
          <small>${pagos.contado.cantidad} ${pagos.contado.cantidad === 1 ? 'trabajo' : 'trabajos'} · ${contado}%</small>
        </li>
        <li>
          <span class="historial-pago-punto historial-pago-credito"></span>
          <span class="historial-pago-etiqueta">${escaparHTML(pagos.credito.etiqueta)}</span>
          <strong>${formatearMoneda(pagos.credito.importe)}</strong>
          <small>${pagos.credito.cantidad} ${pagos.credito.cantidad === 1 ? 'trabajo' : 'trabajos'} · ${credito}%</small>
        </li>
      </ul>
    `;
  }

  function kpiHTML(tarjeta) {
    return `
      <div class="tarjeta estadistica historial-kpi ${tarjeta.clase}">
        <span class="estadistica-icono">${icono(tarjeta.icono)}</span>
        <span class="estadistica-datos">
          <strong>${escaparHTML(tarjeta.valor)}</strong>
          <span>${escaparHTML(tarjeta.etiqueta)}</span>
          <small class="historial-kpi-detalle historial-kpi-${tarjeta.detalleClase || 'neutro'}">${escaparHTML(tarjeta.detalle)}</small>
        </span>
      </div>
    `;
  }

  function renderizarEstadisticas() {
    if (!general.estadisticas) return;
    const historial = Almacen.obtenerHistorial();
    const ahora = new Date();
    const mesActual = resumenMes(historial, ahora);
    const mesAnterior = resumenMes(historial, new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1));
    const clientes = contarClientes(historial, mesActual);

    const deltaTrabajos = variacion(mesActual.trabajos, mesAnterior.trabajos);
    const deltaIngresos = variacion(mesActual.ingresos, mesAnterior.ingresos);
    const servicios = rankingDatos(historial, (registro) => (registro.servicios || []).map((servicio) => servicio.nombre));
    const marcas = rankingDatos(historial, (registro) => [registro.vehiculo_marca]);

    general.estadisticas.innerHTML = `
      <div class="historial-estadisticas-cabecera">
        <div>
          <h3>Resumen del taller</h3>
          <p>Comparativo de ${escaparHTML(nombreMes(ahora))} contra ${escaparHTML(nombreMes(new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)))}.</p>
        </div>
        <span class="historial-periodo">${escaparHTML(nombreMes(ahora))}</span>
      </div>

      <div class="historial-kpis">
        ${kpiHTML({
          valor: String(mesActual.trabajos),
          etiqueta: 'Trabajos este mes',
          detalle: `${deltaTrabajos.texto} · ${mesAnterior.trabajos} antes`,
          detalleClase: deltaTrabajos.clase,
          icono: 'ordenes',
          clase: 'estadistica-azul'
        })}
        ${kpiHTML({
          valor: formatearMoneda(mesActual.ingresos),
          etiqueta: 'Ingresos este mes',
          detalle: `${deltaIngresos.texto} · antes ${formatearMoneda(mesAnterior.ingresos)}`,
          detalleClase: deltaIngresos.clase,
          icono: 'moneda',
          clase: 'estadistica-verde'
        })}
        ${kpiHTML({
          valor: String(clientes.nuevos),
          etiqueta: 'Clientes nuevos',
          detalle: `Primera visita en ${nombreMes(ahora)}`,
          detalleClase: 'neutro',
          icono: 'usuarios',
          clase: 'estadistica-naranja'
        })}
        ${kpiHTML({
          valor: String(clientes.recurrentes),
          etiqueta: 'Clientes recurrentes',
          detalle: `De ${clientes.total} ${clientes.total === 1 ? 'cliente atendido' : 'clientes atendidos'} este mes`,
          detalleClase: 'neutro',
          icono: 'historial',
          clase: 'estadistica-amarilla'
        })}
      </div>

      <div class="historial-paneles">
        <section class="tarjeta historial-panel" aria-labelledby="historial-top-servicios">
          <div class="historial-panel-cabecera">
            <h4 id="historial-top-servicios">${icono('llave')} Servicios más frecuentes</h4>
            <span>Top 5 histórico</span>
          </div>
          ${rankingHTML(servicios, 'Todavía no hay servicios registrados.')}
        </section>

        <section class="tarjeta historial-panel" aria-labelledby="historial-top-marcas">
          <div class="historial-panel-cabecera">
            <h4 id="historial-top-marcas">${icono('auto')} Marcas más atendidas</h4>
            <span>Top 5 histórico</span>
          </div>
          ${rankingHTML(marcas, 'Todavía no hay marcas registradas.')}
        </section>

        <section class="tarjeta historial-panel historial-panel-pagos" aria-labelledby="historial-pagos">
          <div class="historial-panel-cabecera">
            <h4 id="historial-pagos">${icono('moneda')} Ingresos por forma de pago</h4>
            <span>Histórico</span>
          </div>
          ${pagosHTML(historial)}
        </section>
      </div>
    `;
  }

  function renderizarGeneral() {
    if (!estadoGeneral.iniciado || !general.cuerpo) return;
    const filtrados = obtenerFiltrados();
    const total = filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / estadoGeneral.porPagina));
    if (estadoGeneral.pagina > totalPaginas) estadoGeneral.pagina = totalPaginas;
    if (estadoGeneral.pagina < 1) estadoGeneral.pagina = 1;

    const inicio = (estadoGeneral.pagina - 1) * estadoGeneral.porPagina;
    const visibles = filtrados.slice(inicio, inicio + estadoGeneral.porPagina);

    general.cuerpo.innerHTML = visibles.map(filaGeneralHTML).join('');
    general.tabla?.classList.toggle('oculto', total === 0);
    general.vacio?.classList.toggle('oculto', total !== 0);

    if (general.conteo) {
      general.conteo.textContent = total
        ? `${total} ${total === 1 ? 'trabajo' : 'trabajos'}`
        : 'Sin registros';
    }

    if (general.totales) {
      const ingresos = filtrados.reduce((suma, registro) => suma + (Number(registro.total) || 0), 0);
      general.totales.innerHTML = `
        <span><strong>${total}</strong> ${total === 1 ? 'trabajo' : 'trabajos'}</span>
        <span>Ingresos: <strong>${formatearMoneda(ingresos)}</strong></span>
        <span>Página <strong>${estadoGeneral.pagina}</strong> de <strong>${totalPaginas}</strong></span>
      `;
    }

    if (general.paginacion) {
      general.paginacion.innerHTML = total > estadoGeneral.porPagina
        ? paginacionHTML(estadoGeneral.pagina, totalPaginas)
        : '';
      general.paginacion.querySelectorAll('[data-pagina]').forEach((boton) => {
        const numero = Number(boton.dataset.pagina);
        if (!Number.isFinite(numero) || numero < 1 || numero > totalPaginas) {
          boton.disabled = true;
          boton.setAttribute('aria-disabled', 'true');
        }
      });
    }
  }

  function celdaCSV(valor) {
    return `"${String(valor ?? '').replace(/"/g, '""')}"`;
  }

  function exportarCSV() {
    const filtrados = obtenerFiltrados();
    if (!filtrados.length) {
      mostrarToast('No hay trabajos para exportar con los filtros actuales.', 'aviso');
      return;
    }
    const encabezados = [
      'Fecha', 'Ficha', 'Cliente', 'Placa', 'Marca', 'Modelo', 'Categoría',
      'Mecánico', 'Servicios', 'Repuestos', 'Forma de pago', 'Total (Bs)',
      'Garantía', 'Próximo servicio'
    ];
    const filas = filtrados.map((registro) => {
      const garantia = registro.garantia || {};
      const proximo = registro.proximo_servicio || {};
      const garantiaTexto = [
        Number(garantia.dias) > 0 ? `${Number(garantia.dias)} días` : '',
        Number(garantia.km) > 0 ? `${Number(garantia.km)} km` : '',
        garantia.vence ? `vence ${formatearFecha(garantia.vence)}` : ''
      ].filter(Boolean).join(' · ');
      const proximoTexto = [
        proximo.fecha ? formatearFecha(proximo.fecha) : '',
        Number(proximo.km) > 0 ? `${Number(proximo.km)} km` : '',
        proximo.descripcion || ''
      ].filter(Boolean).join(' · ');
      return [
        formatearFecha(fechaVisita(registro)),
        registro.id_orden,
        registro.cliente_nombre,
        registro.vehiculo_placa,
        registro.vehiculo_marca,
        registro.vehiculo_modelo,
        CATEGORIAS_TRABAJO[registro.categoria] || registro.categoria,
        registro.mecanico,
        (registro.servicios || []).map((servicio) => servicio.nombre).join(' | '),
        (registro.repuestos || []).map((repuesto) => `${repuesto.nombre} x${repuesto.cantidad}`).join(' | '),
        FORMAS_PAGO[registro.forma_pago] || registro.forma_pago,
        Number(registro.total) || 0,
        garantiaTexto,
        proximoTexto
      ];
    });
    const contenido = `\ufeff${[encabezados, ...filas]
      .map((fila) => fila.map(celdaCSV).join(';'))
      .join('\r\n')}`;
    const nombre = `historial-taller-${aISOfecha(new Date())}.csv`;
    if (descargarArchivo(nombre, contenido, 'text/csv')) {
      mostrarToast(`Se exportaron ${filtrados.length} trabajos a CSV.`, 'exito');
    }
  }

  function mostrarGeneral() {
    if (!estadoGeneral.iniciado) iniciarGeneral();
    if (!estadoGeneral.iniciado) return;
    poblarFiltros();
    renderizarEstadisticas();
    renderizarGeneral();
  }

  function recargarGeneral() {
    if (!estadoGeneral.iniciado) return;
    poblarFiltros();
    renderizarEstadisticas();
    renderizarGeneral();
  }

  document.addEventListener('click', async (evento) => {
    const foto = evento.target.closest('[data-accion="ver-foto-historial"]');
    if (foto) {
      const orden = Almacen.obtenerOrden(foto.dataset.orden);
      const fotos = Array.isArray(orden?.fotos) ? orden.fotos.filter((item) => item && item.data) : [];
      if (!fotos.length) {
        mostrarToast('La orden original no tiene fotos disponibles.', 'aviso');
        return;
      }
      Lightbox.abrir(fotos.map((item) => ({ data: item.data, descripcion: item.descripcion })), Number(foto.dataset.indice) || 0);
      return;
    }

    const abrir = evento.target.closest('[data-accion="abrir-orden-historial"]');
    if (abrir) {
      abrirOrden(abrir.dataset.orden);
      return;
    }

    const atender = evento.target.closest('[data-accion="atender-recomendacion"]');
    if (atender) {
      const resultado = Almacen.marcarRecomendacionAtendida(atender.dataset.historial, Number(atender.dataset.indice));
      if (!resultado.ok) {
        mostrarToast(resultado.mensaje || 'No se pudo actualizar la recomendación.', 'error');
        return;
      }
      mostrarToast('Recomendación marcada como atendida.', 'exito');
      window.dispatchEvent(new CustomEvent('historial:actualizado'));
    }
  });

  return {
    ordenarDesc,
    registrosDeCliente,
    registrosDeVehiculo,
    calcularEstadoMantenimiento,
    renderizarLineaTiempo,
    renderizarEstadoMantenimiento,
    renderizarGraficoKilometraje,
    imprimirHistorialVehiculo,
    abrirOrden,
    iniciarGeneral,
    mostrarGeneral,
    recargarGeneral,
    renderizarEstadisticas,
    exportarCSV
  };
})();

/* Se expone en window para que clientes, portal y agenda lo reutilicen. */
window.Historial = Historial;
