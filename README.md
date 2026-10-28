# Taller Mecánico Demo

Demo web de gestión para un taller automotriz. Incluye **agenda de trabajos**, **órdenes de trabajo con fotos**, **clientes y vehículos**, **historial de servicios**, **recordatorios de mantenimiento**, **estadísticas** y un **portal público de consulta** para el cliente.

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
3. En **Órdenes**, abrí la ficha `OT-0001` para ver una orden completa con fotos, servicios, mecánico, repuestos y seguimiento.
4. En **Clientes**, abrí la ficha de Juan Pérez Mamani y después el carnet de la Hilux `2345ABC`: vas a ver la línea de tiempo, el gráfico de kilometraje y el estado de mantenimiento.
5. En **Historial**, revisá las estadísticas, probá los filtros y exportá el CSV.
6. En **Recordatorios**, usá **WhatsApp**, **Agendar cita** o **Marcar contactado** sobre un servicio vencido.
7. Usá **WhatsApp** desde una orden para generar el link de consulta y el mensaje para el cliente.
8. Abrí el link generado. El portal abre `consulta.html` con la ficha precargada; ingresá la placa y vas a ver el estado y el **Historial de mi vehículo** en modo solo lectura.
9. Para volver al estado inicial, usá **Restablecer demo** en el menú lateral.

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
- Desde la ficha de un cliente o de un vehículo, **Agendar cita** abre el modal con cliente, placa y notas ya cargados.
- En el detalle de un evento vinculado a un vehículo se muestra el enlace **Ver historial del vehículo**.

Tipos de evento disponibles: recepción, entrega, reunión, cita técnica y otro.

### 2. Órdenes de trabajo

- Listado con búsqueda por ficha, cliente, celular, NIT, placa, marca, modelo, año o color.
- Filtro por estado y tarjetas de estadísticas que también funcionan como filtros rápidos.
- Formulario completo con:
  - Datos generales: ficha, fecha, hora, forma de pago y documento.
  - Datos del cliente: nombre o razón social, NIT/CI, dirección, teléfono y celular.
  - Datos del vehículo: marca, modelo, tipo, año, placa, kilometraje, color, batería, número de motor y VIN/chasis.
  - Servicios dinámicos con importe y total automático.
  - **Trabajo y seguimiento:** mecánico, categoría, garantía (días y km), próximo servicio (fecha, km y descripción), repuestos utilizados y recomendaciones con urgencia.
  - Estado del proceso con línea de progreso (stepper).
  - Notas internas.
  - Fotos de recepción.
- **Autocompletado de clientes y vehículos:** al escribir el nombre, NIT, celular o placa aparece un panel con sugerencias. Al elegir un cliente con un solo vehículo se completa solo; si tiene varios, se pide elegir la placa.
- **Alta automática:** si el cliente o el vehículo no existen, se crean al guardar la orden.
- **Duplicados:** se avisa si el NIT o el celular ya pertenecen a otro cliente. Si la placa ya existe con otro dueño, se pide confirmación y se reasigna el vehículo existente.
- **Kilometraje:** si el nuevo valor es menor al registrado, se avisa pero se guarda el mayor para que el vehículo nunca retroceda.
- **Vehículo conocido:** un aviso muestra las últimas visitas y permite abrir un historial rápido sin perder el formulario.
- **Recomendaciones pendientes:** se pueden agregar a la orden como servicios de importe cero y quedan marcadas como atendidas.
- Validación de campos obligatorios antes de guardar.
- La placa se guarda en mayúsculas y sin espacios.
- Los importes deben ser números mayores o iguales a cero.
- Las fotos se **redimensionan y comprimen** con `canvas` antes de guardarse: máximo 800 px de lado, JPEG con calidad 0,7 y hasta 8 fotos por orden.
- Galería con miniaturas, descripción por foto, visor ampliado (lightbox) y eliminación.
- Acciones: guardar, editar, eliminar con confirmación, imprimir y compartir por WhatsApp.
- Si el almacenamiento se llena, se muestra un mensaje claro en español.

Estados disponibles: Recibido → Diagnóstico → En proceso → Control de calidad → Terminado → Entregado. El estado **Esperando repuestos** se muestra como un aviso dentro del stepper.

### 3. Clientes y vehículos

- Listado de **clientes** y de **vehículos** con un selector para cambiar de vista.
- Búsqueda por nombre, NIT, celular, placa, marca o modelo.
- Ordenamiento por columnas y etiquetas automáticas:
  - **Frecuente:** 3 visitas o más.
  - **Nuevo:** 1 visita.
  - **Sin visitas:** todavía no tiene trabajos entregados.
  - **Inactivo:** pasó más de un año desde la última visita.
- Resumen superior con clientes, vehículos, visitas e ingresos históricos.
- Ficha de cliente con:
  - Datos de contacto y notas.
  - Indicadores de visitas, total gastado, ticket promedio y primera visita.
  - Tarjetas de sus vehículos con último servicio y kilometraje.
  - Línea de tiempo de visitas, con servicios, repuestos, garantía, próximo servicio y recomendaciones.
  - Acciones: editar, agendar cita, WhatsApp, nueva orden y eliminar.
- Ficha de vehículo (carnet de servicio) con:
  - Datos técnicos y dueño actual.
  - Gráfico SVG de evolución del kilometraje.
  - Estado de mantenimiento: vencido, próximo o al día.
  - Garantías vigentes y recomendaciones pendientes.
  - Línea de tiempo completa y botón **Imprimir historial**.
- La línea de tiempo muestra 10 visitas y permite cargar más de a 10.
- No se puede eliminar un cliente o un vehículo si tiene órdenes o historial asociado.

### 4. Historial de servicios

- Vista **Historial** con todas las visitas entregadas.
- Filtros por texto (placa, cliente o ficha), rango de fechas, marca, modelo, categoría, mecánico, forma de pago y servicio específico.
- Tabla con fecha, ficha, cliente, vehículo, categoría, mecánico, servicios, pago y total.
- Totales de trabajos e ingresos del resultado filtrado.
- Paginación de **20 registros por página**.
- Exportación a **CSV** con BOM UTF-8, separador `;` y celdas entre comillas. El archivo se llama `historial-taller-AAAA-MM-DD.csv`.
- Cada registro del historial es una **copia fija** de la visita: aunque la orden original se edite después, el historial no cambia.
- Las fotos **no se duplican**: el historial guarda la referencia a la orden original y abre sus fotos desde ahí.
- El historial se actualiza solo cuando una orden pasa a **Entregado**.

### 5. Recordatorios de mantenimiento

- Sección **Recordatorios** con cuatro bloques:
  - **Vencidos:** próximo servicio pasado por fecha o por kilometraje.
  - **Próximos 30 días:** servicios que vencen por fecha o a los que les faltan 500 km o menos.
  - **Garantías por vencer:** trabajos con garantía que vence en los próximos 30 días.
  - **Recomendaciones pendientes:** observaciones cargadas en las visitas que todavía no se atendieron.
- Cada recordatorio muestra cliente, vehículo, placa, motivo y detalle.
- Acciones por recordatorio:
  - **WhatsApp:** abre un modal con el mensaje editable y el enlace `wa.me`.
  - **Agendar cita:** abre la agenda con cliente, placa y notas precargados.
  - **Marcar contactado:** guarda la fecha del último contacto para no insistir a diario. El estado se conserva en `taller_recordatorios`.

### 6. Estadísticas

Panel superior de la vista **Historial**, sin librerías externas:

- **Trabajos del mes actual** comparados con el mes anterior.
- **Ingresos del mes actual** comparados con el mes anterior.
- **Clientes nuevos:** primera visita registrada en el mes.
- **Clientes recurrentes:** clientes atendidos que ya tenían visitas anteriores.
- **Top 5 de servicios más frecuentes** con barras proporcionales.
- **Top 5 de marcas más atendidas**.
- **Ingresos por forma de pago:** contado vs. crédito, con importe, cantidad y porcentaje.

Las estadísticas se recalculan al entrar a la vista y cuando se guarda una orden entregada.

### 7. Link de WhatsApp

Desde una orden guardada, el botón **WhatsApp** abre un modal con:

- Un **resumen seguro** de la orden: ficha, cliente, vehículo, placa, servicios, total, estado y entrega estimada.
- Hasta las **últimas 5 visitas** del vehículo (fecha, kilometraje, servicios, total, garantía y próximo servicio).
- El **link de consulta**, con esta forma:

  ```text
  consulta.html?ficha=OT-0001#d=RESUMEN_CODIFICADO
  ```

- Un **mensaje editable** para el cliente, con su nombre, el taller, el vehículo, la ficha y el link.
- El botón **Enviar por WhatsApp**, que abre `https://wa.me/591NUMERO?text=...`. Si el celular no tiene prefijo de país, se agrega automáticamente `591`.
- El botón **Copiar link**, con confirmación por toast.

El resumen del hash **no incluye fotos, notas internas, número de motor ni VIN**. El historial incluido también excluye esos datos.

#### Cómo funciona el link en la demo

Los datos reales viven en el `localStorage` de un solo navegador. Para que la demo sea convincente:

1. El portal intenta leer primero la orden desde el `localStorage` del taller.
2. Si la ficha existe, valida la placa contra esos datos y muestra la información actualizada, incluidas las fotos y el historial completo del vehículo.
3. Si la ficha no existe en ese navegador, usa el resumen codificado en el hash como respaldo.
4. En ese caso no se muestran fotos, porque el resumen no las incluye, y se avisa que se está viendo un resumen compartido. El historial se limita a las visitas incluidas en el hash.

El link con `?ficha=` es estable. El hash es una fotografía del momento en que se compartió y sirve para que el portal funcione en otro navegador. Si la orden se actualiza después, el navegador del taller verá los datos nuevos; un navegador distinto que abra un link viejo verá el resumen de ese momento.

### 8. Portal `consulta.html`

Página pública, sin menú interno y pensada primero para celular.

- Cabecera con logo y nombre del taller.
- Formulario con **N° de ficha** y **placa**. La ficha se precarga si viene en el link.
- Resultado en modo **solo lectura**:
  - Estado actual con stepper.
  - Datos del vehículo: marca, modelo, año, placa, color y kilometraje.
  - Fecha de ingreso y entrega estimada, si hay un evento de entrega vinculado.
  - Servicios, importes y total.
  - Forma de pago y tipo de documento.
  - **Historial de mi vehículo:** próximo mantenimiento, garantías vigentes y visitas entregadas con fecha, kilometraje, servicios y total. Muestra 10 visitas y permite **Ver más**.
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
| `taller_clientes` | Clientes con datos de contacto y facturación. |
| `taller_vehiculos` | Vehículos con kilometraje actual y dueño. |
| `taller_historial` | Copia fija de cada visita entregada. |
| `taller_catalogo` | Catálogo de servicios con importes sugeridos. |
| `taller_recordatorios` | Fechas de último contacto de los recordatorios. |
| `taller_demo_inicializado` | Marca si los datos de demostración ya se cargaron una vez. |
| `taller_consulta_intentos` | Intentos fallidos y bloqueo temporal del portal. |

Los datos están asociados al **origen** desde el que se abre la demo. Por ejemplo, `http://localhost:8000` y `http://127.0.0.1:8000` son orígenes distintos y no comparten datos. Tampoco se comparten entre navegadores, perfiles o dispositivos.

### Migración automática

Al iniciar, la aplicación revisa los datos existentes y:

- Crea clientes y vehículos que falten a partir de las órdenes viejas.
- Vincula cada orden con `id_cliente` e `id_vehiculo`.
- Actualiza el kilometraje de los vehículos.
- Carga el catálogo de servicios si está vacío.
- Genera registros de historial para las órdenes ya entregadas que no lo tengan.

La migración no borra datos y se puede ejecutar más de una vez sin duplicar registros.

### Restablecer la demo

En el menú lateral, usá **Restablecer demo**. Pide confirmación, borra las órdenes, los eventos, los clientes, los vehículos, el historial, el catálogo, las fotos y los contactos guardados, y vuelve a cargar los ejemplos.

### Exportar e importar

- **Exportar JSON** descarga un archivo con **eventos, órdenes, clientes, vehículos, historial, catálogo y recordatorios**.
- El archivo incluye `version: 2` y la fecha de exportación.
- **Importar JSON** reemplaza todos los datos actuales por los del archivo.
- El archivo importado debe incluir las listas `eventos` y `ordenes`. Las listas `clientes`, `vehiculos`, `historial` y `catalogo`, y el objeto `recordatorios`, son opcionales.
- Si falla la escritura, se intenta restaurar el estado anterior.

### Borrar todo manualmente

Desde las herramientas del navegador:

1. Abrí **Configuración del sitio** o **Aplicación → Almacenamiento**.
2. Borrá los datos de sitio de `localhost:8000`.
3. Recargá la página. La demo se vuelve a sembrar sola.

---

## Datos de demostración

La primera vez se cargan automáticamente:

- **8 clientes** con datos de contacto, NIT y notas.
- **10 vehículos** de marcas Toyota, Suzuki, Nissan, Chevrolet, Hyundai, Honda, Kia y Ford.
- **25 órdenes de trabajo**:
  - 5 órdenes en curso con estados recibido, en proceso, esperando repuestos, control de calidad y terminado.
  - 20 órdenes históricas ya entregadas (`OT-0006` a `OT-0025`).
- **20 registros de historial** distribuidos en 18 meses (mayo 2025 a octubre 2026).
- **15 servicios** en el catálogo, con importes sugeridos.
- **3 mecánicos:** Carlos Mamani, Miguel Flores y Jorge Salazar.
- **4 fotos de ejemplo** en 3 órdenes, generadas con `canvas`.
- **10 eventos** distribuidos entre la semana actual y la siguiente, de todos los tipos.
- **2 superposiciones intencionales** para mostrar el resaltado de conflictos:
  - Recepción Toyota Hilux y diagnóstico Nissan Frontier el mismo lunes por la mañana.
  - Recepción Chevrolet Onix y revisión Hyundai Tucson el mismo viernes por la mañana.
- **Recordatorios de ejemplo:**
  - 2 servicios vencidos: Hilux por fecha y Frontier por kilometraje.
  - 1 servicio próximo: Corolla en 20 días.
  - 2 garantías por vencer: Tucson y Hiace.
  - 3 recomendaciones pendientes: Hilux, Tucson y Kia Rio.

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

### Estados, tipos de evento, etapas y catálogos

También en `js/utilidades.js`:

- `ESTADOS_ORDEN`: etiquetas y clases de los estados.
- `TIPOS_EVENTO`: tipos de evento, colores e iconos.
- `ETAPAS_ORDEN` y `ETAPA_POR_ESTADO`: pasos visibles del stepper.
- `FORMAS_PAGO` y `DOCUMENTOS`.
- `MECANICOS`: lista sugerida para el campo mecánico.
- `CATEGORIAS_TRABAJO`: categorías de trabajo.
- `URGENCIAS_RECOMENDACION`: niveles de urgencia de las recomendaciones.

El catálogo de servicios se puede editar desde la aplicación al guardar una orden con un servicio nuevo, o directamente en `taller_catalogo`.

### Datos de ejemplo

`js/datos-demo.js` contiene los clientes, vehículos, órdenes, historial, catálogo, eventos y la generación de fotos con `canvas`.

---

## Accesibilidad

- Todos los campos tienen etiquetas asociadas.
- Los modales se abren con foco controlado, se cierran con `Esc` y mantienen el foco dentro mientras están abiertos.
- El visor de fotos permite navegar con las flechas del teclado.
- Hay un enlace **Saltar al contenido principal** al inicio de ambas páginas.
- Los avisos usan `aria-live` y roles adecuados.
- Las tablas tienen encabezados con `scope="col"` y etiquetas visibles en la vista móvil.
- Los gráficos de barras incluyen texto alternativo y los valores siempre están escritos al lado.
- Se respeta `prefers-reduced-motion` en el portal.
- Los colores de estado mantienen contraste sobre fondos claros.
- El texto secundario usa tonos con contraste **WCAG AA** (4.5:1 o más) sobre fondos blancos y grises. Las variables `--texto-suave`, `--gris-400` y `--naranja-oscuro` se ajustaron para cumplirlo.
- Los botones del calendario y las píldoras de evento tienen un área táctil mínima de **24 × 24 px**.
- Lighthouse da **100** en accesibilidad, buenas prácticas y SEO en la aplicación y en el portal.

---

## Impresión y PDF

En una orden guardada, el botón **Imprimir** genera una hoja limpia con:

- Datos del taller y número de ficha.
- Datos del cliente.
- Datos del vehículo (incluye motor, VIN y batería, porque es la orden interna).
- Servicios, importes y total.
- **Repuestos utilizados**.
- **Trabajo y seguimiento:** mecánico, categoría, garantía, próximo servicio y recomendaciones.
- Estado, forma de pago y documento.
- Notas internas.
- Fotos de recepción.
- Espacios para la firma del cliente y del taller.

El carnet de un vehículo tiene su propia hoja **Imprimir historial**, con datos del vehículo, propietario e historial de servicios.

Se abre el diálogo de impresión del navegador. Para guardar como PDF, elegí **Guardar como PDF** o **Microsoft Print to PDF** como impresora.

El portal también tiene estilos de impresión: si usás `Ctrl + P` sobre el resultado, se ocultan el formulario, la cabecera y los botones, y queda solo la ficha consultada, incluido el historial del vehículo.

---

## Limitaciones de la demo

- **Un solo navegador:** los datos viven en `localStorage`. No hay backend, usuarios ni sincronización.
- **Link con resumen en el hash:** permite abrir la ficha en otro navegador, pero es una fotografía del momento. No incluye fotos ni cambios posteriores, y el historial se limita a las últimas 5 visitas. Además, cuanto más larga es la orden, más largo es el link.
- **Fotos comprimidas:** se limita el tamaño para no llenar el almacenamiento. Igual puede llenarse si se cargan muchas órdenes con fotos.
- **Historial como copia fija:** si se corrige una orden ya entregada, el historial conserva los datos originales. Es intencional para que el carnet no cambie retroactivamente.
- **Bloqueo de intentos del lado del cliente:** es una simulación. Se puede evitar borrando el `localStorage`; en producción debe resolverse en el servidor.
- **WhatsApp:** se usa el enlace público `wa.me`. Si el navegador bloquea ventanas emergentes, hay que habilitarlas o copiar el link manualmente. El número se normaliza con prefijo `591` (Bolivia).
- **Sin QR:** la generación de QR era opcional y se omitió para no agregar dependencias.
- **Fechas y moneda:** se muestran en español de Bolivia, con formato `dd/mm/aaaa`, hora de 24 h y moneda `Bs 1.250,00`. La zona horaria la define el navegador.
- **Sin concurrencia:** si se abre la demo en dos pestañas, la última escritura gana.
- **Rendimiento:** el historial pagina de a 20 registros y las líneas de tiempo de a 10 para mantenerse fluido con cientos de visitas.

---

## Cómo evolucionaría a producción

La estructura está pensada para reemplazar la capa de datos sin reescribir la interfaz.

1. **Backend y base de datos**
   - Reemplazar `js/almacen.js` por llamadas a una API REST o GraphQL.
   - Guardar órdenes, eventos, clientes, vehículos e historial en PostgreSQL o MySQL.
   - Mantener el historial como tabla de solo inserción o con auditoría.

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
   - Recordatorios de entrega y mantenimiento por correo o WhatsApp.

8. **Estadísticas**
   - Mover los cálculos a consultas agregadas en la base de datos.
   - Agregar series mensuales, rentabilidad por servicio y productividad por mecánico.

---

## Estructura del proyecto

```text
taller/
├── index.html              Aplicación interna: agenda, órdenes, clientes, historial y recordatorios.
├── consulta.html           Portal público para el cliente.
├── css/
│   ├── estilos.css         Tema, layout, formularios, modales, toasts y lightbox.
│   ├── agenda.css          Estilos de la agenda.
│   ├── ordenes.css         Estilos del listado, formulario, fotos e impresión.
│   ├── historial.css       Clientes, vehículos, historial, estadísticas y recordatorios.
│   └── consulta.css        Estilos del portal del cliente.
├── js/
│   ├── utilidades.js       Configuración, formatos, iconos, modales, toasts y helpers.
│   ├── almacen.js          localStorage, migración, historial, exportación e importación.
│   ├── datos-demo.js       Clientes, vehículos, órdenes, historial, catálogo y fotos de demostración.
│   ├── historial.js        Línea de tiempo, carnet, gráfico, historial general, CSV y estadísticas.
│   ├── recordatorios.js    Recordatorios, WhatsApp, agenda y contacto.
│   ├── clientes.js         Listados, fichas y CRUD de clientes y vehículos.
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

**El historial no muestra una orden entregada**
Verificá que la orden haya pasado a **Entregado** y que se haya guardado. Al guardar se crea o actualiza el registro del historial. Si la orden se editó antes de esta versión, la migración automática genera el registro faltante al recargar.

**El vehículo muestra un kilometraje menor al esperado**
El sistema nunca guarda un kilometraje menor al anterior. Si se ingresó un valor más bajo, se avisó y se conservó el mayor.

**WhatsApp no se abre**
Habilitá las ventanas emergentes para el sitio o usá **Copiar link** y compartilo manualmente.

**El portal dice que no encuentra la ficha**
Verificá la ficha y la placa. Si abriste el link en otro navegador, asegurate de usar el link completo, incluido el hash `#d=...`. En ese modo es normal que no aparezcan fotos y que el historial se limite a las últimas 5 visitas.

**El portal quedó bloqueado**
Esperá un minuto. El bloqueo se guarda en `taller_consulta_intentos` y se libera automáticamente.

**Las fuentes se ven distintas**
Google Fonts necesita conexión a internet. Si no está disponible, se usan las fuentes de respaldo del sistema.

---

## Créditos

Proyecto de demostración educativa. No usa frameworks ni librerías de JavaScript. Los iconos son SVG en línea y las fotos de ejemplo se generan con `canvas`.
