# Prompt para Claude Code
## Sistema Demo para Taller Automotriz: Agenda + Órdenes de Trabajo + Consulta de Clientes

---

## CONTEXTO

Construí una **página web demo** para un taller automotriz. Debe tener tres partes:

1. Un **módulo de agenda** con apariencia similar a Google Calendar, para programar la llegada de clientes, la entrega de trabajos y otros eventos.
2. Un **módulo de órdenes de trabajo** con los datos del cliente, el vehículo, los servicios y las fotos de recepción.
3. Un **portal público de consulta** al que el cliente entra desde un link de WhatsApp, e ingresa su número de ficha y su placa para ver el estado de su vehículo.

Es una **demo**: no hay backend ni base de datos. Toda la información se guarda en el **localStorage del navegador**.

---

## STACK TECNOLÓGICO (lo más simple posible)

- **HTML + CSS + JavaScript puro** (sin frameworks, sin build, sin npm). Debe funcionar abriendo `index.html` en el navegador o con un servidor estático simple.
- Se permite cargar librerías por CDN solo si simplifican mucho (por ejemplo, Google Fonts e iconos Lucide o Font Awesome). No usar librerías de calendario: la agenda se programa a mano.
- Persistencia: `localStorage`.
- Idioma de toda la UI y de los comentarios del código: **Español**.
- Moneda: **Bolivianos (Bs)**, con formato `Bs 1.250,00`.
- Zona horaria y formatos de fecha: español de Bolivia (`dd/mm/aaaa`, 24 horas).

---

## ESTRUCTURA DEL PROYECTO

```
taller-demo/
├── index.html          ← Aplicación interna (con menú lateral: Agenda / Órdenes)
├── consulta.html       ← Portal público para el cliente
├── css/
│   ├── estilos.css     ← Estilos generales y tema del taller
│   ├── agenda.css      ← Estilos del calendario
│   └── ordenes.css     ← Estilos de órdenes de trabajo
├── js/
│   ├── almacen.js      ← Funciones de lectura y escritura en localStorage
│   ├── datos-demo.js   ← Datos de ejemplo iniciales
│   ├── utilidades.js   ← Formato de fechas, moneda, ids, imágenes
│   ├── agenda.js       ← Lógica del calendario y detección de superposiciones
│   ├── ordenes.js      ← Lógica de órdenes de trabajo
│   ├── whatsapp.js     ← Generación del link de WhatsApp y del link de consulta
│   └── consulta.js     ← Lógica del portal del cliente
└── README.md           ← Instrucciones en español
```

---

## MODELO DE DATOS (localStorage)

Usar estas claves y estructuras (JSON):

### Clave `taller_eventos`
```json
{
  "id": "EV-0001",
  "titulo": "Recepción Toyota Hilux - Juan Pérez",
  "tipo": "recepcion",
  "fecha_inicio": "2026-10-28T09:00",
  "fecha_fin": "2026-10-28T10:00",
  "cliente": "Juan Pérez",
  "placa": "2345ABC",
  "id_orden": "OT-0001",
  "notas": ""
}
```
Tipos de evento (cada uno con su color e ícono propio):
| Tipo | Color sugerido | Uso |
|---|---|---|
| `recepcion` | Azul | Llegada del cliente para ser atendido |
| `entrega` | Verde | Entrega del vehículo terminado |
| `reunion` | Morado | Reunión con proveedor o cliente |
| `cita_tecnica` | Naranja | Diagnóstico o revisión programada |
| `otro` | Gris | Otros eventos |

### Clave `taller_ordenes`
```json
{
  "numero_ficha": "OT-0001",
  "fecha": "2026-10-26",
  "hora": "14:30",
  "forma_pago": "contado",
  "documento": "factura",
  "cliente": {
    "nombre_razon_social": "Juan Pérez Mamani",
    "nit": "1234567012",
    "direccion": "Av. Banzer 3er anillo #123",
    "telefono": "3-3456789",
    "celular": "70012345"
  },
  "vehiculo": {
    "marca": "Toyota",
    "modelo": "Hilux",
    "tipo": "Camioneta",
    "anio": 2018,
    "placa": "2345ABC",
    "kilometraje": 85400,
    "color": "Blanco",
    "nro_motor": "1GD1234567",
    "vin_chasis": "MR0FB3CD500123456",
    "bateria": "Bosch 100Ah, estado regular"
  },
  "servicios": [
    { "nombre": "Cambio de aceite y filtro", "importe": 350.00 },
    { "nombre": "Alineación y balanceo", "importe": 200.00 }
  ],
  "total": 550.00,
  "estado": "en_proceso",
  "notas": "",
  "fotos": [
    { "id": "f1", "descripcion": "Frente", "data": "data:image/jpeg;base64,..." }
  ],
  "creado_en": "2026-10-26T14:30",
  "actualizado_en": "2026-10-26T14:30"
}
```

Valores permitidos:
- `forma_pago`: `contado`, `credito`
- `documento`: `factura`, `nota`
- `estado`: `recibido`, `diagnostico`, `en_proceso`, `esperando_repuestos`, `control_calidad`, `terminado`, `entregado`

El `numero_ficha` se genera automáticamente y es correlativo (`OT-0001`, `OT-0002`, ...). El `total` siempre se calcula como la suma de los importes de los servicios.

---

## MÓDULO 1: AGENDA (estilo Google Calendar)

Imitar la apariencia y el comportamiento de Google Calendar:

**Encabezado**
- Botón "Hoy", flechas anterior/siguiente, título del período (ej: "octubre de 2026").
- Selector de vista: **Mes / Semana / Día**.
- Botón "+ Crear evento" bien visible.

**Vista Mes**
- Cuadrícula de 7 columnas (lunes a domingo), con el día actual resaltado con un círculo.
- Cada día muestra los eventos como "píldoras" de color, con la hora y el título. Si hay más de 3, mostrar "+N más".

**Vista Semana y Día**
- Grilla horaria de 7:00 a 20:00, con líneas por hora y una línea roja indicando la hora actual.
- Los eventos aparecen como bloques posicionados según su hora de inicio y duración, con el color de su tipo.
- Si dos eventos se superponen, mostrarlos lado a lado (como hace Google Calendar).

**Crear y editar eventos**
- Al hacer clic en un espacio vacío, abrir un modal con la fecha y hora precargadas.
- Campos: título, tipo (con selector de color), fecha, hora inicio, hora fin, cliente, placa, orden de trabajo vinculada (opcional, lista desplegable) y notas.
- Al hacer clic en un evento existente: ver detalle, editar o eliminar (con confirmación).

**Detección y resalte de superposiciones (requisito clave)**
- Cuando dos o más eventos se superponen en el tiempo, deben quedar **resaltados visualmente**: borde rojo, ícono de advertencia ⚠️ y, opcionalmente, un fondo rayado.
- Al intentar guardar un evento que se superpone con otro, mostrar un aviso con la lista de eventos en conflicto y permitir elegir entre "Guardar de todos modos" o "Cambiar horario".
- Mostrar un contador "⚠️ N conflictos" en el encabezado, que al hacer clic lista los conflictos.

**Diferenciación visual de eventos**
- Cada tipo de evento tiene su color y su ícono.
- Incluir una **leyenda** con los tipos de evento en el panel lateral izquierdo, con casillas para mostrar u ocultar cada tipo.
- Mini calendario mensual en el panel lateral para navegar rápido.

---

## MÓDULO 2: ORDEN DE TRABAJO

**Listado de órdenes**
- Tabla con: N° de ficha, fecha, cliente, placa, vehículo, total, estado (badge de color).
- Buscador (por ficha, cliente o placa) y filtro por estado.
- Botón "+ Nueva orden de trabajo".

**Formulario de orden (organizado en secciones/tarjetas)**

1. **Datos generales:** N° de ficha (automático, solo lectura), fecha y hora (por defecto la actual, editables), forma de pago (contado / crédito), documento (factura / nota).
2. **Datos del cliente:** nombre y apellido o razón social, NIT, dirección, teléfono, celular.
3. **Datos del vehículo:** marca, modelo, tipo, año, placa, kilometraje, color, N° de motor, VIN/chasis, batería.
4. **Servicios a realizar:**
   - Tabla dinámica con columnas "Nombre del servicio" e "Importe (Bs)", con botón para agregar y quitar filas.
   - **Total general** calculado automáticamente y visible en grande al pie.
5. **Estado del proceso:** selector de estado, mostrado también como una **línea de progreso** (stepper) con las etapas: Recibido → Diagnóstico → En proceso → Control de calidad → Terminado → Entregado.
6. **Fotos de recepción del vehículo:**
   - Botón para cargar una o varias imágenes (con vista previa inmediata, también desde cámara en móvil con `capture`).
   - Cada foto admite una descripción corta (ej: "Parachoques delantero con rayón").
   - **Redimensionar y comprimir** las imágenes con `canvas` antes de guardarlas (máximo 800 px de lado, JPEG calidad 0.7) para no saturar el localStorage.
   - Galería con miniaturas; al hacer clic se abre un visor ampliado (lightbox) con navegación entre fotos.
   - Opción de eliminar fotos.
   - Controlar el límite de almacenamiento: si el localStorage se llena, mostrar un mensaje claro en español.
7. **Notas** internas (textarea).

**Acciones sobre la orden**
- Guardar, editar y eliminar (con confirmación).
- **Imprimir / exportar a PDF** la orden (usando `window.print()` con una hoja de estilos de impresión limpia, con logo y datos del taller).
- Botón **"Programar en agenda"**, que crea un evento de entrega vinculado a la orden.
- Botón **"Compartir por WhatsApp"** (ver módulo 3).

**Validaciones**
- Obligatorios: nombre/razón social, celular, marca, modelo, placa y al menos un servicio.
- La placa se guarda en mayúsculas y sin espacios.
- Los importes deben ser números mayores o iguales a 0.

---

## MÓDULO 3: LINK DE WHATSAPP Y PORTAL DEL CLIENTE

### Generación del link
En cada orden, el botón "Compartir por WhatsApp" abre un modal con:
- El **link de consulta**: `consulta.html?ficha=OT-0001`, construido con la URL base actual.
- Un mensaje predefinido, editable, por ejemplo:
  > Hola Juan, te saludamos de *[Nombre del Taller]*. Puedes ver el estado de tu vehículo ingresando al siguiente link con tu N° de ficha *OT-0001* y tu placa: [link]
- Un botón **"Enviar por WhatsApp"** que abre `https://wa.me/591NUMERO?text=MENSAJE_CODIFICADO`, usando el celular del cliente (agregar el prefijo +591 si no lo tiene).
- Un botón **"Copiar link"** al portapapeles, con aviso de confirmación.
- Un **código QR** opcional del link (si se puede generar sin complicar el proyecto).

El link es **estático**: no cambia aunque el estado de la orden se actualice. Lo que cambia es lo que el portal muestra al consultarse.

### Limitación de la demo y cómo resolverla
Como los datos viven en el localStorage de **un solo navegador**, un cliente abriendo el link desde su celular no vería nada. Para que la demo sea convincente, implementar esto:
- Al generar el link, incluir en el hash de la URL un **resumen codificado en base64** de la orden (sin las fotos): ficha, placa, cliente, vehículo, servicios, total, estado y fecha de actualización. Ejemplo: `consulta.html?ficha=OT-0001#d=eyJmaWNoYSI6...`.
- El portal intenta leer primero el localStorage; si no encuentra la orden, usa los datos del hash.
- Explicar en el README que, en una versión real, esto se reemplazaría por un backend y una base de datos.

### Portal `consulta.html`
Página pública, sin menú interno, **optimizada para celular**:
- Cabecera con logo y nombre del taller.
- Formulario con dos campos: **N° de ficha** (precargado si viene en el link) y **placa**.
- Al validar ambos datos, mostrar la ficha en modo **solo lectura**:
  - Estado actual con la línea de progreso (stepper) bien visible.
  - Datos del vehículo (marca, modelo, año, placa, color, kilometraje).
  - Fecha de ingreso y fecha estimada de entrega (si existe un evento de entrega vinculado).
  - Lista de servicios con sus importes y el **total**.
  - Forma de pago y tipo de documento.
  - Galería de fotos de recepción (si están disponibles).
  - Botón para contactar al taller por WhatsApp.
- **No mostrar** datos sensibles internos (notas internas, N° de motor, VIN).
- Si el N° de ficha y la placa no coinciden, mostrar "No encontramos una ficha con esos datos" sin revelar cuál de los dos es incorrecto.
- Limitar a 5 intentos fallidos seguidos, con bloqueo temporal de 1 minuto (en el navegador).

---

## DISEÑO Y APARIENCIA

**Estilo:** profesional, robusto e industrial, apropiado para un taller automotriz, pero limpio y moderno.

- **Paleta:** gris carbón (#1F2937) y negro suave como base, **naranja** (#F97316) o amarillo seguridad (#FACC15) como color de acento, blanco y gris claro (#F3F4F6) para fondos. Colores de estado: verde, amarillo, rojo y azul.
- **Tipografía:** Google Fonts. Para títulos usar una tipografía fuerte y condensada tipo "Barlow Condensed" o "Oswald", y para texto "Barlow" o "Roboto". No usar Arial.
- **Elementos:** menú lateral oscuro con íconos, tarjetas con bordes suaves y sombras discretas, botones con efecto hover, íconos de herramientas (llave, engranaje, auto).
- Logo de ejemplo del taller creado con SVG o emoji (🔧), con el nombre "Taller Mecánico Demo" editable desde una constante en `utilidades.js`.
- **Responsive**: la aplicación interna debe funcionar bien en computadora y tablet, y el portal del cliente debe estar pensado primero para celular.
- Estilos de impresión para la orden de trabajo.
- Animaciones sutiles (transiciones al abrir modales y al cambiar de vista).

---

## DATOS DE DEMOSTRACIÓN

Al abrir la app por primera vez (localStorage vacío), cargar automáticamente datos de ejemplo realistas:
- **5 órdenes de trabajo** con distintos estados, marcas (Toyota, Suzuki, Nissan, Chevrolet, Hyundai), servicios e importes en Bs, y 1 o 2 con fotos de ejemplo (pueden ser imágenes generadas con canvas o placeholders).
- **10 eventos en la agenda** distribuidos en la semana actual y la siguiente, de todos los tipos, incluyendo **al menos 2 superposiciones** para mostrar el resalte de conflictos.
- Botón en el menú "Restablecer datos de demo" (con confirmación) que borra y recarga los ejemplos.
- Botón para **exportar/importar** todos los datos como archivo JSON (útil para llevar la demo a otro navegador).

---

## REQUISITOS NO FUNCIONALES

1. **Sin errores en consola** al cargar ni al usar cualquier función.
2. **Manejo de errores:** `try/catch` al leer y escribir en localStorage y al procesar imágenes, con mensajes claros en español (por ejemplo, cuando el almacenamiento está lleno).
3. **Validación** de todos los formularios antes de guardar.
4. **Notificaciones tipo toast** propias (sin librerías) para confirmar acciones y mostrar errores.
5. **Accesibilidad básica:** etiquetas en los inputs, contraste suficiente, navegación con teclado en los modales (Esc para cerrar).
6. **Código comentado en español**, con funciones pequeñas y nombres claros.
7. **Todo el texto visible en español**, con fechas formateadas en español (ej: "lunes 26 de octubre de 2026, 14:30").
8. Código **modular** y fácil de entender, pensado para que luego se pueda reemplazar `almacen.js` por llamadas a un backend real.

---

## INSTRUCCIONES FINALES

1. Creá TODO el proyecto desde cero con la estructura definida.
2. Asegurate de que `index.html` y `consulta.html` funcionen sin errores al abrirlos, y que los datos de demo se carguen solos.
3. Probá el flujo completo: crear una orden con fotos → generar el link de WhatsApp → abrir `consulta.html` → ingresar ficha y placa → ver el estado. También probá crear dos eventos superpuestos y verificar que se resalten.
4. Incluí un `README.md` en español con:
   - Cómo abrir o ejecutar la demo (por ejemplo, `python -m http.server` o la extensión Live Server).
   - Cómo usar cada módulo.
   - Dónde se guardan los datos y cómo restablecerlos.
   - Limitaciones de la demo (localStorage, link con datos en el hash, tamaño de las fotos) y cómo evolucionaría a una versión real con backend.
5. No uses TypeScript ni frameworks: **JavaScript puro**.
