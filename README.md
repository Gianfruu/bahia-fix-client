# Bahía Fix — Aplicación web

Aplicación web para la gestión de clientes, equipos, turnos y reparaciones de un taller. Está desarrollada con React y Vite.

## Descripción

El frontend permite consultar y administrar la información del taller desde distintos módulos. La interfaz incluye un panel general y adapta los módulos disponibles según el perfil activo.

La aplicación consume la API REST de `bahia-fix-api`. Para el funcionamiento integrado, el backend debe estar iniciado y configurado. Algunos servicios disponen de datos locales de demostración como alternativa cuando la API no está disponible; esos datos se mantienen en memoria y no constituyen almacenamiento persistente.

## Funcionalidades

### Acceso y perfiles

- Inicio de sesión con cuentas de demostración.
- Registro simulado de usuarios, con asignación del perfil Operador.
- Recuperación de contraseña simulada; no se envían correos electrónicos.
- Visualización del perfil activo y cierre de sesión.
- Presentación de módulos según el perfil y sus permisos.

### Perfiles disponibles

| Perfil | Módulos disponibles |
|---|---|
| Administrador | Clientes y Equipos, Turnos y Reparaciones |
| Operador | Clientes y Equipos, Turnos y Reparaciones |
| Técnico | Reparaciones |

### Módulos

- **Clientes y Equipos:** consulta, alta, edición y eliminación de registros; búsqueda, filtros y paginación.
- **Turnos:** consulta, alta, edición, eliminación, actualización de estado, filtros y paginación.
- **Reparaciones:** consulta, alta, edición y eliminación; búsqueda, filtros, ordenamiento y paginación.
- **Panel general:** resumen de cantidades de clientes, equipos, turnos y reparaciones.

### Reportes

Los módulos permiten generar reportes en formato PDF con los registros correspondientes.

## Tecnologías

- React
- Vite
- JavaScript
- CSS
- Fetch API para la comunicación HTTP

## Requisitos

- Node.js
- npm
- API `bahia-fix-api` en ejecución para utilizar el sistema integrado.

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

`VITE_API_URL` define la dirección base de la API REST.

## Ejecución

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local de la aplicación. Por defecto:

```text
http://localhost:5173
```

Para generar la versión de producción:

```bash
npm run build
```

Para ejecutar la compilación localmente:

```bash
npm run preview
```

Para analizar el código con ESLint:

```bash
npm run lint
```

## Cuentas de demostración

| Perfil | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@bahiafix.com` | `Admin123` |
| Operador | `operador@bahiafix.com` | `Operador123` |
| Técnico | `tecnico@bahiafix.com` | `Tecnico123` |

Estas cuentas permiten recorrer los distintos perfiles de la interfaz. El inicio de sesión, el registro y la recuperación de contraseña son flujos simulados; no utilizan un servicio externo de autenticación.

## Integración con la API

La aplicación utiliza la URL definida en `VITE_API_URL`. Si la variable no está configurada, la dirección predeterminada es:

```text
http://localhost:3000/api/v1
```

El backend debe permitir el origen del frontend mediante la variable `CLIENT_URL`.

Algunos servicios disponen de datos locales de demostración como alternativa cuando la API no está disponible. Estos datos se mantienen en memoria y no constituyen almacenamiento persistente.

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
- El registro, la recuperación de contraseña y la autenticación son simulados.
- Los perfiles permiten probar la disponibilidad de los módulos desde la interfaz.
