<div align="center">
  <h1><strong style="font-size: 24px;">JuniorBridge</strong></h1>
</div>

<p align="center">
  <!-- Logo o imagen del proyecto -->
  <img src="https://github.com/user-attachments/assets/0a3752da-6d97-45a6-9a5c-06185fc06367" alt="JuniorBridge" width="600px" />
</p>

**_JuniorBridge es una plataforma web que conecta testers junior y estudiantes IT con emprendedores y pequeñas startups que necesitan validar sus aplicaciones antes de lanzarlas al mercado._**

Es un proyecto desarrollado por **El Palomar** para aplicar conocimientos adquiridos en distintas áreas del desarrollo de software, gestión de proyectos, arquitectura de sistemas y metodologías ágiles.

Actualmente existe una brecha importante entre la formación académica y el acceso al primer empleo dentro de la industria IT. JuniorBridge busca convertirse en ese puente, permitiendo que los estudiantes obtengan experiencia real mientras ayudan a emprendedores a mejorar la calidad de sus productos digitales.

---

# 🌐 Producción

| Servicio | URL |
| --- | --- |
| Frontend | https://junior-bridge-frontend-85z5.onrender.com |
| API | https://junior-bridge-api-n1o6.onrender.com |
| Swagger UI | https://junior-bridge-api-n1o6.onrender.com/api/docs/ |
| ReDoc | https://junior-bridge-api-n1o6.onrender.com/api/redoc/ |
| Esquema OpenAPI | https://junior-bridge-api-n1o6.onrender.com/api/schema/ |
| Admin de Django | https://junior-bridge-api-n1o6.onrender.com/admin/ |

> Los servicios usan el plan gratuito de Render por lo tanto las peticiones pueden llegar a demorar entre 30-40 segundos.

---

# ⚡ Inicio rápido

Requisitos: Git y Docker Desktop (con Docker Compose).

1. Clonar el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd junior-bridge-platform
   ```

2. Crear el archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

3. Completar en `.env` como mínimo `SECRET_KEY`, `POSTGRES_PASSWORD` y las credenciales OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`). Ver [🔑 Variables de entorno](#-variables-de-entorno).

   > [!IMPORTANTISIMO]
   > Al arrancar, el backend ejecuta `create_google_social_app` y `create_github_social_app`, que fallan si faltan esas credenciales. En ese caso el contenedor no llega a iniciar Daphne.

4. Levantar todos los servicios:

   ```bash
   docker compose up --build
   ```

5. Abrir la aplicación:

   | Servicio | URL local |
   | --- | --- |
   | Frontend | http://localhost:3000 |
   | API | http://localhost:8000 |
   | Swagger UI | http://localhost:8000/api/docs/ |
   | ReDoc | http://localhost:8000/api/redoc/ |
   | Admin de Django | http://localhost:8000/admin/ |

### Qué levanta Docker Compose

| Servicio | Imagen / build | Puerto en el host |
| --- | --- | --- |
| `backend` | `./backend` (Python 3.12, Daphne) | `8000` |
| `frontend` | `./frontend` (Node 22, `npm run dev`) | `3000` |
| `postgres` | `postgres:17` | `5433`|
| `mongodb` | `mongo:8` | `27017` |
| `redis` | `redis:7-alpine` | `6379` |
| `newman` | `./tests/api` (solo con el perfil `tests`) | — |

Al iniciar, el backend ejecuta en orden: `migrate`, `create_test_users`, `create_google_social_app`, `create_github_social_app` y, por último, `daphne` en el puerto `8000`.

### Usuarios de prueba

El comando `create_test_users` crea una cuenta CLIENT y otra TESTER solo si `SEED_TEST_USERS=true` (por defecto es `false`). Los emails y las contraseñas por defecto están definidos en [`create_test_users.py`](backend/apps/users/management/commands/create_test_users.py) y se pueden reemplazar con `TEST_CLIENT_EMAIL`, `TEST_CLIENT_PASSWORD`, `TEST_TESTER_EMAIL` y `TEST_TESTER_PASSWORD`.

Para crear un administrador:

```bash
docker compose exec backend python manage.py createsuperuser
```

---

# ❗ ¿Qué problema estamos resolviendo? ❗

## La dificultad para conseguir la primera experiencia laboral

Muchas ofertas laborales exigen experiencia previa incluso para puestos junior.

Esto genera una situación compleja:

- Los estudiantes necesitan experiencia para conseguir trabajo.
- Las empresas solicitan experiencia para contratar.

JuniorBridge permite a los testers junior:

- Participar en proyectos reales.
- Construir experiencia práctica.
- Generar un portfolio verificable.
- Obtener reputación mediante calificaciones.

## La necesidad de testing accesible para emprendedores

Los pequeños emprendimientos y startups suelen necesitar validaciones funcionales antes de lanzar sus aplicaciones.

Sin embargo:

- Contratar equipos QA especializados suele ser costoso.
- Muchas veces no cuentan con presupuesto suficiente.

JuniorBridge les permite acceder a testing estructurado a bajo costo mediante una comunidad de testers junior.

---

# 🤔 ¿Por qué elegimos esta idea? 🤔

Creemos que existe una necesidad real tanto para quienes buscan ingresar al mercado laboral IT como para los emprendedores que necesitan validar sus productos.

JuniorBridge genera beneficios para ambas partes:

### Para los testers

- Experiencia profesional real.
- Construcción de reputación.
- Desarrollo de habilidades prácticas.
- Portfolio verificable.

### Para los emprendedores

- Validación temprana de aplicaciones.
- Reportes estructurados de errores.
- Retroalimentación externa.
- Reducción de costos de testing.

Además, representa una excelente oportunidad para aplicar tecnologías modernas, metodologías ágiles y buenas prácticas de desarrollo de software.

---

# 🎯 ¿Qué queremos lograr? 🎯

Desarrollar una plataforma que permita gestionar completamente el ciclo de vida de proyectos de testing:

- Publicación de proyectos.
- Aprobación administrativa.
- Postulación de testers.
- Ejecución de pruebas.
- Reportes de bugs.
- Evaluación del trabajo realizado.
- Sistema de reputación.

Todo esto desde una interfaz intuitiva, moderna y accesible.

---

# 🚀 Funcionalidades Principales

### 🔐 Autenticación

- Registro de usuarios
- Inicio de sesión
- OAuth con Google
- OAuth con GitHub

### 👥 Gestión de Roles

- Administrador
- Tester Junior
- Emprendedor

### 📋 Gestión de Proyectos

- Crear proyectos
- Aprobar o rechazar publicaciones
- Gestión de estados
- Seguimiento del ciclo de vida

### 🐞 Reportes de Bugs

- Registro estructurado de errores
- Adjuntar hasta 5 imágenes de evidencia por reporte
- Pasos para reproducir
- Nivel de criticidad o riesgo

### 📧 Notificaciones

- Cambios de estado
- Aprobaciones
- Finalización de proyectos

### ⭐ Sistema de Reputación

- Calificaciones de 1 a 5 estrellas
- Historial de desempeño
- Construcción de reputación profesional

---

# 📌 Alcance del Proyecto

JuniorBridge contempla el desarrollo completo del flujo de testing dentro de la plataforma:

✔ Gestión de usuarios

✔ Gestión de proyectos

✔ Postulación de testers

✔ Reporte de bugs

✔ Calificaciones

✔ Notificaciones

✔ Auditoria de Proyectos

✔ Exportación de reportes

### Fuera del alcance actual

✖ Integración con GitHub Issues

✖ Chat interno

✖ Aplicación móvil

✖ Automatización QA

✖ Sistema de pagos

✖ Sistema de medallas

Estas funcionalidades quedan planteadas como futuras versiones del producto.

## Almacenamiento de evidencias

En desarrollo, las imágenes se guardan localmente en `backend/media`. Para
producción, se puede configurar un bucket privado de AWS S3 definiendo
`AWS_STORAGE_BUCKET_NAME` y `AWS_S3_REGION_NAME` en el entorno del backend.
La aplicación genera enlaces temporales para que quienes tienen acceso al
reporte puedan ver sus imágenes. En AWS, se recomienda asignar permisos S3 al
rol de la aplicación en vez de guardar credenciales en el repositorio.
Para desarrollo local fuera de AWS, el SDK puede autenticarse mediante
`AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` (y `AWS_SESSION_TOKEN` si se usan
credenciales temporales); nunca se deben copiar credenciales reales al
`.env.example` ni subirlas al repositorio. El backend entrega las imágenes por
rutas autenticadas y comprueba el acceso de cada usuario al reporte.

Cada reporte admite hasta 5 imágenes JPG, PNG o WEBP, de hasta 5 MB cada una;
el backend las redimensiona a un máximo de 1920 px y las recomprime antes de
guardarlas. Las fotos de perfil aceptan JPG, PNG o WEBP, también hasta 5 MB, y
se optimizan a un máximo de 512 px.

La exportación de reportes a Excel, PDF y CSV se describe en [Exportación de reportes de bugs](docs/exportacion-reportes.md).

---

# 🛠️ Stack Tecnológico

### Backend

- Python 3.12
- Django 6
- Django REST Framework
- Simple JWT (autenticación con cookies)
- django-allauth (OAuth con Google y GitHub)
- drf-spectacular (OpenAPI, Swagger UI y ReDoc)
- Django Channels y Daphne (ASGI y WebSockets para notificaciones)
- WhiteNoise (archivos estáticos)
- django-storages con AWS S3 (imágenes, opcional)
- openpyxl y ReportLab (exportación a Excel y PDF)

### Frontend

- Node.js 22
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Bases de Datos

- PostgreSQL (Supabase en producción)
- MongoDB (reportes de bugs)
- Redis (capa de canales para WebSockets; Key Value de Render en producción)
- [Configuración de PostgreSQL en Supabase](docs/configuracion-supabase.md)

### Infraestructura

- Docker
- Docker Compose
- Render (Blueprint en `render.yaml`)

### Integraciones

- Google OAuth
- GitHub OAuth
- Google PageSpeed Insights (auditorías de proyectos)
- Mailtrap (email en desarrollo)
- Brevo SMTP (email en producción)

### Testing

- Tests de Django (`manage.py test`) con Coverage
- Newman (colección Postman de la API)
- Playwright (E2E)

### Email

El backend envía email por SMTP configurado con variables de entorno
(`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`,
`EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`, `EMAIL_TIMEOUT`). Ver `.env.example`.

- **Sin `EMAIL_HOST`**: los emails se imprimen en la consola del backend.
- **Desarrollo**: Mailtrap sandbox (`sandbox.smtp.mailtrap.io`, puerto `2525`).
  Los emails quedan en la bandeja de Mailtrap y no llegan a casillas reales.
- **Producción**: Brevo SMTP en el puerto `2525`, porque el plan gratuito de
  Render bloquea los puertos 25, 465 y 587. Los emails llegan a casillas
  reales. `DEFAULT_FROM_EMAIL` debe ser un remitente verificado en Brevo.

### Control de Versiones

- Git
- GitHub

---

# 🧰 Instalación sin Docker

Requiere Python 3.12 ([`backend/.python-version`](backend/.python-version)) y Node.js 22 ([`frontend/.node-version`](frontend/.node-version)). El backend necesita PostgreSQL, MongoDB y Redis; la forma más simple es levantar solo esos servicios con Docker:

```bash
docker compose up -d postgres mongodb redis
```

### Backend

1. Crear el entorno virtual e instalar las dependencias:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  
   pip install -r requirements.txt
   ```

2. Ajustar en `.env` (en la raíz del repositorio) los hosts para conectarse desde fuera de Docker:

   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5433
   MONGODB_URI=mongodb://localhost:27017/
   REDIS_URL=redis://localhost:6379/0
   ```

3. Migrar y arrancar el servidor ASGI:

   ```bash
   python manage.py migrate
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Sin variables propias, el frontend llama a la API en `http://localhost:8000`.

| Script | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright |

---

# 🔑 Variables de entorno

El backend lee las variables del archivo `.env` de la raíz (ver [`.env.example`](.env.example)).

### Django y seguridad

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `SECRET_KEY` | Sí | Clave secreta de Django. |
| `DEBUG` | No | Modo debug. Por defecto `False`. |
| `ALLOWED_HOSTS` | No | Hosts permitidos, separados por coma. |
| `CORS_ALLOWED_ORIGINS` | No | Orígenes CORS permitidos, separados por coma. |
| `AUTH_COOKIE_SECURE` | No | Marca `Secure` en las cookies de autenticación. Por defecto `true`; usar `false` solo con clientes HTTP locales como Newman. |
| `CSRF_COOKIE_SECURE` | No | Igual que la anterior, para la cookie CSRF. |

### Bases de datos

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `POSTGRES_DB` | Sí | Nombre de la base PostgreSQL. |
| `POSTGRES_USER` | Sí | Usuario de PostgreSQL. |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL. |
| `POSTGRES_HOST` | Sí | Host (`postgres` dentro de Docker). |
| `POSTGRES_PORT` | Sí | Puerto (`5432` dentro de Docker). |
| `POSTGRES_SSLMODE` | No | Modo SSL. Por defecto `prefer`; `require` en Supabase. |
| `MONGODB_URI` | No | URI de MongoDB. Por defecto `mongodb://mongodb:27017/`. |
| `MONGODB_DATABASE` | No | Base de MongoDB. Por defecto `junior_bridge`. |
| `REDIS_URL` | No | URL de Redis para WebSockets. Si falta, se arma con `REDIS_HOST` y `REDIS_PORT`. |

### Frontend y redirecciones

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `FRONTEND_URL` | No | URL pública del frontend. Por defecto `http://localhost:3000`. |
| `FRONTEND_OAUTH_SUCCESS_URL` | No | Destino tras un login OAuth correcto. Por defecto `FRONTEND_URL/dashboard`. |
| `FRONTEND_OAUTH_ERROR_URL` | No | Destino tras un login OAuth fallido. Por defecto `FRONTEND_URL/login`. |
| `FRONTEND_PASSWORD_RESET_URL` | No | Página para restablecer la contraseña. |
| `PASSWORD_RESET_TIMEOUT` | No | Validez del enlace de restablecimiento, en segundos. Por defecto `3600`. |
| `NEXT_PUBLIC_API_BASE` | No | Base de la API para el navegador. Por defecto `http://localhost:8000`|
| `API_PROXY_TARGET` | Solo en producción | Origen de la API al que Next.js redirige `/api/*` y `/accounts/*`. |
| `NEXT_PUBLIC_WS_BASE` | Solo en producción | Origen del WebSocket de notificaciones (por ejemplo `wss://...`). |

### OAuth

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Sí con Docker Compose | ID de cliente OAuth de Google. |
| `GOOGLE_CLIENT_SECRET` | Sí con Docker Compose | Secreto de cliente OAuth de Google. |
| `GITHUB_CLIENT_ID` | Sí con Docker Compose | ID de cliente OAuth de GitHub. |
| `GITHUB_CLIENT_SECRET` | Sí con Docker Compose | Secreto de cliente OAuth de GitHub. |
| `ACCOUNT_DEFAULT_HTTP_PROTOCOL` | Sí en local | Esquema de las URLs de callback OAuth (`http` o `https`). En local debe ser `http`; si se omite vale `https`, que es lo que usa producción. |

### Email

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `EMAIL_HOST` | No | Servidor SMTP. Sin valor, los emails se imprimen en la consola. |
| `EMAIL_PORT` | No | Puerto SMTP. Por defecto `587`. |
| `EMAIL_HOST_USER` | No | Usuario SMTP. |
| `EMAIL_HOST_PASSWORD` | No | Contraseña SMTP. |
| `EMAIL_USE_TLS` | No | Usar TLS. Por defecto `True`. |
| `DEFAULT_FROM_EMAIL` | No | Remitente.|
| `EMAIL_TIMEOUT` | No | Timeout SMTP en segundos. Por defecto `10`. |

### Almacenamiento (AWS S3)

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `AWS_STORAGE_BUCKET_NAME` | No | Si se define, las imágenes se guardan en S3; si no, en `backend/media`. |
| `AWS_S3_REGION_NAME` | No | Región del bucket. |
| `AWS_ACCESS_KEY_ID` | No | Credencial de AWS (fuera de AWS). |
| `AWS_SECRET_ACCESS_KEY` | No | Credencial de AWS (fuera de AWS). |
| `AWS_SESSION_TOKEN` | No | Solo con credenciales temporales. |

### Otros

| Variable | Requerida | Para qué sirve |
| --- | --- | --- |
| `PAGESPEED_API_KEY` | No | API key de PageSpeed Insights. Sin ella la cuota es menor. |
| `PAGESPEED_TIMEOUT` | No | Timeout de las auditorías en segundos. Por defecto `120`. |
| `SEED_TEST_USERS` | No | Con `true`, crea los usuarios de prueba al iniciar. Por defecto `false`. |

---

# 🧪 Tests

| Suite | Herramienta | Ubicación |
| --- | --- | --- |
| Backend | Tests de Django + Coverage | `backend/apps` |
| API | Newman (Postman) | [`tests/api/`](tests/api/) |
| E2E | Playwright | [`frontend/e2e/`](frontend/e2e/) |

### Backend

Los tests necesitan PostgreSQL, por eso se recomienda ejecutarlos dentro de Docker Compose:

```bash
docker compose exec backend python manage.py test
```

Con cobertura (configurada en [`backend/.coveragerc`](backend/.coveragerc), que mide `apps` y excluye migraciones y tests):

```bash
docker compose exec backend coverage run manage.py test
docker compose exec backend coverage report
```

### API con Newman

La colección usa las cuentas de prueba, así que requiere `SEED_TEST_USERS=true`. Como Newman llama a `http://backend:8000` sin HTTPS, también requiere `AUTH_COOKIE_SECURE=false` y `CSRF_COOKIE_SECURE=false` en el `.env` local.

```bash
docker compose --profile tests run --rm newman
```

Los reportes quedan en `reportes/newman.html` y `reportes/newman.xml`.

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### E2E con Playwright

Los flujos críticos corren contra un stack Docker aislado que gestiona [`run-e2e.ps1`](frontend/e2e/support/run-e2e.ps1) (PowerShell) con las acciones `Prepare`, `Up`, `Test` y `Stop`. Las credenciales y las evidencias se guardan fuera del repositorio. Los pasos completos están en [`frontend/e2e/README.md`](frontend/e2e/README.md) y los resultados, en el [informe E2E](docs/informe-e2e-flujos-criticos.md).

---

# 🌿 Organización del Proyecto en GitHub (Sistema de Branching) 🌿

Para mantener una organización clara durante el desarrollo implementamos una estrategia basada en ramas:

🔹 **main**
Versión estable del proyecto.

🔸 **release**
Preparación de versiones candidatas para entrega.

🔶 **develop**
Integración continua de funcionalidades.

🔧 **feature/\***
Ramas utilizadas para cada funcionalidad o historia de usuario.

---

## 🚀 Flujo de Trabajo

Cada integrante desarrolla sus tareas en ramas independientes.

Posteriormente:

1. Se realiza Pull Request.
2. Se revisa el código.
3. Se integra en develop.
4. Se realizan pruebas.
5. Se prepara release.
6. Se fusiona a main.

De esta manera garantizamos estabilidad y trazabilidad durante todo el ciclo de desarrollo.

---

# 🕊️ ¿Quiénes Somos? 🕊️

**_El Palomar_**

Estudiantes de la Tecnicatura Superior en Desarrollo de Software - ISPC

- Ana Camila Almirón
- Marialis Aquino
- Christian Dagatti
- Fabrizio Avila
- Carlos Huallpa
- Ezequiel Gonzáles

<p align="center">
  <!-- Imagen del equipo -->
  <img width="500" alt="El Palomar" src="https://github.com/user-attachments/assets/07d60560-4f9b-43d1-b0cd-b9dbf757e7bf" />
</p>

### 💡 Nuestro objetivo

Más que desarrollar una plataforma, buscamos crear una oportunidad para quienes están dando sus primeros pasos en el mundo IT.

JuniorBridge nace de una problemática que conocemos de cerca: la dificultad de obtener experiencia profesional cuando recién comenzamos.

Creemos que la mejor forma de aprender es participando en proyectos reales, enfrentando desafíos reales y generando valor para otras personas.

Por eso desarrollamos JuniorBridge: un puente entre el aprendizaje y el mundo laboral.
