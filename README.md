
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

✔ Geolocalización

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

---

# 🛠️ Stack Tecnológico

### Backend

- Django
- Django REST Framework

### Frontend

- React
- Next.js

### Bases de Datos

- PostgreSQL
- MongoDB

### Infraestructura

- Docker
- Docker Compose
- Redis

### Integraciones

- Google OAuth
- GitHub OAuth
- Google Maps API
- Mailtrap (email en desarrollo)
- Gmail SMTP (email en producción)

### Email

El backend envía email por SMTP configurado con variables de entorno
(`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`,
`EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`). Ver `.env.example`.

- **Sin `EMAIL_HOST`**: los emails se imprimen en la consola del backend.
- **Desarrollo**: Mailtrap sandbox (`sandbox.smtp.mailtrap.io`, puerto `2525`).
  Los emails quedan en la bandeja de Mailtrap y no llegan a casillas reales.
- **Producción**: Gmail SMTP (`smtp.gmail.com`, puerto `587`, TLS).
  Los emails llegan a casillas reales. `EMAIL_HOST_USER` y `DEFAULT_FROM_EMAIL`
  son la cuenta de Gmail del proyecto; `EMAIL_HOST_PASSWORD` es una contraseña
  de aplicación de Google (requiere verificación en dos pasos activada).

### Control de Versiones

- Git
- GitHub

---

# 🌿 Organización del Proyecto en GitHub (Sistema de Branching) 🌿

Para mantener una organización clara durante el desarrollo implementamos una estrategia basada en ramas:

🔹 **main**
Versión estable del proyecto.

🔸 **release**
Preparación de versiones candidatas para entrega.

🔶 **develop**
Integración continua de funcionalidades.

🔧 **feature/***
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
