'use strict';

/* =========================================================
   DATOS DE DEMOSTRACIÓN
   Se cargan automáticamente la primera vez que se abre la app.
   Las fechas se generan alrededor de la semana actual.
   ========================================================= */

const DatosDemo = (() => {

  /** Dibuja una foto de recepción simulada con canvas (sin imágenes externas). */
  function generarFotoDemo(ficha, titulo, subtitulo, variante = 0) {
    try {
      const lienzo = document.createElement('canvas');
      lienzo.width = 640;
      lienzo.height = 480;
      const ctx = lienzo.getContext('2d');
      if (!ctx) return '';

      /* Fondo con degradado industrial. */
      const fondos = [
        ['#111827', '#374151'],
        ['#1F2937', '#0F172A'],
        ['#27272A', '#3F3F46'],
        ['#1E293B', '#334155']
      ];
      const [colorA, colorB] = fondos[variante % fondos.length];
      const degradado = ctx.createLinearGradient(0, 0, 640, 480);
      degradado.addColorStop(0, colorA);
      degradado.addColorStop(1, colorB);
      ctx.fillStyle = degradado;
      ctx.fillRect(0, 0, 640, 480);

      /* Retícula técnica sutil. */
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 0; y <= 480; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      /* Franja diagonal naranja. */
      ctx.save();
      ctx.translate(520, -40);
      ctx.rotate(0.42);
      ctx.fillStyle = 'rgba(249,115,22,0.18)';
      ctx.fillRect(0, 0, 90, 620);
      ctx.fillStyle = 'rgba(249,115,22,0.35)';
      ctx.fillRect(90, 0, 8, 620);
      ctx.restore();

      /* Silueta de vehículo. */
      ctx.save();
      ctx.translate(0, 55);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(78, 300);
      ctx.lineTo(88, 258);
      ctx.quadraticCurveTo(118, 210, 210, 204);
      ctx.lineTo(402, 204);
      ctx.quadraticCurveTo(486, 210, 520, 252);
      ctx.lineTo(560, 262);
      ctx.quadraticCurveTo(582, 270, 582, 296);
      ctx.lineTo(572, 318);
      ctx.lineTo(78, 318);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      /* Ventanas. */
      ctx.fillStyle = 'rgba(15,23,42,0.55)';
      ctx.beginPath();
      ctx.moveTo(214, 216);
      ctx.lineTo(392, 216);
      ctx.quadraticCurveTo(452, 222, 482, 252);
      ctx.lineTo(214, 252);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(130, 252);
      ctx.lineTo(204, 252);
      ctx.lineTo(204, 216);
      ctx.quadraticCurveTo(142, 220, 130, 252);
      ctx.fill();

      /* Línea de cintura y manijas. */
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(92, 272);
      ctx.lineTo(566, 272);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(300, 264, 34, 5);
      ctx.fillRect(418, 264, 34, 5);

      /* Ruedas. */
      [168, 486].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 318, 38, 0, Math.PI * 2);
        ctx.fillStyle = '#0B1120';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, 318, 17, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249,115,22,0.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, 318, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();
      });
      ctx.restore();

      /* Esquinas de encuadre. */
      ctx.strokeStyle = 'rgba(249,115,22,0.9)';
      ctx.lineWidth = 3;
      const esquinas = [
        [30, 30, 1, 1], [610, 30, -1, 1], [30, 450, 1, -1], [610, 450, -1, -1]
      ];
      esquinas.forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x + 22 * dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + 22 * dy);
        ctx.stroke();
      });

      /* Encabezado. */
      ctx.fillStyle = '#F97316';
      ctx.font = '700 17px "Barlow", sans-serif';
      ctx.fillText('FOTO DE RECEPCIÓN', 48, 76);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 34px "Barlow Condensed", "Barlow", sans-serif';
      ctx.fillText(titulo, 48, 122);
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = '500 17px "Barlow", sans-serif';
      ctx.fillText(subtitulo, 48, 150);

      /* Pie de foto. */
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '500 14px "Barlow", sans-serif';
      ctx.fillText(CONFIG.nombreTaller, 48, 430);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#F97316';
      ctx.font = '700 15px "Barlow", sans-serif';
      ctx.fillText(ficha, 592, 430);
      ctx.textAlign = 'left';

      return lienzo.toDataURL('image/jpeg', 0.72);
    } catch (error) {
      return '';
    }
  }

  function fechaHora(dia, hora) {
    const [horas, minutos] = String(hora).split(':').map(Number);
    return aISOlocal(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos));
  }

  function crearOrden(datos) {
    const servicios = datos.servicios.map((servicio) => ({
      nombre: servicio.nombre,
      importe: Number(servicio.importe)
    }));
    const total = servicios.reduce((suma, servicio) => suma + servicio.importe, 0);
    return {
      numero_ficha: datos.numero_ficha,
      fecha: datos.fecha,
      hora: datos.hora,
      forma_pago: datos.forma_pago,
      documento: datos.documento,
      cliente: { ...datos.cliente },
      vehiculo: { ...datos.vehiculo },
      servicios,
      total,
      estado: datos.estado,
      notas: datos.notas || '',
      fotos: (datos.fotos || []).filter((foto) => foto.data),
      creado_en: datos.creado_en,
      actualizado_en: datos.actualizado_en
    };
  }

  function construirOrdenes() {
    const hoy = new Date();
    const lunes = inicioSemana(hoy);
    const fechas = {
      lunes: lunes,
      martes: sumarDias(lunes, 1),
      miercoles: sumarDias(lunes, 2),
      jueves: sumarDias(lunes, 3),
      viernes: sumarDias(lunes, 4)
    };

    const foto1 = generarFotoDemo('OT-0001', 'Frente del vehículo', 'Toyota Hilux · 2345ABC', 0);
    const foto2 = generarFotoDemo('OT-0001', 'Rayón en parachoques', 'Toyota Hilux · 2345ABC', 1);
    const foto3 = generarFotoDemo('OT-0005', 'Tablero y kilometraje', 'Hyundai Tucson · 5678UIO', 2);

    return [
      crearOrden({
        numero_ficha: 'OT-0001',
        fecha: aISOfecha(fechas.lunes),
        hora: '09:00',
        forma_pago: 'contado',
        documento: 'factura',
        cliente: {
          nombre_razon_social: 'Juan Pérez Mamani',
          nit: '1234567012',
          direccion: 'Av. Banzer 3er anillo #123',
          telefono: '3-3456789',
          celular: '70012345'
        },
        vehiculo: {
          marca: 'Toyota',
          modelo: 'Hilux',
          tipo: 'Camioneta',
          anio: 2018,
          placa: '2345ABC',
          kilometraje: 85400,
          color: 'Blanco',
          nro_motor: '1GD1234567',
          vin_chasis: 'MR0FB3CD500123456',
          bateria: 'Bosch 100Ah, estado regular'
        },
        servicios: [
          { nombre: 'Cambio de aceite y filtro', importe: 350 },
          { nombre: 'Alineación y balanceo', importe: 200 }
        ],
        estado: 'en_proceso',
        notas: 'Cliente solicita revisar ruido en la suspensión delantera.',
        fotos: [
          { id: 'f_demo_1', descripcion: 'Frente del vehículo', data: foto1 },
          { id: 'f_demo_2', descripcion: 'Rayón en parachoques delantero', data: foto2 }
        ].filter((foto) => foto.data),
        creado_en: fechaHora(fechas.lunes, '08:45'),
        actualizado_en: fechaHora(fechas.lunes, '14:30')
      }),
      crearOrden({
        numero_ficha: 'OT-0002',
        fecha: aISOfecha(fechas.lunes),
        hora: '10:30',
        forma_pago: 'credito',
        documento: 'factura',
        cliente: {
          nombre_razon_social: 'María Fernández Rojas',
          nit: '7654321015',
          direccion: 'Calle Los Jazmines #45',
          telefono: '3-3567890',
          celular: '71234567'
        },
        vehiculo: {
          marca: 'Suzuki',
          modelo: 'Swift',
          tipo: 'Hatchback',
          anio: 2021,
          placa: '4567XYZ',
          kilometraje: 42100,
          color: 'Rojo',
          nro_motor: 'K12M9876543',
          vin_chasis: 'JS2ZC11S0M5123456',
          bateria: 'Willard 60Ah, buena'
        },
        servicios: [
          { nombre: 'Cambio de aceite', importe: 280 },
          { nombre: 'Filtro de aire', importe: 90 },
          { nombre: 'Revisión de frenos', importe: 250 }
        ],
        estado: 'terminado',
        notas: 'Listo para entrega. Se lavó el vehículo.',
        fotos: [],
        creado_en: fechaHora(fechas.lunes, '10:15'),
        actualizado_en: fechaHora(fechas.martes, '16:10')
      }),
      crearOrden({
        numero_ficha: 'OT-0003',
        fecha: aISOfecha(fechas.martes),
        hora: '08:30',
        forma_pago: 'contado',
        documento: 'nota',
        cliente: {
          nombre_razon_social: 'Carlos Quispe Vargas',
          nit: '6543210987',
          direccion: 'Av. Cristo Redentor km 5',
          telefono: '3-3678901',
          celular: '72345678'
        },
        vehiculo: {
          marca: 'Nissan',
          modelo: 'Frontier',
          tipo: 'Camioneta',
          anio: 2016,
          placa: '7890QWE',
          kilometraje: 132500,
          color: 'Gris',
          nro_motor: 'YD25-123456',
          vin_chasis: '3N6CM0KN5GK123456',
          bateria: 'Bosch 90Ah, regular'
        },
        servicios: [
          { nombre: 'Diagnóstico de inyección', importe: 400 },
          { nombre: 'Cambio de bomba de combustible', importe: 850 }
        ],
        estado: 'esperando_repuestos',
        notas: 'Repuesto pedido a la sucursal, llega en 3 días.',
        fotos: [],
        creado_en: fechaHora(fechas.martes, '08:20'),
        actualizado_en: fechaHora(fechas.miercoles, '17:40')
      }),
      crearOrden({
        numero_ficha: 'OT-0004',
        fecha: aISOfecha(fechas.jueves),
        hora: '14:30',
        forma_pago: 'contado',
        documento: 'factura',
        cliente: {
          nombre_razon_social: 'Ana Rojas Gutiérrez',
          nit: '8901234567',
          direccion: 'Barrio Sirari, calle 4 #12',
          telefono: '3-3789012',
          celular: '73456789'
        },
        vehiculo: {
          marca: 'Chevrolet',
          modelo: 'Onix',
          tipo: 'Sedán',
          anio: 2020,
          placa: '1234RTY',
          kilometraje: 56000,
          color: 'Azul',
          nro_motor: 'LV7-654321',
          vin_chasis: '9BGKS48U0LG123456',
          bateria: 'AC Delco 70Ah, buena'
        },
        servicios: [
          { nombre: 'Cambio de aceite y filtro', importe: 300 }
        ],
        estado: 'recibido',
        notas: '',
        fotos: [],
        creado_en: fechaHora(fechas.jueves, '14:20'),
        actualizado_en: fechaHora(fechas.jueves, '14:20')
      }),
      crearOrden({
        numero_ficha: 'OT-0005',
        fecha: aISOfecha(fechas.miercoles),
        hora: '11:00',
        forma_pago: 'credito',
        documento: 'factura',
        cliente: {
          nombre_razon_social: 'Luis Mendoza Suárez',
          nit: '5678901234',
          direccion: 'Av. Santos Dumont #230',
          telefono: '3-3890123',
          celular: '74567890'
        },
        vehiculo: {
          marca: 'Hyundai',
          modelo: 'Tucson',
          tipo: 'SUV',
          anio: 2019,
          placa: '5678UIO',
          kilometraje: 98700,
          color: 'Negro',
          nro_motor: 'G4NA-987654',
          vin_chasis: 'KM8J3CA46KU123456',
          bateria: 'Hankook 80Ah, buena'
        },
        servicios: [
          { nombre: 'Mantenimiento preventivo', importe: 600 },
          { nombre: 'Cambio de pastillas de freno', importe: 380 }
        ],
        estado: 'control_calidad',
        notas: 'Verificar el ajuste del freno de mano antes de entregar.',
        fotos: [
          { id: 'f_demo_4', descripcion: 'Tablero y kilometraje', data: foto3 }
        ].filter((foto) => foto.data),
        creado_en: fechaHora(fechas.miercoles, '10:45'),
        actualizado_en: fechaHora(fechas.viernes, '09:25')
      })
    ];
  }

  function construirEventos() {
    const hoy = new Date();
    const lunes = inicioSemana(hoy);
    const proximoLunes = sumarDias(lunes, 7);
    const fechas = {
      lunes: lunes,
      martes: sumarDias(lunes, 1),
      miercoles: sumarDias(lunes, 2),
      jueves: sumarDias(lunes, 3),
      viernes: sumarDias(lunes, 4),
      proximoLunes: proximoLunes,
      proximoMartes: sumarDias(proximoLunes, 1),
      proximoMiercoles: sumarDias(proximoLunes, 2)
    };

    return [
      {
        id: 'EV-0001',
        titulo: 'Recepción Toyota Hilux - Juan Pérez',
        tipo: 'recepcion',
        fecha_inicio: fechaHora(fechas.lunes, '09:00'),
        fecha_fin: fechaHora(fechas.lunes, '10:00'),
        cliente: 'Juan Pérez',
        placa: '2345ABC',
        id_orden: 'OT-0001',
        notas: 'Revisar ruido en suspensión delantera.'
      },
      {
        id: 'EV-0002',
        titulo: 'Diagnóstico Nissan Frontier - Carlos Quispe',
        tipo: 'cita_tecnica',
        fecha_inicio: fechaHora(fechas.lunes, '09:30'),
        fecha_fin: fechaHora(fechas.lunes, '10:30'),
        cliente: 'Carlos Quispe',
        placa: '7890QWE',
        id_orden: 'OT-0003',
        notas: 'Superposición intencional para demostrar los conflictos.'
      },
      {
        id: 'EV-0003',
        titulo: 'Entrega Suzuki Swift - María Fernández',
        tipo: 'entrega',
        fecha_inicio: fechaHora(fechas.lunes, '11:30'),
        fecha_fin: fechaHora(fechas.lunes, '12:30'),
        cliente: 'María Fernández',
        placa: '4567XYZ',
        id_orden: 'OT-0002',
        notas: 'Confirmar por teléfono antes de la entrega.'
      },
      {
        id: 'EV-0004',
        titulo: 'Reunión con proveedor de aceites',
        tipo: 'reunion',
        fecha_inicio: fechaHora(fechas.miercoles, '15:00'),
        fecha_fin: fechaHora(fechas.miercoles, '16:00'),
        cliente: 'Proveedor Lubricantes Sur',
        placa: '',
        id_orden: '',
        notas: 'Cotizar aceite sintético para el próximo mes.'
      },
      {
        id: 'EV-0005',
        titulo: 'Inventario de herramientas y stock',
        tipo: 'otro',
        fecha_inicio: fechaHora(fechas.jueves, '08:00'),
        fecha_fin: fechaHora(fechas.jueves, '09:00'),
        cliente: '',
        placa: '',
        id_orden: '',
        notas: 'Revisar llaves, filtros y consumibles.'
      },
      {
        id: 'EV-0006',
        titulo: 'Recepción Chevrolet Onix - Ana Rojas',
        tipo: 'recepcion',
        fecha_inicio: fechaHora(fechas.viernes, '10:00'),
        fecha_fin: fechaHora(fechas.viernes, '11:00'),
        cliente: 'Ana Rojas',
        placa: '1234RTY',
        id_orden: 'OT-0004',
        notas: ''
      },
      {
        id: 'EV-0007',
        titulo: 'Revisión Hyundai Tucson - Luis Mendoza',
        tipo: 'cita_tecnica',
        fecha_inicio: fechaHora(fechas.viernes, '10:30'),
        fecha_fin: fechaHora(fechas.viernes, '11:30'),
        cliente: 'Luis Mendoza',
        placa: '5678UIO',
        id_orden: 'OT-0005',
        notas: 'Segunda superposición intencional.'
      },
      {
        id: 'EV-0008',
        titulo: 'Entrega Hyundai Tucson - Luis Mendoza',
        tipo: 'entrega',
        fecha_inicio: fechaHora(fechas.proximoLunes, '14:00'),
        fecha_fin: fechaHora(fechas.proximoLunes, '15:00'),
        cliente: 'Luis Mendoza',
        placa: '5678UIO',
        id_orden: 'OT-0005',
        notas: 'Entrega estimada.'
      },
      {
        id: 'EV-0009',
        titulo: 'Recepción Chevrolet Onix - Ana Rojas',
        tipo: 'recepcion',
        fecha_inicio: fechaHora(fechas.proximoMartes, '09:00'),
        fecha_fin: fechaHora(fechas.proximoMartes, '10:00'),
        cliente: 'Ana Rojas',
        placa: '1234RTY',
        id_orden: '',
        notas: 'Segunda visita para revisión de frenos.'
      },
      {
        id: 'EV-0010',
        titulo: 'Reunión con proveedor de repuestos',
        tipo: 'reunion',
        fecha_inicio: fechaHora(fechas.proximoMiercoles, '16:00'),
        fecha_fin: fechaHora(fechas.proximoMiercoles, '17:30'),
        cliente: 'Repuestos del Oriente',
        placa: '',
        id_orden: '',
        notas: 'Definir precios y tiempos de entrega.'
      }
    ];
  }

  /** Reemplaza el contenido actual por los datos de ejemplo. */
  function cargar() {
    try {
      const ordenes = construirOrdenes();
      const eventos = construirEventos();

      const resultadoOrdenes = Almacen.guardarOrdenes(ordenes);
      if (!resultadoOrdenes.ok) {
        return {
          ok: false,
          mensaje: resultadoOrdenes.cuota
            ? 'No hay espacio en el navegador para cargar las fotos de ejemplo.'
            : 'No se pudieron guardar las órdenes de ejemplo.'
        };
      }

      const resultadoEventos = Almacen.guardarEventos(eventos);
      if (!resultadoEventos.ok) {
        return {
          ok: false,
          mensaje: resultadoEventos.cuota
            ? 'No hay espacio en el navegador para cargar la agenda de ejemplo.'
            : 'No se pudieron guardar los eventos de ejemplo.'
        };
      }

      Almacen.marcarInicializado();
      return { ok: true, ordenes, eventos };
    } catch (error) {
      return { ok: false, mensaje: 'Ocurrió un error al preparar los datos de ejemplo.' };
    }
  }

  return { cargar };
})();
