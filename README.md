# Taller Mecánico Demo

Demo web de gestión para un taller automotriz. Incluye **agenda de trabajos**, **órdenes de trabajo con fotos** y un **portal público de consulta** para el cliente.

Está hecha con **HTML, CSS y JavaScript puro**, sin frameworks, sin compilación y sin `npm`. Todos los datos se guardan en el `localStorage` del navegador.

---

## Cómo abrir la demo

La forma recomendada es servir la carpeta con un servidor local. Así funcionan correctamente las fuentes, los enlaces y el almacenamiento del navegador.

### Opción 1: Python

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

En Windows también puede ser:

```bash
py -m http.server 8000
```

Luego abrí:

- Aplicación interna: <http://localhost:8000/index.html>
- Portal del cliente: <http://localhost:8000/consulta.html>

### Opción 2: Live Server de VS Code

1. Abrí la carpeta del proyecto en VS Code.
2. Hacé clic derecho sobre `index.html`.
3. Elegí **Open with Live Server**.

### Importante

Evitá abrir los archivos con `file://` directamente. Algunos navegadores bloquean `localStorage` o el portapapeles en ese modo. Si igual querés probarlo así, usá Chrome o Edge y tené en cuenta esas limitaciones.

No hace falta instalar dependencias ni ejecutar ningún build.

---

## Recorrido rápido

1. Abrí `index.html`. La primera vez se cargan solos los datos de demostración.
2. En **Agenda**, probá las vistas **Mes**, **Semana** y **Día**. Vas a ver dos superposiciones intencionales marcadas como conflictos.
3. En **Órdenes**, abrí la ficha `OT-0001` para ver una orden completa con fotos, servicios y estado.
4. Usá **WhatsApp** para generar el link de consulta y el mensaje para el cliente.
5. Abrí el link generado. El portal abre `consulta.html` con la ficha precargada; ingresá la placa y vas a ver el estado en modo solo lectura.
6. Para volver al estado inicial, usá **Restablecer demo** en el menú lateral.

---

## Módulos

### 1. Agenda

- Vistas de **mes**, **semana** y **día**.
- Mini calendario lateral para navegar entre meses.
- Leyenda de tipos de evento con filtros para mostrar u ocultar cada tipo.
- Contador de conflictos y panel lateral con los eventos superpuestos.
- Creación, edición y eliminación de eventos.
- El modal de evento mantiene siempre visible el botón **Guardar evento**. El cuerpo del formulario se desplaza con la barra lateral o con los botones **↑ / ↓** de la cabecera.
- Detección de superposiciones: si dos eventos se cruzan en el tiempo, se marcan en rojo y se cuentan como un conflicto.
- Al guardar un evento que se superpone, aparece un aviso con dos opciones:
  - **Cambiar horario** para volver al formulario.
  - **Guardar de todos modos** para confirmar la superposición.
- Los eventos pueden vincularse a una orden de trabajo. Al elegir una orden se completan el cliente y la placa.
- Desde una orden se puede usar **Programar en agenda** para crear una entrega estimada.

Tipos de evento disponibles: recepción, entrega, reunión, cita técnica y otro.

### 2. Órdenes de trabajo

- Listado con búsqueda por ficha, cliente, celular, NIT, placa, marca, modelo, año o color.
- Filtro por estado y tarjetas de estadísticas que también funcionan como filtros rápidos.
- Formulario completo con:
  - Datos generales: ficha, fecha, hora, forma de pago y documento.
  - Datos del cliente: nombre o razón social, NIT/CI, dirección, teléfono y celular.
  - Datos del vehículo: marca, modelo, tipo, año, placa, kilometraje, color, batería, número de motor y VIN/chasis.
  - Servicios dinámicos con importe y total automático.
  - Estado del proceso con línea de progreso (stepper).
  - Notas internas.
  - Fotos de recepción.
- Validación de campos obligatorios antes de guardar.
- La placa se guarda en mayúsculas y sin espacios.
- Los importes deben ser números mayores o iguales a cero.
- Las fotos se **redimensionan y comprimen** con `canvas` antes de guardarse: máximo 800 px de lado, JPEG con calidad 0,7 y hasta 8 fotos por orden.
- Galería con miniaturas, descripción por foto, visor ampliado (lightbox) y eliminación.
- Acciones: guardar, editar, eliminar con confirmación, imprimir y compartir por WhatsApp.
- Si el almacenamiento se llena, se muestra un mensaje claro en español.

Estados disponibles: Recibido → Diagnóstico → En proceso → Control de calidad → Terminado → Entregado. El estado **Esperando repuestos** se muestra como un aviso dentro del stepper.

### 3. Link de WhatsApp

Desde una orden guardada, el botón **WhatsApp** abre un modal con:

- Un **resumen seguro** de la orden: ficha, cliente, vehículo, placa, servicios, total, estado y entrega estimada.
- El **link de consulta**, con esta forma:

  ```text
  consulta.html?ficha=OT-0001#d=RESUMEN_CODIFICADO
  ```

- Un **mensaje editable** para el cliente, con su nombre, el taller, el vehículo, la ficha y el link.
- El botón **Enviar por WhatsApp**, que abre `https://wa.me/591NUMERO?text=...`. Si el celular no tiene prefijo de país, se agrega automáticamente `591`.
- El botón **Copiar link**, con confirmación por toast.

El resumen del hash **no incluye fotos, notas internas, número de motor ni VIN**.

#### Cómo funciona el link en la demo

Los datos reales viven en el `localStorage` de un solo navegador. Para que la demo sea convincente:

1. El portal intenta leer primero la orden desde el `localStorage` del taller.
2. Si la ficha existe, valida la placa contra esos datos y muestra la información actualizada, incluidas las fotos.
3. Si la ficha no existe en ese navegador, usa el resumen codificado en el hash como respaldo.
4. En ese caso no se muestran fotos, porque el resumen no las incluye, y se avisa que se está viendo un resumen compartido.

El link con `?ficha=` es estable. El hash es una fotografía del momento en que se compartió y sirve para que el portal funcione en otro navegador. Si la orden se actualiza después, el navegador del taller verá los datos nuevos; un navegador distinto que abra un link viejo verá el resumen de ese momento.

### 4. Portal `consulta.html`

Página pública, sin menú interno y pensada primero para celular.

- Cabecera con logo y nombre del taller.
- Formulario con **N° de ficha** y **placa**. La ficha se precarga si viene en el link.
- Resultado en modo **solo lectura**:
  - Estado actual con stepper.
  - Datos del vehículo: marca, modelo, año, placa, color y kilometraje.
  - Fecha de ingreso y entrega estimada, si hay un evento de entrega vinculado.
  - Servicios, importes y total.
  - Forma de pago y tipo de documento.
  - Galería de fotos de recepción cuando están disponibles.
  - Botón para contactar al taller por WhatsApp.
- **No muestra** notas internas, número de motor ni VIN.
- Si la ficha y la placa no coinciden, muestra un mensaje genérico: **“No encontramos una ficha con esos datos”**. No revela cuál de los dos datos es incorrecto.
- Después de **5 intentos fallidos seguidos**, bloquea el formulario durante **1 minuto** en ese navegador. Al expirar, se habilita de nuevo y se reinicia el contador.

Se aceptan fichas como `OT-0001`, `OT-1`, `OT0001` o `0001`; el portal las normaliza.

---

## Datos y almacenamiento

Todo se guarda en el `localStorage` del navegador, bajo estas claves:

| Clave | Contenido |
| --- | --- |
| `taller_eventos` | Lista de eventos de la agenda. |
| `taller_ordenes` | Lista de órdenes de trabajo, con sus fotos comprimidas. |
| `taller_demo_inicializado` | Marca si los datos de demostración ya se cargaron una vez. |
| `taller_consulta_intentos` | Intentos fallidos y bloqueo temporal del portal. |

Los datos están asociados al **origen** desde el que se abre la demo. Por ejemplo, `http://localhost:8000` y `http://127.0.0.1:8000` son orígenes distintos y no comparten datos. Tampoco se comparten entre navegadores, perfiles o dispositivos.

### Restablecer la demo

En el menú lateral, usá **Restablecer demo**. Pide confirmación, borra las órdenes, los eventos y las fotos guardadas, y vuelve a cargar los ejemplos.

### Exportar e importar

- **Exportar JSON** descarga un archivo con todos los eventos y las órdenes.
- **Importar JSON** reemplaza todos los datos actuales por los del archivo.
- El archivo importado debe incluir las listas `eventos` y `ordenes` con la estructura esperada.
- Si falla la escritura, se intenta restaurar el estado anterior.

### Borrar todo manualmente

Desde las herramientas del navegador:

1. Abrí **Configuración del sitio** o **Aplicación → Almacenamiento**.
2. Borrá los datos de sitio de `localhost:8000`.
3. Recargá la página. La demo se vuelve a sembrar sola.

---

## Datos de demostración

La primera vez se cargan automáticamente:

- **5 órdenes de trabajo** con marcas Toyota, Suzuki, Nissan, Chevrolet y Hyundai, distintos estados, servicios e importes en bolivianos.
- **2 órdenes con fotos de ejemplo** (3 imágenes en total), generadas con `canvas`.
- **10 eventos** distribuidos entre la semana actual y la siguiente, de todos los tipos.
- **2 superposiciones intencionales** para mostrar el resaltado de conflictos:
  - Recepción Toyota Hilux y diagnóstico Nissan Frontier el mismo lunes por la mañana.
  - Recepción Chevrolet Onix y revisión Hyundai Tucson el mismo viernes por la mañana.

Las fechas se generan tomando la semana actual como referencia, así que la demo siempre queda ambientada en el presente.

---

## Personalización

### Datos del taller

Editá el objeto `CONFIG` al comienzo de `js/utilidades.js`:

```js
const CONFIG = {
  nombreTaller: 'Taller Mecánico Demo',
  telefonoWhatsApp: '59170012345',
  telefonoVisible: '+591 700 12345',
  direccion: 'Av. Banzer 3er anillo #123',
  ciudad: 'Santa Cruz de la Sierra - Bolivia',
  email: 'contacto@tallerdemo.bo',
  horario: 'Lun a Vie · 07:00 a 20:00 · Sáb 08:00 a 13:00'
};
```

El nombre, el teléfono, la dirección y el horario se usan en la aplicación, el portal y la hoja de impresión.

### Colores y tipografía

Los colores principales están en `:root` dentro de `css/estilos.css`. La tipografía se carga desde Google Fonts: **Barlow Condensed** para títulos y **Barlow** para texto.

### Estados, tipos de evento y etapas

También en `js/utilidades.js`:

- `ESTADOS_ORDEN`: etiquetas y clases de los estados.
- `TIPOS_EVENTO`: tipos de evento, colores e iconos.
- `ETAPAS_ORDEN` y `ETAPA_POR_ESTADO`: pasos visibles del stepper.
- `FORMAS_PAGO` y `DOCUMENTOS`.

### Datos de ejemplo

`js/datos-demo.js` contiene las órdenes, los eventos y la generación de fotos con `canvas`.

---

## Accesibilidad

- Todos los campos tienen etiquetas asociadas.
- Los modales se abren con foco controlado, se cierran con `Esc` y mantienen el foco dentro mientras están abiertos.
- El visor de fotos permite navegar con las flechas del teclado.
- Hay un enlace **Saltar al contenido principal** al inicio de ambas páginas.
- Los avisos usan `aria-live` y roles adecuados.
- Se respeta `prefers-reduced-motion` en el portal.
- Los colores de estado mantienen contraste sobre fondos claros.

---

## Impresión y PDF

En una orden guardada, el botón **Imprimir** genera una hoja limpia con:

- Datos del taller y número de ficha.
- Datos del cliente.
- Datos del vehículo (incluye motor, VIN y batería, porque es la orden interna).
- Servicios, importes y total.
- Estado, forma de pago y documento.
- Notas internas.
- Fotos de recepción.
- Espacios para la firma del cliente y del taller.

Se abre el diálogo de impresión del navegador. Para guardar como PDF, elegí **Guardar como PDF** o **Microsoft Print to PDF** como impresora.

El portal también tiene estilos de impresión: si usás `Ctrl + P` sobre el resultado, se ocultan el formulario, la cabecera y los botones, y queda solo la ficha consultada.

---

## Limitaciones de la demo

- **Un solo navegador:** los datos viven en `localStorage`. No hay backend, usuarios ni sincronización.
- **Link con resumen en el hash:** permite abrir la ficha en otro navegador, pero es una fotografía del momento. No incluye fotos ni cambios posteriores. Además, cuanto más larga es la orden, más largo es el link.
- **Fotos comprimidas:** se limita el tamaño para no llenar el almacenamiento. Igual puede llenarse si se cargan muchas órdenes con fotos.
- **Bloqueo de intentos del lado del cliente:** es una simulación. Se puede evitar borrando el `localStorage`; en producción debe resolverse en el servidor.
- **WhatsApp:** se usa el enlace público `wa.me`. Si el navegador bloquea ventanas emergentes, hay que habilitarlas o copiar el link manualmente. El número se normaliza con prefijo `591` (Bolivia).
- **Sin QR:** la generación de QR era opcional y se omitió para no agregar dependencias.
- **Fechas y moneda:** se muestran en español de Bolivia, con formato `dd/mm/aaaa`, hora de 24 h y moneda `Bs 1.250,00`. La zona horaria la define el navegador.
- **Sin concurrencia:** si se abre la demo en dos pestañas, la última escritura gana.

---

## Cómo evolucionaría a producción

La estructura está pensada para reemplazar la capa de datos sin reescribir la interfaz.

1. **Backend y base de datos**
   - Reemplazar `js/almacen.js` por llamadas a una API REST o GraphQL.
   - Guardar órdenes, eventos y estados en PostgreSQL o MySQL.

2. **Fotos**
   - Subir las imágenes a un almacenamiento de objetos (S3, Cloudinary, etc.).
   - Guardar solo la URL en la base de datos.
   - Generar miniaturas y optimizar la entrega.

3. **Portal del cliente**
   - Reemplazar el resumen del hash por un token firmado, con vencimiento y permisos limitados.
   - Validar ficha y placa en el servidor.
   - Aplicar rate limiting real y registrar auditoría de accesos.

4. **Usuarios y roles**
   - Autenticación para el personal del taller.
   - Roles de recepción, mecánico y administración.
   - Historial de cambios por usuario.

5. **Tiempo real**
   - WebSockets o polling para que la agenda y el estado se actualicen sin recargar.

6. **Documentos**
   - Generar PDF en el servidor con una plantilla estable.
   - Enviar el PDF por correo o WhatsApp Business API.

7. **Notificaciones**
   - Avisos automáticos al cliente cuando cambia el estado.
   - Recordatorios de entrega y mantenimiento.

---

## Estructura del proyecto

```text
taller/
├── index.html              Aplicación interna: agenda y órdenes.
├── consulta.html           Portal público para el cliente.
├── css/
│   ├── estilos.css         Tema, layout, formularios, modales, toasts y lightbox.
│   ├── agenda.css          Estilos de la agenda.
│   ├── ordenes.css         Estilos del listado, formulario, fotos e impresión.
│   └── consulta.css        Estilos del portal del cliente.
├── js/
│   ├── utilidades.js       Configuración, formatos, iconos, modales, toasts y helpers.
│   ├── almacen.js          Acceso a localStorage, exportación e importación.
│   ├── datos-demo.js       Órdenes, eventos y fotos de demostración.
│   ├── agenda.js           Lógica de la agenda y detección de conflictos.
│   ├── ordenes.js          Lógica de órdenes, servicios, fotos e impresión.
│   ├── whatsapp.js         Link de consulta, resumen y mensaje de WhatsApp.
│   └── consulta.js         Lógica del portal público.
└── README.md
```

---

## Solución de problemas

**No aparecen datos de demostración**
Revisá que el navegador no esté bloqueando `localStorage`. Si ya había datos viejos, usá **Restablecer demo** o borrá los datos del sitio.

**No se guardan las fotos**
Puede que el almacenamiento esté lleno. Eliminá fotos de otras órdenes, exportá un respaldo y restablecé la demo. Las imágenes se comprimen a 800 px y JPEG 0.7, pero aun así ocupan espacio.

**WhatsApp no se abre**
Habilitá las ventanas emergentes para el sitio o usá **Copiar link** y compartilo manualmente.

**El portal dice que no encuentra la ficha**
Verificá la ficha y la placa. Si abriste el link en otro navegador, asegurate de usar el link completo, incluido el hash `#d=...`. En ese modo es normal que no aparezcan fotos.

**El portal quedó bloqueado**
Esperá un minuto. El bloqueo se guarda en `taller_consulta_intentos` y se libera automáticamente.

**Las fuentes se ven distintas**
Google Fonts necesita conexión a internet. Si no está disponible, se usan las fuentes de respaldo del sistema.

---

## Créditos

Proyecto de demostración educativa. No usa frameworks ni librerías de JavaScript. Los iconos son SVG en línea y las fotos de ejemplo se generan con `canvas`.
