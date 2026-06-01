# Plataforma de Gestión de Comités Juveniles IMJUVE

Sistema web para el registro, consulta, edición y generación de actas de Comités Juveniles, con panel de administración de usuarios, dashboard de estadísticas y control de acceso por roles (RBAC).

---

## Requisitos del sistema

- **Node.js** v18 o superior
- **Navegador web** moderno (Chrome, Firefox, Edge)

---

## Usuarios precargados (contraseña: `0000`)

| Usuario   | Rol            | Estados asignados                        |
|-----------|----------------|------------------------------------------|
| ADMIN1    | Administrador  | Todos (control total)                    |
| ADMIN2    | Administrador  | Todos (control total)                    |
| TERRI1    | Territorial    | CDMX, México, Jalisco                    |
| TERRI2    | Territorial    | Nuevo León, Veracruz, Yucatán            |
| COORD1    | Coordinador    | Nuevo León                               |
| COORD2    | Coordinador    | Jalisco                                  |
| PROMO1    | Promotor       | Veracruz                                 |
| PROMO2    | Promotor       | Guanajuato                               |

---

## Roles del sistema

### Administrador
- Acceso total a toda la plataforma
- Registro, edición, eliminación de comités
- Dashboard y Estadísticas
- Gestión de usuarios (CRUD, importar CSV)
- Auditoría (bitácora de acciones)
- Botón **"Borrar todo"** en Historial de Actas
- Importar comités desde CSV

### Territorial
- Registro de comités en **cualquier estado**
- Edición y eliminación solo en sus estados asignados
- Dashboard y Estadísticas

### Coordinador
- Registro de comités solo en su estado asignado
- Edición de comités e integrantes (excepto eliminar integrantes)
- Consulta de comités
- Sin acceso a Dashboard ni Estadísticas

### Promotor
- Registro de comités solo en su estado asignado
- Visualización y descarga solo de actas que él mismo registró
- Sin acceso a Consulta, Dashboard, Estadísticas, ni Administración

---

## Instalación y ejecución

### 1. Clonar o copiar los archivos

```
git clone <repo> o copie la carpeta completa al servidor
```

### 2. Instalar dependencias

```bash
cd server
npm install
```

### 3. Poblar la base de datos (opcional, trae datos de ejemplo)

```bash
cd server
npx tsx src/seed.ts
```

### 4. Iniciar el servidor

```bash
cd server
PORT=3001 npx tsx src/index.ts
```

El servidor arranca en **http://localhost:3001** y sirve tanto la API como el frontend.

### Inicio rápido (Windows)

Ejecute **`iniciar-servidor.bat`** — instala dependencias, siembra datos e inicia el servidor automáticamente.

### Inicio rápido (Linux/Mac)

```bash
chmod +x start-server.sh
./start-server.sh
```

---

## Despliegue en producción

### Opción 1: Servidor VPS (DigitalOcean, AWS, Linode, etc.)

1. Copiar la carpeta completa al servidor
2. Instalar Node.js 18+ 
3. Construir el frontend:

```bash
cd client
npm install
npx vite build
```

4. Configurar variables de entorno:

```bash
export PORT=3001
export JWT_SECRET=su-clave-secreta-aqui
```

5. Iniciar con PM2 (recomendado):

```bash
cd server
npm install
npm install -g pm2
npx tsx src/seed.ts
pm2 start --name imjuve --interpreter tsx src/index.ts
pm2 save
pm2 startup
```

6. Configurar Nginx como proxy inverso:

```nginx
server {
    listen 80;
    server_name su-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}
```

7. (Opcional) SSL con Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d su-dominio.com
```

### Opción 2: Plataforma como servicio (Railway, Render, Fly.io)

1. Crear cuenta en la plataforma elegida
2. Conectar repositorio o subir archivos
3. Configurar:
   - **Build command:** `cd client && npm install && npx vite build`
   - **Start command:** `cd server && npm install && npx tsx src/index.ts`
   - **Root directory:** `server/`
   - **Port:** `3001`
4. Agregar variable de entorno: `JWT_SECRET=su-clave-secreta`

---

## Base de datos

La base de datos es SQLite (archivo `server/data/imjuve.db`). Se crea automáticamente al iniciar el servidor por primera vez.

### Contenido de la base precargada

| Tabla     | Registros |
|-----------|-----------|
| users     | 8 usuarios |
| comites   | 32 comités de prueba |
| integrantes | ~323 integrantes |
| audit_log | Historial de acciones |

### Base de datos vacía (producción real)

Para empezar desde cero, elimine el archivo `server/data/imjuve.db` y reinicie el servidor — las tablas se crearán automáticamente. Luego use la interfaz de Administración > Usuarios para crear los usuarios necesarios.

---

## Estructura del proyecto

```
├── client/                 # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # Componentes de la UI
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── api/            # Clientes HTTP
│   │   ├── lib/            # Utilidades (PDF, folio, imágenes)
│   │   └── data/           # Catálogos (estados, municipios)
│   └── dist/               # Frontend compilado (producción)
├── server/                 # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/         # Endpoints de la API
│   │   ├── middleware/     # Autenticación y autorización
│   │   ├── utils/          # Normalización de estados
│   │   ├── database.ts     # SQLite + migraciones
│   │   └── seed.ts         # Datos de prueba
│   └── data/               # Base de datos SQLite
├── README.md
├── iniciar-servidor.bat    # Inicio rápido Windows
└── start-server.sh         # Inicio rápido Linux/Mac
```

---

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite 8, Zustand, Recharts, html2canvas
- **Backend:** Express 4, TypeScript, SQL.js (SQLite), JWT, bcryptjs
- **Autenticación:** JWT con roles y estados asignados

---

## Licencia

Uso interno — IMJUVE (Instituto Mexicano de la Juventud)
