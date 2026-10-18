# Configuración de PostgreSQL en Supabase

JuniorBridge utiliza PostgreSQL como base de datos relacional. En desarrollo local, PostgreSQL se ejecuta mediante Docker Compose. Para el entorno desplegado, la base se aloja en Supabase.

La aplicación mantiene la misma arquitectura en ambos entornos:

```text
Frontend -> Backend Django -> PostgreSQL
```

El frontend no se conecta directamente con Supabase. Django continúa administrando los modelos, permisos y migraciones.

## Conexión utilizada

El backend se conecta mediante **Session pooler**, que permite conexiones IPv4 y utiliza el puerto `5432`.

Los datos de conexión se obtienen desde el panel del proyecto de Supabase, en **Connect > Session pooler**.

## Variables de entorno

El backend necesita las siguientes variables:

```env
POSTGRES_DB=postgres
POSTGRES_USER=postgres.ID_DEL_PROYECTO
POSTGRES_PASSWORD=supabase_password
POSTGRES_HOST=HOST_DEL_POOLER
POSTGRES_PORT=5432
POSTGRES_SSLMODE=require
```

Los valores reales deben configurarse únicamente en el archivo `.env` local o en las variables privadas del servicio donde se despliegue el backend. No deben guardarse en GitHub ni exponerse en el frontend.

Para trabajar con PostgreSQL local mediante Docker se utiliza:

```env
POSTGRES_DB=junior_bridge
POSTGRES_USER=junior_bridge
POSTGRES_PASSWORD=password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_SSLMODE=prefer
```

En Supabase se utiliza `require` para exigir una conexión cifrada. El valor `prefer` mantiene la compatibilidad con PostgreSQL local.

## Crear o actualizar las tablas

La estructura de la base se administra mediante las migraciones de Django. No se deben crear o modificar manualmente las tablas desde el panel de Supabase.

Con las variables de Supabase configuradas, ejecutar:

```powershell
docker compose run --rm backend python manage.py migrate
```

Las migraciones se ejecutan una vez sobre la base compartida. Cuando se incorporen nuevas migraciones al proyecto, deben aplicarse nuevamente en el entorno desplegado.

Para consultar su estado:

```powershell
docker compose run --rm backend python manage.py showmigrations
```

Las migraciones aplicadas aparecen marcadas con `[X]`.

## Validar la conexión

Se puede realizar una prueba sin crear registros manualmente:

```powershell
docker compose run --rm backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('Conexion con Supabase exitosa')"
```

Después de ejecutar las migraciones, las tablas pueden consultarse Supabase. 

## Seguridad

- No compartimos ni subimos al repositorio la contraseña de PostgreSQL.
- Mantenemos `.env` excluido mediante `.gitignore`.
- Usar `POSTGRES_SSLMODE=require` en Supabase.
- Se activó **Enforce SSL on incoming connections** en la configuración de la base.
- Cambiar inmediatamente la contraseña si se expone accidentalmente.

## Responsabilidad durante el despliegue

Las credenciales deben cargarse como variables privadas en el servicio que aloje el backend. 
