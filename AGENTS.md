# AGENTS.md

Guía para agentes que hagan cambios en este códigobase.

## Alcance
- Proyecto: `inventario-front`
- Tipo de app: frontend en JavaScript puro con Vite
- Sistema de módulos: ES modules (`"type": "module"`)
- Estilo de UI: custom elements, componentes guiados por DOM, clases de Bootstrap
- Acoplamiento con backend: el frontend puede llamar a un backend hermano en `../../back/inventario-server`

## Archivos de reglas actuales
- No se encontraron archivos en `.cursor/rules/`.
- No se encontró `.cursorrules`.
- No se encontró `.github/copilot-instructions.md`.

## Datos importantes del repositorio
- `package.json` define solo los scripts `dev` y `dev:full`.
- No hay un script de lint registrado en el repositorio.
- No hay un runner de pruebas automatizadas registrado en el repositorio.
- `vite.config.js` usa `base: './'` para rutas relativas de assets.
- `homepage` en `package.json` también está configurado como `./`.

## Instalación
```bash
npm install
```

## Ejecutar servidor de desarrollo
```bash
npm run dev
```

## Ejecutar frontend + backend juntos
```bash
npm run dev:full
```
- Esto inicia Vite y también intenta ejecutar el backend desde `../../back/inventario-server/index.js`.
- Úsalo solo si esa ruta del backend hermano existe en el workspace.

## Build
```bash
npx vite build
```
- No existe todavía un script `build`, así que usa la CLI de Vite directamente.
- El resultado del build debe seguir siendo compatible con GitHub Pages y rutas relativas.

## Lint
- Hoy no hay un comando de lint configurado.
- Si agregas linting, prefiere un script raíz `npm run lint` y mantenlo sin warnings para los archivos tocados.

## Pruebas
- Hoy no hay un framework de pruebas configurado.
- Si se agregan pruebas más adelante, expón un script raíz `npm test`.

## Ejecutar una sola prueba
- No está disponible con la herramienta actual porque no existe un runner de pruebas.
- Si agregas Vitest, prefiere comandos como `npx vitest run path/to/file.test.js -t "name"`.
- Si agregas Jest, prefiere `npx jest path/to/file.test.js -t "name"`.
- Los agentes deben apuntar al filtro más pequeño posible en vez de correr toda la suite.

## Estructura de archivos
- `src/main.js`: arranque de la aplicación y wiring de eventos.
- `src/components/`: custom elements y shells de UI.
- `src/services/`: API, storage, config y manejo de errores.
- `src/state/`: estado compartido y lógica del store.
- `src/utils/`: helpers puros y utilidades DOM.
- `service-worker.js`: comportamiento offline/caché.
- `config.json`: configuración de runtime/API.

## Estrategia de cambios
- Prefiere el cambio más pequeño que sea correcto.
- Conserva la arquitectura existente salvo que el cambio requiera refactorizar.
- No reviertas ni sobreescribas ediciones ajenas no relacionadas.
- Si el worktree está sucio, inspecciona con cuidado y cambia solo los archivos necesarios.

## Estilo de JavaScript
- Usa sintaxis de ES modules con imports y exports explícitos.
- Prefiere indentación de 2 espacios.
- Termina las sentencias con punto y coma.
- Usa comillas simples para strings nuevos cuando sea práctico.
- Mantén legibles los template strings HTML y alineados con el código cercano.
- Prefiere `const` por defecto; usa `let` solo cuando necesites reasignación.
- Evita `var`.
- Mantén las funciones pequeñas y enfocadas.

## Convenciones de nombres
- Usa `camelCase` para variables, funciones y métodos.
- Usa `PascalCase` para clases y custom elements.
- Usa `UPPER_SNAKE_CASE` solo para constantes reales.
- Respeta los patrones de nombres existentes: los archivos de componentes suelen usar `PascalCase.js`.
- Mantén consistencia entre español e inglés dentro de un mismo archivo; no mezcles estilos sin necesidad.

## Imports
- Agrupa imports por origen: primero externos, luego locales.
- Mantén rutas relativas explícitas, incluyendo la extensión `.js`.
- Elimina imports no usados inmediatamente.
- Prefiere importar desde el módulo más específico que posea el comportamiento.
- No introduzcas barrel files salvo que haya una razón clara de reutilización.

## Formato
- Respeta el estilo del archivo cercano en vez de reformatear todo el archivo.
- Conserva los saltos de línea existentes en los archivos que toques.
- Evita cambios ruidosos solo de espacios en blanco.
- Mantén compactos los objetos y listas de argumentos salvo que la legibilidad empeore.

## Tipos y estructuras de datos
- Este repositorio es JavaScript puro, no TypeScript.
- Documenta formas de objetos no obvias con comentarios breves o JSDoc cuando ayude.
- Protege el acceso a propiedades opcionales antes de llamar métodos de string.
- Convierte valores explícitamente al comparar números, años o booleanos.
- Mantén alineadas las estructuras de la API con `README.md` y `config.json`.

## DOM y UI
- Prefiere selectores acotados al componente cuando sea posible.
- Protege las búsquedas de DOM antes de agregar listeners o mutar nodos.
- Mantén la lógica del ciclo de vida de custom elements dentro de la clase del elemento.
- Evita duplicar selectores hardcodeados si una constante compartida es mejor.
- Usa helpers pequeños para actualizaciones repetidas del DOM.

## Estado
- Trata `libraryStore` como la fuente de verdad compartida para los datos filtrados.
- Usa actualizaciones del store en vez de mutar arrays compartidos desde varios sitios.
- Notifica a los listeners después de transiciones de estado que afecten la UI renderizada.
- Mantén derivadas las data derivadas; no la caches salvo que exista un problema real de rendimiento.

## Manejo de errores
- Encauza errores async/de servicio a `errorHandler` cuando sea posible.
- Re-lanza después de registrar si el caller todavía necesita reaccionar.
- Distingue fallos de red, API y validación en código nuevo de servicios.
- Evita tragarte excepciones silenciosamente.
- Agrega mensajes al usuario solo cuando el fallo afecte la UX.

## Async y fetching
- Prefiere `async`/`await` sobre cadenas de promesas en código nuevo.
- Limpia timeouts y abort controllers al completar con éxito.
- Mantén explícita y acotada la lógica de reintentos.
- Verifica el estado online antes de refrescos pesados en segundo plano cuando sea apropiado.

## Servicios
- Mantén la lógica de API/config/storage en `src/services/`.
- Conserva la separación entre acceso a datos y presentación.
- Centraliza el manejo de base URL y la normalización de slash final.
- No dupliques lógica de caché o versión de API en componentes.

## Utilidades
- Mantén los módulos de utilidades sin efectos secundarios, salvo que sean helpers DOM intencionales.
- Prefiere funciones puras para filtrado, formato y comparación.
- Nombra helpers por su comportamiento, no por su implementación.

## Comentarios y documentación
- Escribe comentarios para la intención, no para la sintaxis obvia.
- Elimina código comentado obsoleto cuando deje de ser útil.
- Mantén sincronizado lo que documenta el README con los scripts y el comportamiento real.
- Actualiza este archivo si se agregan nuevas herramientas o scripts.

## Trabajo en este repo
- Revisa `git status` antes de editar si el cambio puede chocar con trabajo existente.
- Mantén los cambios localizados en los archivos necesarios para la tarea.
- Verifica el comportamiento con el comando más acotado posible.
- Para problemas de build o runtime, inspecciona primero el servicio o utilitario relevante.
