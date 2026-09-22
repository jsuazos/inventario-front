# Inventario Musical — Frontend

Aplicación web progresiva para administrar una colección musical personal. Permite consultar y filtrar discos, gestionar el inventario y una wishlist, y sincronizar los datos con el backend del proyecto.

Demo: <https://jsuazos.github.io/inventario-front/>

## Funcionalidades

- Biblioteca privada por usuario, con búsqueda y filtros por artista, género, año, tipo y estado de recepción.
- Inicio de sesión y registro para gestionar el inventario.
- Crear, editar, marcar como recibido y ocultar discos.
- Deshacer el ocultamiento de un disco y restaurar discos desde la vista **Discos ocultos**.
- Wishlist personal con estados, edición y opción de mover un disco al inventario.
- Integración con Discogs, datos de artistas y portadas cuando están disponibles.
- Caché local separada por usuario mediante IndexedDB y actualización en segundo plano.
- Notificaciones push opcionales y soporte PWA para instalación y uso con conectividad limitada.
- Interfaz adaptable para escritorio y dispositivos móviles.

Los discos visibles son los únicos que se muestran en la biblioteca principal. Los ocultos siguen siendo recuperables desde `#ocultos` después de iniciar sesión.

## Requisitos

- Node.js 18 o superior.
- El backend `inventario-server` en ejecución y configurado.

## Desarrollo local

Instala las dependencias:

```bash
npm install
```

Inicia solo el frontend:

```bash
npm run dev
```

Para iniciar frontend y backend juntos, con el backend como proyecto hermano:

```bash
npm run dev:full
```

Vite indicará la URL local, habitualmente `http://localhost:5173`.

## Validación

```bash
npm run lint
npm test
npm run build
```

El último comando genera la versión de producción en `dist/`.

## Configuración de la API

La URL del backend se configura en `config.json`. La aplicación selecciona el entorno local al ejecutarse en `localhost` y, en otro caso, el entorno de producción.

```json
{
  "entornos": {
    "local": {
      "apiUrl": "http://localhost:3000/api"
    },
    "produccion": {
      "apiUrl": "https://tu-servidor.example/api"
    }
  }
}
```

No incluyas secretos en este repositorio. Las credenciales y los tokens pertenecen a la configuración del backend.

## Estructura

```text
inventario-front/
├── src/
│   ├── components/  # Custom elements de la interfaz
│   ├── services/    # API, caché, autenticación y proveedores externos
│   ├── state/       # Estado compartido de biblioteca y wishlist
│   ├── utils/       # Renderizado, filtros y utilidades
│   └── main.js      # Arranque y rutas de la aplicación
├── service-worker.js
├── manifest.json
├── config.json
└── vite.config.js
```

## Rutas de la interfaz

- `#biblioteca`: colección visible del usuario.
- `#wishlist/me`: wishlist del usuario autenticado.
- `#ocultos`: discos ocultos, disponibles para restaurar.

## PWA

La app usa `manifest.json` y `service-worker.js` para poder instalarse. La primera carga y las funciones que consultan servicios externos requieren conexión; la caché permite mantener disponibles los datos guardados localmente.

## Backend y documentación

Consulta los endpoints, autenticación y variables de entorno en el [README del backend](../inventario-server/README.md).

## Licencia

Proyecto de uso personal y educativo.
