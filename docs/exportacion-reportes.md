# Exportación de reportes de bugs

En `/dashboard/reports`, **Exportar** permite descargar Excel, PDF o CSV con
los resultados de los filtros activos. Está disponible para ADMIN, TESTER y
CLIENT, y se deshabilita cuando el listado está cargando, tiene un error o no
contiene resultados. No modifica el formulario de creación.

## API y autorización

`GET /api/reports/export/?file_format=csv|pdf|xlsx&q=texto&date=YYYY-MM-DD`

Requiere la cookie JWT habitual. Comparte `authorized_reports` con el listado:
ADMIN consulta todos los reportes; los demás usuarios solo los relacionados con
sus postulaciones como tester o con proyectos de su propiedad. La consulta
combina relaciones de PostgreSQL con la colección `reports` de MongoDB. No se
aceptan parámetros adicionales ni repetidos, incluyendo identificadores de
usuarios o postulaciones. Los permisos de detalle y evidencia no cambian.

Los filtros reproducen `useDashboardReports`: búsqueda sin distinguir
mayúsculas en título, descripción, etiqueta de severidad/estado e ID de
postulación. Se conservan los espacios de búsqueda. La fecha compara el día
ISO en UTC de creación, como el filtro actual de la pantalla. Con filtros
vacíos se exporta todo el conjunto autorizado, sin paginación ni truncamiento.

Se rechazan formatos/fechas inválidos, resultados vacíos y exportaciones de
más de 5.000 registros o 10 millones de caracteres serializados, indicando que
se deben aplicar filtros. El archivo se genera completo antes de responder;
si falla, se devuelve un error y nunca una descarga parcial con estado 200.

Las respuestas incluyen MIME según formato, `Content-Disposition: attachment`,
`Content-Length`, `Cache-Control: no-store, private`, `nosniff` y `X-Report-Count`.
El frontend valida HTTP, MIME, cantidad y firma del archivo antes de descargar
el Blob, libera su URL y evita envíos duplicados. Si la sesión vence, intenta
renovarla una vez por el mecanismo existente; si falla pide iniciar sesión.
Si la cantidad cambió desde la carga de la tabla, pide actualizar el listado.

## Contenido y formatos

Columnas: ID completo del reporte, ID de postulación, nombre del proyecto,
título, descripción completa, severidad, estado, creación y actualización en
UTC, pasos numerados y cantidad de evidencias. La cantidad incluye imágenes
adjuntas más la evidencia URL histórica, cuando existe. No se exportan rutas,
URLs de evidencia, imágenes, tokens ni datos personales de los participantes.

Campos opcionales ausentes: celdas vacías en CSV/XLSX y «Sin dato» en el detalle
PDF; cantidad de evidencias cero. Un estado ausente/null se representa como
ABIERTO, igual que la pantalla; no se escribe ese valor en MongoDB. Un estado
vacío explícito conserva el vacío. Estados desconocidos se muestran literalmente.
Las etiquetas actuales son BAJA/MEDIA/ALTA y ABIERTO/EN REVISIÓN/RESUELTO;
`critical` permanece literal para conservar los filtros existentes. Los
proyectos que ya no existen dejan su nombre vacío, conservando el reporte.

- CSV real con UTF-8 BOM, separador `;`, encabezados en español y quoting de
  comillas, separadores y saltos. Los textos que podrían ser fórmulas llevan
  un apóstrofo inicial de protección; el dato original no se altera.
- XLSX real con openpyxl 3.1.5, hoja `Reportes`, encabezados verdes, columnas
  dimensionadas, ajuste de texto, filtro y primera fila congelada. Fechas
  tipadas en UTC con formato `dd/mm/yyyy hh:mm:ss`. El texto se escribe como
  texto, nunca como fórmula. Se rechazan celdas de más de 32.767 caracteres o
  caracteres de control incompatibles con Excel, sin cortarlas. La altura se
  ajusta hasta el límite de Excel de 409 puntos; textos extremos siguen
  completos en la celda y se pueden consultar desde la barra de fórmulas.
- PDF real con ReportLab 5.0.1 y fuente Vera incluida en esa dependencia para
  caracteres españoles. Título, generación y filtros; tabla resumen con
  encabezados repetidos y detalle completo que puede continuar en otras
  páginas. Las descripciones/pasos no se comprimen en columnas estrechas ni
  se recortan. Se escapa markup de usuarios y no se cargan recursos externos.

Las bibliotecas están fijadas en `backend/requirements.txt`. Documentación:
[openpyxl](https://openpyxl.readthedocs.io/en/stable/) y
[tablas ReportLab](https://docs.reportlab.com/reportlab/userguide/ch7_tables/).

## Verificación

`apps.reports.test_exports` cubre formatos reales, contenido, fechas,
caracteres especiales, fórmulas, permisos, filtros, vacíos, parámetros inválidos,
límites y generación fallida. Ejecutar también los tests existentes de reports.
Para integración, usar exclusivamente bases locales de prueba aisladas; los
tests existentes de reports escriben documentos en la base Mongo configurada.

La diferencia preexistente entre CLOSED (Reportes) y RESOLVED (Estadísticas)
queda fuera de esta funcionalidad. No se cambió la autenticación ni el estado
persistido de bugs. El servicio de exportación utiliza `API_BASE`, compartido
con los demás servicios e incorporado desde develop actualizado.
