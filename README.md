# Bahía Fix - Plataforma de Gestión de Turnos y Reparaciones (Frontend)

## Grupo Nro 5
* **Campagnucci Gianfranco** (Responsable del grupo / Desarrollador) - campagnuccig@gmail.com
* **Painenahuel Luna Ignacio** (Desarrollador) - Campionrexprohard@gmail.com
* **Cutropia Ramiro** (Desarrollador) - ramirocarlosc2323@gmail.com

---

## Presentación del Cliente Web

El repositorio **bahia-fix-client** contiene la interfaz de usuario web desarrollada para el sistema **Bahía Fix**. Esta aplicación permite interactuar con los cuatro perfiles del sistema (Cliente, Recepción, Mecánico y Administración), brindando una experiencia dinámica para la solicitud de turnos, seguimiento de reparaciones, gestión de presupuestos y administración del taller de herramientas eléctricas y equipos a explosión.

---

## Perfiles de Usuario y Pantallas Principales

La interfaz se adapta según el rol autenticado:

### 1. Cliente
* **Portal de Turnos:** Selección de equipo, fecha, hora y opción de envío.
* **Declaración de Garantía:** Formulario para adjuntar comprobantes de compra y datos del equipo.
* **Seguimiento en Tiempo Real:** Consulta interactiva del estado de órdenes de trabajo.
* **Aprobación de Presupuestos:** Panel interactivo para aprobar o rechazar presupuestos emitidos por los técnicos.
* **Historial:** Registro histórico de máquinas y servicios realizados.

### 2. Recepción / Mostrador
* **Mesa de Entradas:** Registro rápido de equipos presenciales y envío de cercanía.
* **Validación de Garantías:** Verificación inicial de números de serie y documentación.
* **Gestión de Fletes:** Registro y asignación de costos de envío para zonas cercanas.
* **Emisión de Comprobantes:** Generación de recibos digitales y órdenes de ingreso.

### 3. Mecánico / Técnico
* **Cola de Trabajo:** Tablero visual con equipos asignados según prioridad y complejidad.
* **Ficha Técnica de Diagnóstico:** Formulario para registrar fallas, horas de mano de obra y solicitar repuestos.
* **Gestión de Presupuestos:** Emisión preliminar de cotizaciones de reparación.

### 4. Administración / Dueño
* **Dashboard / Panel de Control:** Indicadores KPI, tiempos medios de reparación y reportes de rendimiento.
* **Administración de contratos:** Administración de liquidaciones con marcas por garantías.
* **Administración de Usuarios:** Gestión de roles y permisos del personal.

---

## Tecnologías Utilizadas

* **Librería Core:** React.js
* **Enrutamiento:** React Router DOM (Manejo de rutas públicas y protegidas por rol)
* **Gestión de Estado y Peticiones:** Context API
* **Estilos:** CSS3
* **Despliegue:** Despliegue en plataformas cloud como Vercel / Netlify / Render

---

## Estructura del Proyecto Frontend

```text
bahia-fix-client/
│
├── public/                  # Archivos estáticos e index.html
├── src/
│   ├── assets/              # Imágenes, íconos y estilos globales
│   ├── components/          # Componentes reutilizables (Botones, Modales, Tablas, Navbars)
│   ├── context/             # Contextos globales (AuthContext, Cart/ServiceContext)
│   ├── hooks/               # Custom Hooks (useAuth, useFetch, etc.)
│   ├── pages/               # Vistas principales organizadas por rol
│   │   ├── auth/            # Login, Registro, Recuperar Contraseña
│   │   ├── client/          # Mis Turnos, Mis Equipos, Aprobación Presupuesto
│   │   ├── reception/       # Ingreso Equipos, Validación Fletes
│   │   ├── tech/            # Cola de Taller, Diagnóstico
│   │   └── admin/           # Dashboard, Gestión Usuarios, Reportes
│   ├── routes/              # Configuración de React Router y medidas de Seguridad
│   ├── services/            # Clientes HTTP para comunicación con bahia-fix-api
│   └── utils/               # Funciones auxiliares
├── .env.example             # Plantilla de variables de entorno
├── package.json
└── README.md
```

---

## Instalación y Configuración Local

### Requisitos Previos
* Node.js (v18 o superior)
* npm o yarn
* Servidor Backend (`bahia-fix-api`) en ejecución

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Gianfruu/bahia-fix-client.git
cd bahia-fix-client
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. Ejecutar la Aplicación

```bash
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`.

---

## Integración con la API Backend

El frontend se comunica con la API REST (`bahia-fix-api`) mediante solicitudes HTTP autenticadas:

* **Autenticación:** Las solicitudes protegidas adjuntan el token JWT en el header:
  `Authorization: Bearer <TOKEN>`

---

## Funcionalidades frontend esperadas

### Autenticación y Perfil
- Formulario de Inicio de Sesión y Registro.
- Persistencia de sesión con LocalStorage/Cookies y JWT.
- Rutas protegidas según el perfil de usuario.

### Módulo de Clientes
- Calendario e interfaz para selección de turnos.
- Formulario de carga de comprobante de garantía (soporte para subida de imágenes/PDF).
- Vista interactiva de estado de la reparación.
- Modal de aprobación / rechazo de presupuesto.

### Módulo de Recepción y Taller
- Registro de ingreso rápido de maquinaria con código de seguimiento.
- Vista de cola de reparaciones para mecánicos.
- Formulario de diagnóstico y cálculo de costo de repuestos mas la mano de obra.
- Alta de orden de entrada para recepción.
- Asignación de logística y fletes para zonas cercanas.

### Módulo de Mecánicos y Taller
- Tablero de tareas para mecánicos.
- Creación de presupuestos y diagnósticos.
- Carga de repuestos y horas trabajadas.
- Notificación automática de cambio de estado de orden.

### Módulo Administrativo
- Gráficos interactivos de analítica (tiempos promedio, fallas más comunes).
- Panel general de facturación y liquidaciones de garantía.
- Gestión de catálogo de repuestos y stock.
- Tabla de gestión de usuarios y roles.