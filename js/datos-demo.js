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

  /** Fecha de una visita: 0 = mes actual, 1 = mes anterior, etc. */
  function fechaVisita(mesesAtras, dia, hora = '09:00') {
    const hoy = new Date();
    const [horas, minutos] = String(hora).split(':').map(Number);
    if (mesesAtras === 0) {
      const diaSeguro = Math.max(1, Math.min(dia, hoy.getDate() - 1));
      return new Date(hoy.getFullYear(), hoy.getMonth(), diaSeguro, horas, minutos);
    }
    return new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, dia, horas, minutos);
  }

  /* ---------------------------------------------------------
     Clientes y vehículos
     --------------------------------------------------------- */
  function construirClientes() {
    const hoy = new Date();
    const creado = (diasAtras) => aISOlocal(sumarDias(hoy, -diasAtras));

    return [
      {
        id: 'CL-0001',
        nombre_razon_social: 'Juan Pérez Mamani',
        nit: '1234567012',
        direccion: 'Av. Banzer 3er anillo #123',
        telefono: '3-3456789',
        celular: '70012345',
        email: 'juan.perez@correo.bo',
        notas: 'Prefiere que lo llamen por la tarde.',
        creado_en: creado(620)
      },
      {
        id: 'CL-0002',
        nombre_razon_social: 'María Fernández Rojas',
        nit: '7654321015',
        direccion: 'Calle Los Jazmines #45',
        telefono: '3-3567890',
        celular: '71234567',
        email: 'maria.fernandez@correo.bo',
        notas: '',
        creado_en: creado(410)
      },
      {
        id: 'CL-0003',
        nombre_razon_social: 'Carlos Quispe Vargas',
        nit: '6543210987',
        direccion: 'Av. Cristo Redentor km 5',
        telefono: '3-3678901',
        celular: '72345678',
        email: '',
        notas: 'Trabaja con la camioneta de la empresa.',
        creado_en: creado(520)
      },
      {
        id: 'CL-0004',
        nombre_razon_social: 'Ana Rojas Gutiérrez',
        nit: '8901234567',
        direccion: 'Barrio Sirari, calle 4 #12',
        telefono: '3-3789012',
        celular: '73456789',
        email: 'ana.rojas@correo.bo',
        notas: '',
        creado_en: creado(300)
      },
      {
        id: 'CL-0005',
        nombre_razon_social: 'Luis Mendoza Suárez',
        nit: '5678901234',
        direccion: 'Av. Santos Dumont #230',
        telefono: '3-3890123',
        celular: '74567890',
        email: 'luis.mendoza@correo.bo',
        notas: 'Cliente frecuente de mantenimiento preventivo.',
        creado_en: creado(540)
      },
      {
        id: 'CL-0006',
        nombre_razon_social: 'Transportes Andinos S.R.L.',
        nit: '1023456789',
        direccion: 'Parque Industrial, galpón 7',
        telefono: '3-3901234',
        celular: '75678901',
        email: 'flota@transportesandinos.bo',
        notas: 'Empresa con flota. Facturar a nombre de la razón social.',
        creado_en: creado(450)
      },
      {
        id: 'CL-0007',
        nombre_razon_social: 'Rosa Villarroel Chávez',
        nit: '4321098765',
        direccion: 'Calle 21 de Enero #88',
        telefono: '',
        celular: '76789012',
        email: '',
        notas: '',
        creado_en: creado(120)
      },
      {
        id: 'CL-0008',
        nombre_razon_social: 'Pedro Gutiérrez Lima',
        nit: '3210987654',
        direccion: 'Av. Alemana km 8',
        telefono: '',
        celular: '77890123',
        email: '',
        notas: 'Solicita revisión antes de cada viaje al interior.',
        creado_en: creado(260)
      }
    ];
  }

  function construirVehiculos() {
    return [
      {
        id: 'VH-0001', id_cliente: 'CL-0001', placa: '2345ABC',
        marca: 'Toyota', modelo: 'Hilux', tipo: 'Camioneta', anio: 2018,
        color: 'Blanco', nro_motor: '1GD1234567', vin_chasis: 'MR0FB3CD500123456',
        bateria: 'Bosch 100Ah, estado regular', kilometraje_actual: 85400, notas: ''
      },
      {
        id: 'VH-0002', id_cliente: 'CL-0002', placa: '4567XYZ',
        marca: 'Suzuki', modelo: 'Swift', tipo: 'Hatchback', anio: 2021,
        color: 'Rojo', nro_motor: 'K12M9876543', vin_chasis: 'JS2ZC11S0M5123456',
        bateria: 'Willard 60Ah, buena', kilometraje_actual: 42100, notas: ''
      },
      {
        id: 'VH-0003', id_cliente: 'CL-0003', placa: '7890QWE',
        marca: 'Nissan', modelo: 'Frontier', tipo: 'Camioneta', anio: 2016,
        color: 'Gris', nro_motor: 'YD25-123456', vin_chasis: '3N6CM0KN5GK123456',
        bateria: 'Bosch 90Ah, regular', kilometraje_actual: 132500, notas: 'Uso intensivo en ruta.'
      },
      {
        id: 'VH-0004', id_cliente: 'CL-0004', placa: '1234RTY',
        marca: 'Chevrolet', modelo: 'Onix', tipo: 'Sedán', anio: 2020,
        color: 'Azul', nro_motor: 'LV7-654321', vin_chasis: '9BGKS48U0LG123456',
        bateria: 'AC Delco 70Ah, buena', kilometraje_actual: 56000, notas: ''
      },
      {
        id: 'VH-0005', id_cliente: 'CL-0005', placa: '5678UIO',
        marca: 'Hyundai', modelo: 'Tucson', tipo: 'SUV', anio: 2019,
        color: 'Negro', nro_motor: 'G4NA-987654', vin_chasis: 'KM8J3CA46KU123456',
        bateria: 'Hankook 80Ah, buena', kilometraje_actual: 98700, notas: ''
      },
      {
        id: 'VH-0006', id_cliente: 'CL-0001', placa: '8901JKL',
        marca: 'Toyota', modelo: 'Corolla', tipo: 'Sedán', anio: 2015,
        color: 'Gris', nro_motor: '2ZR-456789', vin_chasis: 'JTDBU4EE9A5123456',
        bateria: 'Bosch 70Ah, buena', kilometraje_actual: 120000, notas: 'Segundo vehículo del cliente.'
      },
      {
        id: 'VH-0007', id_cliente: 'CL-0001', placa: '4567MNO',
        marca: 'Honda', modelo: 'CB190', tipo: 'Motocicleta', anio: 2022,
        color: 'Rojo', nro_motor: 'WH190-789123', vin_chasis: 'LALKC1A00N1234567',
        bateria: 'Yuasa 12V, buena', kilometraje_actual: 18500, notas: 'Motocicleta de uso diario.'
      },
      {
        id: 'VH-0008', id_cliente: 'CL-0006', placa: '2345TRA',
        marca: 'Toyota', modelo: 'Hiace', tipo: 'Furgoneta', anio: 2017,
        color: 'Blanco', nro_motor: '2KD-112233', vin_chasis: 'JTFST22P0H0123456',
        bateria: 'Bosch 100Ah, buena', kilometraje_actual: 142000, notas: 'Unidad 3 de la flota.'
      },
      {
        id: 'VH-0009', id_cliente: 'CL-0007', placa: '6789BCD',
        marca: 'Kia', modelo: 'Rio', tipo: 'Hatchback', anio: 2020,
        color: 'Azul', nro_motor: 'G4FG-334455', vin_chasis: 'KNADN512AL6123456',
        bateria: 'Willard 60Ah, buena', kilometraje_actual: 63500, notas: ''
      },
      {
        id: 'VH-0010', id_cliente: 'CL-0008', placa: '3456EFG',
        marca: 'Ford', modelo: 'Ranger', tipo: 'Camioneta', anio: 2019,
        color: 'Negro', nro_motor: 'P4AT-556677', vin_chasis: 'MNCUMFF50KW123456',
        bateria: 'Motorcraft 90Ah, buena', kilometraje_actual: 78000, notas: ''
      }
    ];
  }

  /* ---------------------------------------------------------
     Órdenes, historial y catálogo
     --------------------------------------------------------- */
  function datosCliente(clientes, id) {
    const cliente = clientes.find((item) => item.id === id) || {};
    return {
      nombre_razon_social: cliente.nombre_razon_social || '',
      nit: cliente.nit || '',
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      celular: cliente.celular || ''
    };
  }

  function datosVehiculo(vehiculos, id, kilometraje) {
    const vehiculo = vehiculos.find((item) => item.id === id) || {};
    return {
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      tipo: vehiculo.tipo || 'Sedán',
      anio: vehiculo.anio || '',
      placa: vehiculo.placa || '',
      kilometraje: Number(kilometraje ?? vehiculo.kilometraje_actual) || 0,
      color: vehiculo.color || '',
      nro_motor: vehiculo.nro_motor || '',
      vin_chasis: vehiculo.vin_chasis || '',
      bateria: vehiculo.bateria || ''
    };
  }

  function crearOrden(datos) {
    const servicios = (datos.servicios || []).map((servicio) => ({
      nombre: servicio.nombre,
      importe: Number(servicio.importe) || 0
    }));
    const total = servicios.reduce((suma, servicio) => suma + servicio.importe, 0);
    return {
      numero_ficha: datos.numero_ficha,
      fecha: datos.fecha,
      hora: datos.hora,
      forma_pago: datos.forma_pago || 'contado',
      documento: datos.documento || 'factura',
      cliente: { ...datos.cliente },
      vehiculo: { ...datos.vehiculo },
      servicios,
      total,
      estado: datos.estado,
      notas: datos.notas || '',
      fotos: (datos.fotos || []).filter((foto) => foto.data),
      id_cliente: datos.id_cliente || '',
      id_vehiculo: datos.id_vehiculo || '',
      mecanico: datos.mecanico || '',
      categoria: datos.categoria || 'mantenimiento',
      repuestos: Array.isArray(datos.repuestos) ? datos.repuestos : [],
      garantia: datos.garantia || { dias: 0, km: 0, vence: '' },
      proximo_servicio: datos.proximo_servicio || { fecha: '', km: '', descripcion: '' },
      recomendaciones: Array.isArray(datos.recomendaciones) ? datos.recomendaciones : [],
      creado_en: datos.creado_en,
      actualizado_en: datos.actualizado_en
    };
  }

  function construirOrdenesActuales(clientes, vehiculos) {
    const hoy = new Date();
    const lunes = inicioSemana(hoy);
    const fechas = {
      lunes,
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
        id_cliente: 'CL-0001',
        id_vehiculo: 'VH-0001',
        cliente: datosCliente(clientes, 'CL-0001'),
        vehiculo: datosVehiculo(vehiculos, 'VH-0001', 85400),
        servicios: [
          { nombre: 'Cambio de aceite y filtro', importe: 350 },
          { nombre: 'Alineación y balanceo', importe: 200 }
        ],
        estado: 'en_proceso',
        mecanico: 'Carlos Mamani',
        categoria: 'mantenimiento',
        repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }],
        garantia: { dias: 90, km: 5000, vence: '' },
        proximo_servicio: {
          fecha: aISOfecha(sumarDias(fechas.lunes, 120)),
          km: 90400,
          descripcion: 'Cambio de aceite y filtro'
        },
        recomendaciones: [
          { descripcion: 'Pastillas de freno delanteras al 30%', urgencia: 'media', atendida: false }
        ],
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
        id_cliente: 'CL-0002',
        id_vehiculo: 'VH-0002',
        cliente: datosCliente(clientes, 'CL-0002'),
        vehiculo: datosVehiculo(vehiculos, 'VH-0002', 42100),
        servicios: [
          { nombre: 'Cambio de aceite', importe: 280 },
          { nombre: 'Filtro de aire', importe: 90 },
          { nombre: 'Revisión de frenos', importe: 250 }
        ],
        estado: 'terminado',
        mecanico: 'Miguel Flores',
        categoria: 'reparacion',
        repuestos: [{ nombre: 'Filtro de aire', cantidad: 1 }],
        garantia: { dias: 180, km: 10000, vence: '' },
        proximo_servicio: {
          fecha: aISOfecha(sumarDias(fechas.lunes, 150)),
          km: 47100,
          descripcion: 'Mantenimiento preventivo'
        },
        recomendaciones: [],
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
        id_cliente: 'CL-0003',
        id_vehiculo: 'VH-0003',
        cliente: datosCliente(clientes, 'CL-0003'),
        vehiculo: datosVehiculo(vehiculos, 'VH-0003', 132500),
        servicios: [
          { nombre: 'Diagnóstico de inyección', importe: 400 },
          { nombre: 'Cambio de bomba de combustible', importe: 850 }
        ],
        estado: 'esperando_repuestos',
        mecanico: 'Jorge Salazar',
        categoria: 'diagnostico',
        repuestos: [{ nombre: 'Bomba de combustible', cantidad: 1 }],
        garantia: { dias: 180, km: 10000, vence: '' },
        proximo_servicio: {
          fecha: aISOfecha(sumarDias(fechas.martes, 120)),
          km: 137500,
          descripcion: 'Control de inyección'
        },
        recomendaciones: [],
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
        id_cliente: 'CL-0004',
        id_vehiculo: 'VH-0004',
        cliente: datosCliente(clientes, 'CL-0004'),
        vehiculo: datosVehiculo(vehiculos, 'VH-0004', 56000),
        servicios: [
          { nombre: 'Cambio de aceite y filtro', importe: 300 }
        ],
        estado: 'recibido',
        mecanico: 'Carlos Mamani',
        categoria: 'mantenimiento',
        repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }],
        garantia: { dias: 90, km: 5000, vence: '' },
        proximo_servicio: {
          fecha: aISOfecha(sumarDias(fechas.jueves, 120)),
          km: 61000,
          descripcion: 'Cambio de aceite'
        },
        recomendaciones: [],
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
        id_cliente: 'CL-0005',
        id_vehiculo: 'VH-0005',
        cliente: datosCliente(clientes, 'CL-0005'),
        vehiculo: datosVehiculo(vehiculos, 'VH-0005', 98700),
        servicios: [
          { nombre: 'Mantenimiento preventivo', importe: 600 },
          { nombre: 'Cambio de pastillas de freno', importe: 380 }
        ],
        estado: 'control_calidad',
        mecanico: 'Miguel Flores',
        categoria: 'mantenimiento',
        repuestos: [{ nombre: 'Pastillas de freno', cantidad: 1 }],
        garantia: { dias: 90, km: 5000, vence: '' },
        proximo_servicio: {
          fecha: aISOfecha(sumarDias(fechas.miercoles, 120)),
          km: 103700,
          descripcion: 'Mantenimiento preventivo'
        },
        recomendaciones: [
          { descripcion: 'Batería con baja carga en prueba de arranque', urgencia: 'alta', atendida: false }
        ],
        notas: 'Verificar el ajuste del freno de mano antes de entregar.',
        fotos: [
          { id: 'f_demo_4', descripcion: 'Tablero y kilometraje', data: foto3 }
        ].filter((foto) => foto.data),
        creado_en: fechaHora(fechas.miercoles, '10:45'),
        actualizado_en: fechaHora(fechas.viernes, '09:25')
      })
    ];
  }

  /** Veinte visitas históricas repartidas en los últimos 18 meses. */
  function construirVisitasHistoricas() {
    return [
      { placa: '2345ABC', meses: 17, dia: 12, hora: '09:10', km: 72000, mecanico: 'Carlos Mamani', categoria: 'mantenimiento', servicios: ['Cambio de aceite y filtro'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '7890QWE', meses: 15, dia: 8, hora: '10:20', km: 118000, mecanico: 'Jorge Salazar', categoria: 'diagnostico', servicios: ['Diagnóstico de inyección', 'Limpieza de inyectores'], repuestos: [], forma_pago: 'credito', notas: 'Se recomendó cambiar el filtro de combustible.' },
      { placa: '5678UIO', meses: 16, dia: 21, hora: '15:00', km: 85000, mecanico: 'Miguel Flores', categoria: 'mantenimiento', servicios: ['Mantenimiento preventivo'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }, { nombre: 'Filtro de aire', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '8901JKL', meses: 14, dia: 5, hora: '08:40', km: 108000, mecanico: 'Carlos Mamani', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Filtro de aire'], repuestos: [{ nombre: 'Filtro de aire', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '2345TRA', meses: 13, dia: 18, hora: '11:30', km: 128000, mecanico: 'Miguel Flores', categoria: 'reparacion', servicios: ['Revisión de frenos', 'Cambio de pastillas de freno'], repuestos: [{ nombre: 'Pastillas de freno', cantidad: 1 }], forma_pago: 'credito', notas: 'Unidad de flota. Se coordinó con el encargado.' },
      { placa: '2345ABC', meses: 12, dia: 9, hora: '09:00', km: 78000, mecanico: 'Carlos Mamani', categoria: 'mantenimiento', servicios: ['Cambio de aceite y filtro', 'Alineación y balanceo'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '4567XYZ', meses: 11, dia: 22, hora: '14:10', km: 38000, mecanico: 'Miguel Flores', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Cambio de bujías'], repuestos: [{ nombre: 'Bujías', cantidad: 4 }], forma_pago: 'contado', notas: '' },
      { placa: '4567MNO', meses: 10, dia: 14, hora: '10:00', km: 15000, mecanico: 'Jorge Salazar', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Cambio de bujías'], repuestos: [{ nombre: 'Bujía', cantidad: 1 }], forma_pago: 'contado', notas: 'Mantenimiento de motocicleta.', proximoFechaDias: 60, proximoKm: 25000, proximoDescripcion: 'Mantenimiento preventivo' },
      { placa: '7890QWE', meses: 9, dia: 3, hora: '16:20', km: 125000, mecanico: 'Jorge Salazar', categoria: 'reparacion', servicios: ['Reparación de suspensión'], repuestos: [{ nombre: 'Amortiguador delantero', cantidad: 2 }], forma_pago: 'credito', notas: 'Se reemplazaron ambos amortiguadores delanteros.' },
      { placa: '5678UIO', meses: 8, dia: 19, hora: '09:40', km: 92000, mecanico: 'Miguel Flores', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Filtro de aire', 'Revisión de frenos'], repuestos: [{ nombre: 'Filtro de aire', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '2345ABC', meses: 7, dia: 7, hora: '08:30', km: 81500, mecanico: 'Carlos Mamani', categoria: 'mantenimiento', servicios: ['Mantenimiento preventivo', 'Alineación y balanceo'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }, { nombre: 'Filtro de combustible', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '1234RTY', meses: 6, dia: 25, hora: '11:10', km: 52000, mecanico: 'Miguel Flores', categoria: 'mantenimiento', servicios: ['Cambio de aceite y filtro'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado', notas: '', proximoFechaDias: 75, proximoKm: 70000, proximoDescripcion: 'Cambio de aceite y filtro' },
      { placa: '8901JKL', meses: 5, dia: 16, hora: '15:30', km: 115000, mecanico: 'Carlos Mamani', categoria: 'reparacion', servicios: ['Cambio de correa de distribución'], repuestos: [{ nombre: 'Correa de distribución', cantidad: 1 }, { nombre: 'Tensor', cantidad: 1 }], forma_pago: 'credito', notas: 'Se recomendó cambiar la bomba de agua en la próxima visita.', proximoFechaDias: 20, proximoKm: 130000, proximoDescripcion: 'Mantenimiento preventivo' },
      { placa: '4567XYZ', meses: 1, dia: 12, hora: '09:20', km: 40500, mecanico: 'Miguel Flores', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Filtro de aire', 'Lavado y encerado'], repuestos: [{ nombre: 'Filtro de aire', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      { placa: '2345TRA', meses: 1, dia: 6, hora: '08:00', km: 136000, mecanico: 'Jorge Salazar', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Revisión de frenos'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'credito', notas: '', garantiaVenceDias: 12, proximoFechaDias: 90, proximoKm: 150000, proximoDescripcion: 'Mantenimiento preventivo' },
      { placa: '3456EFG', meses: 1, dia: 24, hora: '13:40', km: 74500, mecanico: 'Carlos Mamani', categoria: 'mantenimiento', servicios: ['Cambio de aceite', 'Alineación y balanceo'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado', notas: '' },
      {
        placa: '2345ABC', meses: 2, dia: 14, hora: '10:10', km: 84600, mecanico: 'Carlos Mamani', categoria: 'mantenimiento',
        servicios: ['Cambio de aceite y filtro'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado',
        garantiaDias: 365, proximoFechaDias: -10, proximoKm: 89600, proximoDescripcion: 'Cambio de aceite y filtro',
        recomendaciones: [{ descripcion: 'Pastillas de freno delanteras al 30%', urgencia: 'media', atendida: false }],
        notas: 'Se detectó desgaste parejo en las pastillas delanteras.'
      },
      {
        placa: '7890QWE', meses: 2, dia: 2, hora: '16:00', km: 130500, mecanico: 'Jorge Salazar', categoria: 'mantenimiento',
        servicios: ['Cambio de aceite', 'Limpieza de inyectores'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'credito',
        garantiaDias: 365, proximoFechaDias: 60, proximoKm: 130000, proximoDescripcion: 'Cambio de aceite y revisión general',
        notas: 'El kilometraje superó el próximo servicio programado.'
      },
      {
        placa: '5678UIO', meses: 0, dia: 6, hora: '09:30', km: 97000, mecanico: 'Miguel Flores', categoria: 'mantenimiento',
        servicios: ['Mantenimiento preventivo', 'Cambio de pastillas de freno'], repuestos: [{ nombre: 'Pastillas de freno', cantidad: 1 }, { nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'credito',
        garantiaVenceDias: 20, proximoFechaDias: 120, proximoKm: 102000, proximoDescripcion: 'Mantenimiento preventivo',
        recomendaciones: [{ descripcion: 'Batería con baja carga en prueba de arranque', urgencia: 'alta', atendida: false }],
        notas: ''
      },
      {
        placa: '6789BCD', meses: 0, dia: 2, hora: '11:00', km: 61000, mecanico: 'Carlos Mamani', categoria: 'mantenimiento',
        servicios: ['Cambio de aceite y filtro', 'Revisión de frenos'], repuestos: [{ nombre: 'Filtro de aceite', cantidad: 1 }], forma_pago: 'contado',
        proximoFechaDias: 120, proximoKm: 66000, proximoDescripcion: 'Cambio de aceite y filtro',
        recomendaciones: [{ descripcion: 'Ruido leve en la suspensión delantera', urgencia: 'media', atendida: false }],
        notas: 'Se recomienda revisar bujes en la próxima visita.'
      }
    ];
  }

  function construirOrdenesHistoricas(clientes, vehiculos, catalogo) {
    const catalogoPorNombre = new Map(catalogo.map((servicio) => [servicio.nombre, servicio.importe]));
    const hoy = new Date();
    const visitas = construirVisitasHistoricas()
      .map((visita) => ({ ...visita, fechaObj: fechaVisita(visita.meses, visita.dia, visita.hora) }))
      .sort((a, b) => a.fechaObj - b.fechaObj);

    return visitas.map((visita, indice) => {
      const vehiculo = vehiculos.find((item) => item.placa === visita.placa);
      const idVehiculo = vehiculo?.id || '';
      const idCliente = vehiculo?.id_cliente || '';
      const fecha = visita.fechaObj;
      const entrega = sumarDias(fecha, 1);
      const fechaEntrega = new Date(
        entrega.getFullYear(), entrega.getMonth(), entrega.getDate(), 17, 0
      );
      const servicios = visita.servicios.map((nombre) => ({
        nombre,
        importe: catalogoPorNombre.get(nombre) || 0
      }));
      const proximoFecha = visita.proximoFechaDias !== undefined
        ? aISOfecha(sumarDias(hoy, visita.proximoFechaDias))
        : aISOfecha(sumarDias(fecha, 120));
      const proximoKm = visita.proximoKm || (visita.km + 5000);
      const garantiaDias = visita.garantiaDias || 90;
      const garantiaKm = visita.garantiaKm || 5000;
      const vence = visita.garantiaVenceDias !== undefined
        ? aISOfecha(sumarDias(hoy, visita.garantiaVenceDias))
        : aISOfecha(sumarDias(fechaEntrega, garantiaDias));

      return crearOrden({
        numero_ficha: `OT-${String(6 + indice).padStart(4, '0')}`,
        fecha: aISOfecha(fecha),
        hora: aISOhora(fecha),
        forma_pago: visita.forma_pago,
        documento: 'factura',
        id_cliente: idCliente,
        id_vehiculo: idVehiculo,
        cliente: datosCliente(clientes, idCliente),
        vehiculo: datosVehiculo(vehiculos, idVehiculo, visita.km),
        servicios,
        estado: 'entregado',
        mecanico: visita.mecanico,
        categoria: visita.categoria,
        repuestos: visita.repuestos || [],
        garantia: { dias: garantiaDias, km: garantiaKm, vence },
        proximo_servicio: {
          fecha: proximoFecha,
          km: proximoKm,
          descripcion: visita.proximoDescripcion || 'Mantenimiento preventivo'
        },
        recomendaciones: visita.recomendaciones || [],
        notas: visita.notas || '',
        fotos: [],
        creado_en: aISOlocal(fecha),
        actualizado_en: aISOlocal(fechaEntrega)
      });
    });
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

  /** Convierte las órdenes entregadas en registros de historial. */
  function construirHistorial(ordenes) {
    const historial = [];
    ordenes
      .filter((orden) => orden.estado === 'entregado')
      .forEach((orden) => {
        historial.push(Almacen.construirRegistroHistorial(
          orden,
          orden.id_cliente,
          orden.id_vehiculo,
          null,
          historial
        ));
      });
    return historial;
  }

  /** Reemplaza el contenido actual por los datos de ejemplo. */
  function cargar() {
    try {
      const clientes = construirClientes();
      const vehiculos = construirVehiculos();
      const catalogo = Almacen.catalogoPredeterminado();
      const ordenesActuales = construirOrdenesActuales(clientes, vehiculos);
      const ordenesHistoricas = construirOrdenesHistoricas(clientes, vehiculos, catalogo);
      const ordenes = [...ordenesActuales, ...ordenesHistoricas];
      const eventos = construirEventos();

      /* Una foto de recepción en la visita histórica más reciente del Hilux
         para mostrar las miniaturas en la línea de tiempo. */
      const ultimaHilux = ordenes
        .filter((orden) => orden.id_vehiculo === 'VH-0001' && orden.estado === 'entregado')
        .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))
        .pop();
      if (ultimaHilux) {
        const foto = generarFotoDemo(ultimaHilux.numero_ficha, 'Estado al ingreso', 'Toyota Hilux · 2345ABC', 3);
        if (foto) {
          ultimaHilux.fotos = [{
            id: 'f_demo_hist_1',
            descripcion: 'Estado del vehículo al ingreso',
            data: foto
          }];
        }
      }

      const historial = construirHistorial(ordenes);

      const resultados = [
        { resultado: Almacen.guardarClientes(clientes), mensaje: 'No se pudieron guardar los clientes de ejemplo.' },
        { resultado: Almacen.guardarVehiculos(vehiculos), mensaje: 'No se pudieron guardar los vehículos de ejemplo.' },
        { resultado: Almacen.guardarCatalogo(catalogo), mensaje: 'No se pudo guardar el catálogo de servicios.' },
        { resultado: Almacen.guardarOrdenes(ordenes), mensaje: 'No se pudieron guardar las órdenes de ejemplo.', fotos: true },
        { resultado: Almacen.guardarEventos(eventos), mensaje: 'No se pudieron guardar los eventos de ejemplo.' },
        { resultado: Almacen.guardarHistorial(historial), mensaje: 'No se pudo guardar el historial de ejemplo.' },
        { resultado: Almacen.guardarRecordatorios({}), mensaje: 'No se pudieron guardar los recordatorios.' }
      ];

      const fallo = resultados.find((item) => !item.resultado.ok);
      if (fallo) {
        return {
          ok: false,
          mensaje: fallo.resultado.cuota && fallo.fotos
            ? 'No hay espacio en el navegador para cargar las fotos de ejemplo.'
            : fallo.mensaje
        };
      }

      Almacen.marcarInicializado();
      return { ok: true, ordenes, eventos, clientes, vehiculos, historial, catalogo };
    } catch (error) {
      return { ok: false, mensaje: 'Ocurrió un error al preparar los datos de ejemplo.' };
    }
  }

  return { cargar };
})();
