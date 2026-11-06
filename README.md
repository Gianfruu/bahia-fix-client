# Bahía Fix — Aplicación web

Aplicación web de gestión de clientes, equipos, turnos y reparaciones, desarrollada con React y Vite.

## Descripción

El frontend de Bahía Fix permite acceder a un espacio de trabajo con módulos para consultar y administrar clientes, equipos, turnos y reparaciones. La interfaz presenta información general del taller y adapta los módulos disponibles según el perfil seleccionado al iniciar sesión.

La aplicación se comunica con la API REST `bahia-fix-api`. Si no puede establecer conexión con la API, algunos servicios utilizan datos de demostración locales para permitir la navegación y las operaciones del prototipo.

## Funcionalidades

### Acceso y perfiles

- Inicio de sesión con cuentas de demostración.
- Registro simulado de usuarios, asignando el perfil Operador.
- Recuperación de contraseña simulada; no se envían correos electrónicos.
- Visualización del perfil activo y cierre de sesión.
- Acceso a módulos según los permisos del perfil.

### Perfiles disponibles

| Perfil | Acceso |
|---|---|
| Administrador | Clientes y Equipos, Turnos y Reparaciones |
| Operador | Clientes y Equipos, Turnos y Reparaciones |
| Técnico | Reparaciones |

### Módulos

- **Clientes y Equipos:** consulta y administración de registros, con búsqueda, paginación y operaciones CRUD.
- **Turnos:** consulta, creación, modificación, eliminación, actualización de estado, filtros y resumen.
- **Reparaciones:** consulta y administración de reparaciones, con búsqueda, filtros, ordenamiento y operaciones CRUD.
- **Panel general:** resumen de cantidades de clientes, equipos, turnos y reparaciones.

### Reportes

El módulo correspondiente incluye la generación de reportes en PDF para la información presentada.

## Tecnologías

- React
- Vite
- JavaScript
- CSS
- Fetch API para la comunicación HTTP

## Requisitos

- Node.js.
- npm.
- API `bahia-fix-api` en ejecución para utilizar los datos y operaciones del backend.

## Instalación

Clonar el repositorio y acceder a su carpeta:

```bash
git clone https://github.com/Gianfruu/bahia-fix-client.git
cd bahia-fix-client
```

Instalar las dependencias:

```bash
npm install
```

## Configuración

Crear un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

`VITE_API_URL` indica la dirección base de la API REST.

## Ejecución

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir la aplicación. Por defecto, suele ser:

```text
http://localhost:5173
```

Para generar una versión de producción:

```bash
npm run build
```

Para visualizar localmente la compilación:

```bash
npm run preview
```

Para ejecutar el análisis estático del código:

```bash
npm run lint
```

## Cuentas de demostración

| Perfil | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@bahiafix.com` | `Admin123` |
| Operador | `operador@bahiafix.com` | `Operador123` |
| Técnico | `tecnico@bahiafix.com` | `Tecnico123` |

Estas cuentas están definidas en la aplicación para probar los distintos perfiles. El inicio de sesión no consulta un servicio de autenticación externo.

## Integración con la API

La aplicación utiliza la URL definida en `VITE_API_URL`. Si la variable no está configurada, utiliza por defecto:

```text
http://localhost:3000/api/v1
```

El backend debe permitir el origen del frontend mediante la variable `CLIENT_URL`.

Cuando la API no está disponible, los servicios que cuentan con alternativa local utilizan datos de demostración en memoria. Estos datos no constituyen almacenamiento persistente.

## Estructura del proyecto

```text
bahia-fix-client/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── state/
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Consideraciones

- Es un prototipo funcional con datos de demostración.
- El backend utiliza datos en memoria; no hay conexión a una base de datos persistente.
- Los datos creados o modificados durante la ejecución pueden perderse al reiniciar los servicios.
- El registro y la recuperación de contraseña son simulados.
- Los perfiles y permisos permiten recorrer las vistas correspondientes dentro del prototipo.
