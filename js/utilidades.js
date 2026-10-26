'use strict';

/* =========================================================
   UTILIDADES GENERALES
   Configuración, formatos, iconos, modales, toasts y helpers.
   ========================================================= */

/* Datos editables del taller. Cambiá estos valores para adaptar la demo. */
const CONFIG = {
  nombreTaller: 'Taller Mecánico Demo',
  telefonoWhatsApp: '59170012345',
  telefonoVisible: '+591 700 12345',
  direccion: 'Av. Banzer 3er anillo #123',
  ciudad: 'Santa Cruz de la Sierra - Bolivia',
  email: 'contacto@tallerdemo.bo',
  horario: 'Lun a Vie · 07:00 a 20:00 · Sáb 08:00 a 13:00'
};

/* Tipos de evento de la agenda, con su color e icono. */
const TIPOS_EVENTO = {
  recepcion: { etiqueta: 'Recepción', color: '#3B82F6', icono: 'auto' },
  entrega: { etiqueta: 'Entrega', color: '#10B981', icono: 'check' },
  reunion: { etiqueta: 'Reunión', color: '#8B5CF6', icono: 'usuarios' },
  cita_tecnica: { etiqueta: 'Cita técnica', color: '#F97316', icono: 'llave' },
  otro: { etiqueta: 'Otro', color: '#6B7280', icono: 'calendario' }
};

/* Estados posibles de una orden de trabajo. */
const ESTADOS_ORDEN = {
  recibido: { etiqueta: 'Recibido', clase: 'estado-recibido' },
  diagnostico: { etiqueta: 'Diagnóstico', clase: 'estado-diagnostico' },
  en_proceso: { etiqueta: 'En proceso', clase: 'estado-proceso' },
  esperando_repuestos: { etiqueta: 'Esperando repuestos', clase: 'estado-repuestos' },
  control_calidad: { etiqueta: 'Control de calidad', clase: 'estado-calidad' },
  terminado: { etiqueta: 'Terminado', clase: 'estado-terminado' },
  entregado: { etiqueta: 'Entregado', clase: 'estado-entregado' }
};

/* Etapas visibles del stepper (la espera de repuestos se muestra como aviso). */
const ETAPAS_ORDEN = [
  { clave: 'recibido', etiqueta: 'Recibido' },
  { clave: 'diagnostico', etiqueta: 'Diagnóstico' },
  { clave: 'en_proceso', etiqueta: 'En proceso' },
  { clave: 'control_calidad', etiqueta: 'Control de calidad' },
  { clave: 'terminado', etiqueta: 'Terminado' },
  { clave: 'entregado', etiqueta: 'Entregado' }
];

const ETAPA_POR_ESTADO = {
  recibido: 0,
  diagnostico: 1,
  en_proceso: 2,
  esperando_repuestos: 2,
  control_calidad: 3,
  terminado: 4,
  entregado: 5
};

const FORMAS_PAGO = { contado: 'Contado', credito: 'Crédito' };
const DOCUMENTOS = { factura: 'Factura', nota: 'Nota de venta' };

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
];

/* ---------------------------------------------------------
   Iconos SVG en línea (sin librerías externas)
   --------------------------------------------------------- */
const TRAZOS_ICONOS = {
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  ordenes: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  izquierda: '<path d="m15 18-6-6 6-6"/>',
  derecha: '<path d="m9 18 6-6-6-6"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  buscar: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  llave: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  auto: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  camara: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  basura: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  editar: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  imprimir: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>',
  alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  cerrar: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  usuario: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  telefono: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  ubicacion: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  archivo: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  reiniciar: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  volver: '<path d="m12 19-7-7 7-7M19 12H5"/>',
  guardar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  enlace: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copiar: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  imagen: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  filtro: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  moneda: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v2M12 16v2"/>',
  tablero: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
};

/**
 * Devuelve el HTML de un icono SVG.
 * @param {string} nombre clave de TRAZOS_ICONOS
 * @param {string} clase clase adicional
 */
function icono(nombre, clase = '') {
  const trazo = TRAZOS_ICONOS[nombre] || TRAZOS_ICONOS.info;
  return `<span class="icono ${clase}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${trazo}</svg></span>`;
}

/* ---------------------------------------------------------
   Formatos de fecha, hora y moneda
   --------------------------------------------------------- */
function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

/** Convierte un Date o un texto ISO local en Date, sin problemas de zona horaria. */
function parsearFechaHora(valor) {
  if (valor instanceof Date) return new Date(valor.getTime());
  if (!valor) return null;
  if (typeof valor === 'string') {
    const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (coincidencia) {
      const [, anio, mes, dia, hora = '00', minuto = '00'] = coincidencia;
      return new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
    }
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Fecha y hora en formato ISO local: 2026-10-28T09:00 */
function aISOlocal(fecha) {
  const f = fecha instanceof Date ? fecha : parsearFechaHora(fecha);
  if (!f) return '';
  return `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}T${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

/** Fecha en formato ISO corto: 2026-10-28 */
function aISOfecha(fecha) {
  const f = fecha instanceof Date ? fecha : parsearFechaHora(fecha);
  if (!f) return '';
  return `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;
}

/** Hora en formato 24 h: 09:05 */
function aISOhora(fecha) {
  const f = fecha instanceof Date ? fecha : parsearFechaHora(fecha);
  if (!f) return '';
  return `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

/** dd/mm/aaaa */
function formatearFecha(valor) {
  const f = parsearFechaHora(valor);
  if (!f) return '—';
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()}`;
}

/** 24 horas: 14:30 */
function formatearHora(valor) {
  const f = parsearFechaHora(valor);
  if (!f) return '—';
  return `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

/** lunes 26 de octubre de 2026, 14:30 */
function formatearFechaLarga(valor, incluirHora = true) {
  const f = parsearFechaHora(valor);
  if (!f) return '—';
  const base = `${DIAS_SEMANA[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
  return incluirHora ? `${base}, ${formatearHora(f)}` : base;
}

/** lunes 26 de octubre */
function formatearFechaCorta(valor) {
  const f = parsearFechaHora(valor);
  if (!f) return '—';
  return `${DIAS_SEMANA[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`;
}

/** 09:00 – 10:30 */
function formatearRangoHoras(inicio, fin) {
  return `${formatearHora(inicio)} – ${formatearHora(fin)}`;
}

function capitalizar(texto) {
  const valor = String(texto || '');
  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function mismoDia(a, b) {
  const fa = a instanceof Date ? a : parsearFechaHora(a);
  const fb = b instanceof Date ? b : parsearFechaHora(b);
  if (!fa || !fb) return false;
  return fa.getFullYear() === fb.getFullYear()
    && fa.getMonth() === fb.getMonth()
    && fa.getDate() === fb.getDate();
}

function inicioDelDia(fecha) {
  const f = fecha instanceof Date ? fecha : parsearFechaHora(fecha);
  return new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0);
}

function sumarDias(fecha, cantidad) {
  const f = fecha instanceof Date ? new Date(fecha.getTime()) : parsearFechaHora(fecha);
  f.setDate(f.getDate() + cantidad);
  return f;
}

/** Lunes como primer día de la semana. */
function inicioSemana(fecha) {
  const f = inicioDelDia(fecha);
  const dia = f.getDay();
  const desplazamiento = dia === 0 ? 6 : dia - 1;
  return sumarDias(f, -desplazamiento);
}

function minutosDesdeMedianoche(fecha) {
  const f = fecha instanceof Date ? fecha : parsearFechaHora(fecha);
  return f.getHours() * 60 + f.getMinutes();
}

/** Bs 1.250,00 — formato boliviano. */
function formatearMoneda(valor) {
  const numero = Number(valor);
  const seguro = Number.isFinite(numero) ? numero : 0;
  const negativo = seguro < 0;
  const partes = Math.abs(seguro).toFixed(2).split('.');
  const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}Bs ${entero},${partes[1]}`;
}

/** Convierte "1.250,50" o "1250.5" en número. */
function aNumero(valor) {
  if (typeof valor === 'number') return valor;
  const texto = String(valor ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : NaN;
}

function normalizarPlaca(valor) {
  return String(valor || '').toUpperCase().replace(/\s+/g, '').trim();
}

function escaparHTML(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Genera un identificador correlativo: EV-0001, OT-0006, etc. */
function generarId(prefijo, lista = []) {
  const numeros = lista
    .map((item) => {
      const texto = String(item && (item.id || item.numero_ficha) || '');
      const numero = parseInt(texto.replace(/\D/g, ''), 10);
      return Number.isFinite(numero) ? numero : 0;
    })
    .filter((numero) => numero > 0);
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `${prefijo}-${String(siguiente).padStart(4, '0')}`;
}

function generarIdFoto() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Base64 seguro para texto UTF-8 (se usa en el hash del link de consulta). */
function codificarBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  bytes.forEach((byte) => { binario += String.fromCharCode(byte); });
  return btoa(binario);
}

function decodificarBase64(codigo) {
  const binario = atob(String(codigo));
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Base64 seguro para URL: reemplaza +, / y quita el relleno =. */
function codificarBase64Url(texto) {
  return codificarBase64(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodificarBase64Url(codigo) {
  let base64 = String(codigo || '').replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodificarBase64(base64);
}

/** Redimensiona y comprime una imagen con canvas. Devuelve un dataURL JPEG. */
function comprimirImagen(archivo, maxLado = 800, calidad = 0.7) {
  return new Promise((resolver, rechazar) => {
    if (!archivo || !archivo.type || !archivo.type.startsWith('image/')) {
      rechazar(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => rechazar(new Error('No se pudo procesar la imagen.'));
      imagen.onload = () => {
        try {
          const anchoOriginal = imagen.naturalWidth || imagen.width;
          const altoOriginal = imagen.naturalHeight || imagen.height;
          if (!anchoOriginal || !altoOriginal) {
            rechazar(new Error('La imagen no tiene dimensiones válidas.'));
            return;
          }
          const escala = Math.min(1, maxLado / Math.max(anchoOriginal, altoOriginal));
          const lienzo = document.createElement('canvas');
          lienzo.width = Math.max(1, Math.round(anchoOriginal * escala));
          lienzo.height = Math.max(1, Math.round(altoOriginal * escala));
          const contexto = lienzo.getContext('2d');
          contexto.fillStyle = '#ffffff';
          contexto.fillRect(0, 0, lienzo.width, lienzo.height);
          contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
          resolver(lienzo.toDataURL('image/jpeg', calidad));
        } catch (error) {
          rechazar(new Error('No se pudo comprimir la imagen.'));
        }
      };
      imagen.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

/* ---------------------------------------------------------
   Toasts (notificaciones propias)
   --------------------------------------------------------- */
function mostrarToast(mensaje, tipo = 'info', duracion = 3800) {
  const contenedor = document.getElementById('toasts');
  if (!contenedor) return;
  const iconos = { exito: 'check', error: 'alerta', aviso: 'alerta', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast-icono">${icono(iconos[tipo] || 'info')}</span>
    <span class="toast-texto">${escaparHTML(mensaje)}</span>
    <button type="button" class="toast-cerrar" aria-label="Cerrar aviso">${icono('cerrar')}</button>
  `;
  contenedor.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  const cerrar = () => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 260);
  };
  toast.querySelector('.toast-cerrar').addEventListener('click', cerrar);
  setTimeout(cerrar, duracion);
}

/* ---------------------------------------------------------
   Modales accesibles
   --------------------------------------------------------- */
const Modal = (() => {
  const pila = [];

  function obtenerEnfocables(modal) {
    return Array.from(modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((elemento) => elemento.offsetParent !== null);
  }

  function abrir(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal._focoAnterior = document.activeElement;
    modal.classList.add('abierto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-abierto');
    if (!pila.includes(id)) pila.push(id);
    setTimeout(() => {
      const enfocable = modal.querySelector('[autofocus]') || obtenerEnfocables(modal)[0];
      if (enfocable) enfocable.focus();
    }, 70);
  }

  function cerrar(id) {
    const identificador = id || pila[pila.length - 1];
    if (!identificador) return;
    const modal = document.getElementById(identificador);
    if (!modal || !modal.classList.contains('abierto')) return;
    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
    const indice = pila.indexOf(identificador);
    if (indice >= 0) pila.splice(indice, 1);
    if (!pila.length) document.body.classList.remove('modal-abierto');
    if (modal._focoAnterior && typeof modal._focoAnterior.focus === 'function') {
      modal._focoAnterior.focus();
    }
    if (typeof modal._alCerrar === 'function') {
      const accion = modal._alCerrar;
      modal._alCerrar = null;
      accion();
    }
  }

  function cerrarTodos() {
    [...pila].reverse().forEach((id) => cerrar(id));
  }

  document.addEventListener('keydown', (evento) => {
    if (!pila.length) return;
    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar();
      return;
    }
    if (evento.key === 'Tab') {
      const modal = document.getElementById(pila[pila.length - 1]);
      if (!modal) return;
      const enfocables = obtenerEnfocables(modal);
      if (!enfocables.length) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });

  document.addEventListener('click', (evento) => {
    const botonCerrar = evento.target.closest('[data-cerrar-modal]');
    if (botonCerrar) {
      evento.preventDefault();
      const modal = botonCerrar.closest('.modal-fondo');
      if (modal) cerrar(modal.id);
      return;
    }
    if (evento.target.classList.contains('modal-fondo')) {
      cerrar(evento.target.id);
    }
  });

  return { abrir, cerrar, cerrarTodos, estaAbierto: (id) => pila.includes(id) };
})();

/* Confirmación propia con promesa. */
let resolverConfirmacion = null;

function confirmarAccion(opciones = {}) {
  const {
    titulo = 'Confirmar acción',
    mensaje = '¿Deseas continuar?',
    textoAceptar = 'Aceptar',
    textoCancelar = 'Cancelar',
    peligro = false
  } = opciones;

  const modal = document.getElementById('modal-confirmar');
  if (!modal) return Promise.resolve(window.confirm(mensaje));

  if (resolverConfirmacion) {
    resolverConfirmacion(false);
    resolverConfirmacion = null;
  }

  document.getElementById('confirmar-titulo').textContent = titulo;
  document.getElementById('confirmar-mensaje').textContent = mensaje;
  const botonAceptar = document.getElementById('btn-confirmar-aceptar');
  const botonCancelar = document.getElementById('btn-confirmar-cancelar');
  botonAceptar.textContent = textoAceptar;
  botonCancelar.textContent = textoCancelar;
  botonAceptar.className = `btn ${peligro ? 'btn-peligro' : 'btn-primario'}`;

  return new Promise((resolver) => {
    resolverConfirmacion = resolver;
    modal._alCerrar = () => {
      if (resolverConfirmacion) {
        resolverConfirmacion(false);
        resolverConfirmacion = null;
      }
    };
    Modal.abrir('modal-confirmar');
  });
}

document.addEventListener('click', (evento) => {
  const aceptar = evento.target.closest('#btn-confirmar-aceptar');
  const cancelar = evento.target.closest('#btn-confirmar-cancelar');
  if (!aceptar && !cancelar) return;
  evento.preventDefault();
  const resolver = resolverConfirmacion;
  resolverConfirmacion = null;
  Modal.cerrar('modal-confirmar');
  if (resolver) resolver(Boolean(aceptar));
});

/* ---------------------------------------------------------
   Visor de fotos (lightbox)
   --------------------------------------------------------- */
const Lightbox = (() => {
  let fotos = [];
  let indice = 0;

  function pintar() {
    const modal = document.getElementById('modal-lightbox');
    if (!modal) return;
    const foto = fotos[indice];
    if (!foto) return;
    const imagen = document.getElementById('lightbox-imagen');
    const descripcion = document.getElementById('lightbox-descripcion');
    const contador = document.getElementById('lightbox-contador');
    imagen.src = foto.data || foto.src || '';
    imagen.alt = foto.descripcion || 'Foto de recepción';
    descripcion.textContent = foto.descripcion || 'Foto de recepción';
    contador.textContent = `${indice + 1} / ${fotos.length}`;
    const anterior = document.getElementById('lightbox-anterior');
    const siguiente = document.getElementById('lightbox-siguiente');
    anterior.classList.toggle('oculto', fotos.length < 2);
    siguiente.classList.toggle('oculto', fotos.length < 2);
  }

  function abrir(lista, posicion = 0) {
    fotos = Array.isArray(lista) ? lista.filter((foto) => foto && (foto.data || foto.src)) : [];
    if (!fotos.length) return;
    indice = Math.max(0, Math.min(posicion, fotos.length - 1));
    pintar();
    Modal.abrir('modal-lightbox');
  }

  function mover(paso) {
    if (fotos.length < 2) return;
    indice = (indice + paso + fotos.length) % fotos.length;
    pintar();
  }

  document.addEventListener('click', (evento) => {
    if (evento.target.closest('#lightbox-anterior')) {
      evento.preventDefault();
      mover(-1);
    }
    if (evento.target.closest('#lightbox-siguiente')) {
      evento.preventDefault();
      mover(1);
    }
  });

  document.addEventListener('keydown', (evento) => {
    if (!Modal.estaAbierto('modal-lightbox')) return;
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      mover(-1);
    }
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      mover(1);
    }
  });

  return { abrir };
})();

/* ---------------------------------------------------------
   Helpers de interfaz y datos
   --------------------------------------------------------- */
function estadoBadge(estado) {
  const info = ESTADOS_ORDEN[estado] || { etiqueta: estado || 'Sin estado', clase: 'estado-recibido' };
  return `<span class="badge ${info.clase}">${escaparHTML(info.etiqueta)}</span>`;
}

/**
 * Busca la fecha de entrega estimada de una ficha en los eventos de la agenda.
 * Devuelve la próxima entrega vinculada o, si ya pasaron todas, la última.
 */
function buscarEntregaEstimada(ficha) {
  try {
    const eventos = Almacen.obtenerEventos()
      .filter((evento) => evento
        && evento.tipo === 'entrega'
        && evento.id_orden === ficha
        && evento.fecha_inicio)
      .sort((a, b) => parsearFechaHora(a.fecha_inicio) - parsearFechaHora(b.fecha_inicio));

    if (!eventos.length) return '';
    const ahora = new Date();
    const proximo = eventos.find((evento) => {
      const fin = parsearFechaHora(evento.fecha_fin || evento.fecha_inicio);
      return fin && fin >= ahora;
    });
    return (proximo || eventos[eventos.length - 1]).fecha_inicio;
  } catch (error) {
    return '';
  }
}

function tipoEventoBadge(tipo) {
  const info = TIPOS_EVENTO[tipo] || TIPOS_EVENTO.otro;
  return `<span class="badge-tipo" style="--tipo-color:${info.color}">${icono(info.icono)}${escaparHTML(info.etiqueta)}</span>`;
}

/** Línea de progreso compartida por la app interna y el portal. */
function renderStepper(estado, compacto = false) {
  const etapaActual = ETAPA_POR_ESTADO[estado] ?? 0;
  const aviso = estado === 'esperando_repuestos'
    ? `<div class="stepper-aviso">${icono('reloj')} Esperando repuestos</div>`
    : '';
  const pasos = ETAPAS_ORDEN.map((etapa, indice) => {
    const completado = indice < etapaActual;
    const activo = indice === etapaActual;
    const clases = ['stepper-paso', completado ? 'completado' : '', activo ? 'activo' : ''].filter(Boolean).join(' ');
    return `
      <div class="${clases}">
        <span class="stepper-punto">${completado ? icono('check') : (indice + 1)}</span>
        <span class="stepper-texto">${escaparHTML(etapa.etiqueta)}</span>
      </div>`;
  }).join('');
  return `<div class="stepper ${compacto ? 'stepper-compacto' : ''}">${pasos}</div>${aviso}`;
}

/** Nombre de archivo seguro para exportaciones. */
function nombreArchivoSeguro(texto) {
  return String(texto || 'archivo').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function descargarArchivo(nombre, contenido, tipo = 'application/json') {
  try {
    const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (error) {
    mostrarToast('No se pudo generar el archivo para descargar.', 'error');
    return false;
  }
}

async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (error) {
    /* Se intenta el método alternativo. */
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const exito = document.execCommand('copy');
    area.remove();
    return exito;
  } catch (error) {
    return false;
  }
}
