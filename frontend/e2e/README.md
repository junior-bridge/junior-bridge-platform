# Flujos críticos E2E reales

Estos escenarios recorren Chromium → Next.js → Django → PostgreSQL/MongoDB, con Redis local. No hay `route.fulfill`, respuestas de exportación simuladas ni IDs fijos. `context.route` solo permite tráfico a los dos orígenes locales y bloquea envíos accidentales de contraseñas por URL.

## Playwright oficial del PR #170

La rama `test/e2e-flujos-criticos` incorporó por fast-forward `origin/develop` en `164473d`, que integró el PR #170 de Carlos. Se reutilizan `frontend/playwright.config.ts`, las dependencias del frontend, `npm run test:e2e` y su `LoginPage`. Sus once tests permanecen intactos; no se copiaron ni se hicieron cherry-picks.

Se eliminaron `e2e/package.json`, su lockfile y la generación de configuración provisional. El runner usa únicamente el Playwright oficial. `E2E_RUNTIME_FILE` selecciona el origen local verificado y desactiva el `webServer` de desarrollo; `E2E_RESULTS_DIR` recibe las evidencias fuera del repositorio. Sin esas variables se conserva la configuración original de Carlos para desarrollo. Los lectores Python continúan fijados en `support/requirements-readers.txt`.

La app y los tests tienen chequeos TypeScript separados. `frontend/tsconfig.json` excluye `e2e` del build de producción; `e2e/tsconfig.json` hereda sus opciones. Desde `frontend`, ejecutar `npx --no-install tsc --noEmit` y `npx --no-install tsc --noEmit --project e2e/tsconfig.json`.

`SessionPage` solo extiende el `LoginPage` oficial para agregar logout. La configuración oficial conserva Chromium y agrega opciones condicionales de timeout, capturas y reporters para el Compose aislado. Nuestros fixtures comprueban `baseURL`, puertos e identidad del backend; nunca reutilizan un servidor ajeno. Los tests de Carlos se ejecutan también contra ese frontend, conservando sus mocks existentes; nuestros seis casos siguen usando las operaciones reales.

## Preparación en PowerShell

Desde la raíz del repositorio, elegir un directorio **externo** para credenciales y evidencias:

```powershell
$runtime = Join-Path $env:TEMP 'juniorbridge-e2e-ezequiel'
npm ci --prefix frontend
cd frontend
npx --no-install playwright install chromium
cd ..
```

Con Python 3.12, instalar los lectores fijados en un venv externo. Incluyen openpyxl, pypdf y PDFium/Pillow para renderizar los PDF. Docker Desktop debe estar iniciado:

```powershell
python -m venv "$runtime/reader"
$reader = Join-Path $runtime 'reader/Scripts/python.exe'
& $reader -m pip install -r frontend/e2e/support/requirements-readers.txt
./frontend/e2e/support/run-e2e.ps1 -Action Prepare -RuntimeDir $runtime -ReaderPython $reader
./frontend/e2e/support/run-e2e.ps1 -Action Up -RuntimeDir $runtime
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime
```

`Prepare` crea `runtime.json` y `stack.env` fuera del repositorio. No imprimirlos ni compartirlos. Para otros puertos, utilizar un directorio nuevo y `-FrontendPort` / `-BackendPort` en `Prepare`; no cambiar solo el URL del navegador. `Up` rechaza puertos ocupados; para reconstruir un stack propio existente, ejecutar primero `-Action Stop` y luego `-Action Up`. Nunca reutiliza un Next.js ajeno.

```powershell
# Solo nuestros tests, o un spec individual:
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -Spec report-creation.spec.ts
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -Spec report-export.spec.ts
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -Spec project-rating.spec.ts
# Repeticiones sin retries automáticos; cada caso recibe nuevos datos:
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -RepeatEach 3
# Compatibilidad: nuestros seis casos y los once existentes de Carlos:
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -All
# Chromium con ventana:
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -Headed
# Descubrimiento sin ejecutar:
./frontend/e2e/support/run-e2e.ps1 -Action Test -RuntimeDir $runtime -List
# Detener solo el stack E2E y conservar sus volúmenes:
./frontend/e2e/support/run-e2e.ps1 -Action Stop -RuntimeDir $runtime
```

El equivalente directo, una vez preparado Playwright, es:

```powershell
$env:E2E_RUNTIME_FILE = Join-Path $runtime 'runtime.json'
$env:E2E_RESULTS_DIR = Join-Path $runtime 'evidence/direct'
cd frontend
npm run test:e2e -- --project chromium e2e/tests/report-creation.spec.ts
```

## Aislamiento y datos

- Compose `juniorbridge-e2e-ezequiel`, bases `juniorbridge_e2e` y volúmenes propios. PostgreSQL, MongoDB y Redis no publican puertos. Red `data` interna; red `web` con masquerade desactivado. Frontend/backend publican solo loopback, por defecto `3107/8107`.
- El frontend se compila desde el código real, con copia explícita de fuentes y sin `.env` ni dependencias E2E dentro de la imagen. Su configuración exclusiva de prueba reemplaza el rewrite de develop hacia Render por `http://backend:8000`.
- Django usa `e2e_settings`, que comprueba las bases internas antes de importar la configuración. Email en memoria, archivos locales, cookies/CSRF para HTTP loopback. No hay OAuth ni PageSpeed durante los escenarios.
- Antes de cada caso se verifican health, proyecto Compose, puertos publicados y la identidad del backend. La API usa las cookies de la misma sesión del navegador, sin fabricar JWT ni autenticar por API.
- Cada caso crea por ORM seis usuarios con emails `@example.test`, tres proyectos, tres postulaciones aceptadas y una calificación previa de dos estrellas. Mongo recibe dos reportes propios y uno ajeno, con fechas diferentes y texto con acentos, comillas y punto y coma.
- Los identificadores llevan `E2E_JUNIORBRIDGE_<16 caracteres aleatorios>`. La calificación nueva de cuatro estrellas debe dar reputación 3.00 considerando la previa.
- Teardown elimina documentos Mongo por postulación y prefijo propios, y proyectos/usuarios ORM del identificador exacto, con sus relaciones y tokens. Comprueba cero registros restantes de ese caso. No hay `flush`, borrado completo de tablas/colecciones ni eliminación de volúmenes.
- Si se mata el proceso antes del teardown, recuperar el identificador exacto de `fixtures-sin-credenciales` y pasarlo por stdin al helper `fixtures.py cleanup` en **ese** Compose. No limpiar por un prefijo genérico.

## Cobertura y evidencias

| Spec | Casos | Comprobaciones |
| --- | ---: | --- |
| `report-creation.spec.ts` | 1 | UI, POST 201, éxito, recarga, API, MongoDB, cliente propietario y rechazo de ajeno |
| `report-export.spec.ts` | 4 | Nueve descargas reales (3 formatos × texto/todos/fecha); BOM/CSV, celdas/fechas XLSX, parser/render PDF; usuario vacío; HTTP 400/401 reales sin descargas |
| `project-rating.spec.ts` | 1 | UI IN_PROGRESS → IN_REVIEW → COMPLETED; permisos, recargas, Rating 201, duplicado 400, PostgreSQL y reputación promedio |

Cada ejecución del script guarda resultados JSON, HTML, capturas, archivos descargados y lecturas en una carpeta nueva dentro del directorio externo. La configuración oficial ejecuta `secret-reporter.ts` antes de los reporters estándar para ocultar el password en los títulos de pasos `fill` que Playwright incluye en HTML. Las trazas de nuestros casos se inician **después** del login y se detienen antes de cambiar sesión, para no capturar contraseñas. Se conservan los tramos autenticados si falla el caso. Ante un fallo de login hay captura y diagnóstico, sin trace del password.

Las verificaciones de consola/red fallan ante errores inesperados. Se registran por separado respuestas previstas (perfil sin sesión, ausencia inicial de rating/auditoría) y el 404 previo del prefetch de `/dashboard/settings`, enlace que existe en el Sidebar pero cuya página falta en develop. No se ignoran otros 404 ni errores 500.

Las únicas modificaciones de pantallas son asociaciones `label`/`id`, semántica del modal/estrellas y dos identificadores de tarjetas. No se cambia diseño ni lógica de negocio. El incidente de envío nativo de login antes de hidratar se documenta para el equipo; los tests esperan el GET de perfil del `useEffect` antes de ingresar credenciales.
