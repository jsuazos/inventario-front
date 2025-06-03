
# 🎵 Inventario Musical - jsuazos.github.io

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

## 📦 Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/jsuazos/inventario-front.git
   ```

2. Abre el proyecto en tu editor de código.

3. Asegúrate de tener los archivos de íconos y `manifest.json` en la raíz del proyecto.

4. ¡Listo! Puedes desplegarlo directamente en GitHub Pages.


---

## 🗂️ Estructura de archivos

```
inventario-front/
├── index.html         # Página principal
├── style.css          # Estilos personalizados
├── js/
│   └── scripts.js     # Funciones para búsqueda y scroll por letra
├── assets/
│   └── img/           # Carátulas y gráficos
└── README.md          # Descripción del proyecto (este archivo)
```

---

## 🚀 Cómo usar / contribuir

1. Clona el repositorio:
   ```bash
   git clone https://github.com/jsuazos/inventario-front.git
   ```
2. Abre `index.html` en tu navegador.
3. Edita el contenido directamente en HTML, o extiende la lógica en JS.
4. Haz tus mejoras, y si deseas contribuir, crea un Pull Request.

---

## 📌 Pendientes / mejoras futuras

- [x] Filtro dinámico por género desde el menú lateral.
- [x] Integración con APIs externas (Discogs, MusicBrainz, Fanart.tv).
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
