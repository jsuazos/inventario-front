
# 🎵 Inventario Musical - [inventario-front](https://jsuazos.github.io/inventario-front)

Este proyecto es una aplicación web para gestionar un inventario musical, similar a plataformas como Spotify o Tidal. Está desarrollada con tecnologías modernas y ahora incluye características de Progressive Web App (PWA) para una mejor experiencia de usuario.
Está desarrollado principalmente con **HTML**, **CSS (Bootstrap)** y **JavaScript**, y está desplegado en **GitHub Pages**.

🔗 **Demo en vivo:**  
https://jsuazos.github.io/inventario-front/

---

## ✨ Características

- 🎨 **Diseño moderno** tipo tarjeta (card) con portadas de álbumes.
- 🔍 **Buscador en tiempo real** que filtra los discos mostrados.
- 📚 **Índice alfabético interactivo**:
  - Vertical en escritorio.
  - Horizontal fijo al pie en móviles.
  - Permite saltar rápidamente a artistas por letra.
- 🎧 Filtros por género musical (estructura en desarrollo).
- 📱 Totalmente **responsive** (adaptado para escritorio y móviles).
- 💡 Pensado para expandirse como catálogo, colección o vitrina musical personal.
- **Soporte PWA**: La aplicación ahora puede instalarse en dispositivos móviles y de escritorio, funcionando incluso sin conexión a internet.
- 🔄 **Actualización automática en segundo plano**: La app verifica automáticamente si hay cambios en la biblioteca cada vez que el usuario ingresa, actualizando la UI sin interrumpir la navegación actual.
- 👁️ **Filtrado por visibilidad**: Solo muestra registros donde `Visible == "SI"` según la API.

---

## 📱 Progressive Web App (PWA)

La aplicación ha sido configurada como una PWA, lo que permite:

- Instalación en dispositivos móviles y de escritorio.
- Funcionamiento sin conexión a internet.
- Experiencia tipo aplicación con pantalla completa y sin barra de navegación del navegador.


### Archivos clave:

- `manifest.json`: Define el nombre de la app, colores, íconos y comportamiento.
- `music_icon_192.png` y `music_icon_512.png`: Íconos utilizados por la PWA.

Asegúrate de tener en tu archivo `index.html` la siguiente línea dentro del `<head>`:

```html
<link rel="manifest" href="manifest.json">
```

Y también:

```html
<meta name="theme-color" content="#000000">
```

## 📦 Instalación y desarrollo local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/jsuazos/inventario-front.git
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Ejecuta el servidor de desarrollo (Vite):
   ```bash
   npm run dev
   ```

4. Abre tu navegador en la URL que indique Vite (por defecto `http://localhost:5173`).

> ⚠️ Si necesitas levantar el backend local para desarrollo completo, usa:
> ```bash
> npm run dev:full
> ```
> Este comando intenta iniciar el servidor de frontend y el backend juntos (requiere el backend en `../..` según la configuración actual).


---

## 🔧 Configuración de API

La aplicación usa `config.json` para definir la URL de la API y otros ajustes de entorno.

- **Archivo**: `config.json`
- **Sección clave**: `entornos.local.apiUrl` / `entornos.produccion.apiUrl`.

Ejemplo:
```json
{
  "entornos": {
    "local": {
      "apiUrl": "https://inventario-server-pw1j.onrender.com/api"
    },
    "produccion": {
      "apiUrl": "https://inventario-server-pw1j.onrender.com/api"
    }
  }
}
```

La app detecta automáticamente si está corriendo en `localhost` para elegir el entorno.

### 📊 Formato de datos esperado

La API debe devolver datos en el siguiente formato:

```json
{
  "data": [
    {
      "Artista": "Nombre del Artista",
      "Disco": "Nombre del Álbum", 
      "Año": 2023,
      "Tipo": "CD|VINYL|DIGITAL",
      "Genero": "Rock|Pop|Jazz",
      "Visible": "SI"
    }
  ]
}
```

**Campo `Visible`**: Solo se muestran los registros donde `Visible == "SI"`. Los registros con cualquier otro valor (o sin este campo) serán filtrados automáticamente.

---

## 🗂️ Estructura de archivos (actualizada)

```
inventario-front/
├── index.html                      # Entrada principal
├── manifest.json                   # Configuración PWA
├── service-worker.js               # Service Worker (caché + offline)
├── config.json                     # Configuración de entornos / API
├── package.json                    # Dependencias y scripts
├── src/
│   ├── main.js                     # Punto de entrada del frontend
│   ├── components/                 # Web Components reutilizables
│   ├── services/                   # Lógica de datos / API
│   ├── state/                      # Estado global (store)
│   ├── styles/                     # Estilos compartidos
│   └── utils/                      # Helpers y utilidades
└── public/
    └── img/                       # Íconos y assets estáticos
```

---

## 🤖 Rate limiting y manejo de APIs externas

Para evitar errores `429 Too Many Requests` con APIs como Discogs, MusicBrainz y Fanart.tv, el proyecto incorpora:

- **Rate limiter** en las llamadas a APIs externas (1 solicitud cada 2 segundos para evitar bloqueos).
- **Timeouts** (5s) para evitar que la UI se quede pendiente indefinidamente.
- **Fallbacks visuales** cuando no hay imagen disponible (evita usar imágenes de Discogs cuando generan 429).

Estas mejoras se encuentran principalmente en `src/services/artistService.js` y en `service-worker.js`.

## 🔄 Actualización automática en segundo plano

La aplicación incluye un sistema inteligente de actualización automática que:

- **Verifica cambios automáticamente** cada vez que el usuario ingresa a la aplicación.
- **No interrumpe la navegación** actual si ya tienes datos guardados localmente.
- **Compara datos completos** para detectar cambios reales (no solo actualiza por checksum simple).
- **Muestra notificaciones discretas** en la esquina inferior derecha:
  - 🔄 "Buscando actualizaciones en segundo plano..." (mientras verifica)
  - ✅ "Biblioteca actualizada con los últimos cambios" (si hay actualizaciones)
  - 📋 "No hay cambios disponibles" (si no hay cambios)
- **Actualiza la UI automáticamente** cuando detecta cambios en la API.

Esta funcionalidad asegura que siempre tengas la información más actualizada sin necesidad de recargar la página manualmente.

---

## 📌 Pendientes / mejoras futuras

- [x] Filtro dinámico por género desde el menú lateral.
- [x] Integración con APIs externas (Discogs, MusicBrainz, Fanart.tv).
- [x] Actualización automática en segundo plano de la biblioteca.
- [x] Filtrado por visibilidad (Visible == "SI").
- [ ] Visualización por álbum, artista o formato.
- [ ] Reproducción de previews (si se integra Spotify API).
- [ ] Guardar favoritos localmente o vía backend.
- [ ] Crear login para realizar modificaciones.
- [ ] Permitir agregar discos desde el sitio.
- [x] Convertir a PWA

---

## 🧑‍💻 Autor

**Javier Suazo**  
https://github.com/jsuazos

---

## 🖼️ Licencia

Este proyecto es de uso personal y educativo. Puedes adaptarlo o inspirarte libremente, dando el crédito correspondiente.
