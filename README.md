# 🎉 Quiniela Familia · Mundial 2026

## 🆕 Últimos cambios (esta ronda)

- **Tabla + Estadísticas fusionadas** en una sola pestaña "Tabla": ya no hay
  contenido repetido. Arriba hay KPIs (líder, mejor precisión, mejor racha,
  rey del empate, partidos jugados) y abajo una sola tabla con todas las
  columnas (antes eran dos tablas separadas).
- **Bracket clickeable**: cada cruce (incluido el centro/Final) ahora se
  puede clickear. Si el partido ya se jugó, muestra marcador, goleadores,
  cómo se decidió (tiempo extra/penales), sede del partido y quién de la
  familia le atinó. Si todavía no se juega, muestra una **probabilidad
  casera** de quién avanza, calculada con los partidos que ya tenés
  sincronizados (puntos y diferencia de gol por partido en el torneo) — sin
  depender de ninguna API de pago.
  > Nota: se evaluó usar API-Football para probabilidades "reales", pero su
  > plan gratuito no cubre datos de la temporada/torneo del Mundial 2026, así
  > que se optó por este modelo casero con datos que ya tenés gratis.
- **Sede del partido**: el sincronizador ahora también guarda el estadio
  (`ground`) que ya venía gratis en el JSON de openfootball y no se estaba
  usando.
- **KPI en "Mi quiniela"**: 🚀 Puntos en juego — el techo de puntos que
  todavía podés ganar si le atinás a todo lo que falta, más un aviso si te
  quedan partidos sin pronosticar.
- **KPIs en "Comparar"**: 🐑 % de coincidencia con el consenso del grupo y
  🎲 cuántos "picks contrarian" llevás — además, cada tarjeta de partido
  marca con una etiqueta cuando tu pronóstico le fue en contra al grupo.
- **KPIs en "Admin"**: panel de salud de datos — resultados pendientes de
  capturar, quinielas incompletas (con nombres), partidos por bloquearse en
  menos de 3h, y el total de partidos/participantes. Así ya no hay que
  revisar partido por partido a mano.
- **Área de toque más grande en el bracket (móvil)**: los círculos del
  bracket se ven igual que antes, pero ahora responden al tacto en un área
  bastante más grande alrededor de cada uno — en pantallas de celular los
  nodos visuales miden apenas ~10-15px, muy chico para el dedo.
- **La app ahora es instalable (PWA)**: se agregó `manifest.json`, `sw.js`
  (service worker) e íconos (`icon-192.png`, `icon-512.png`,
  `icon-512-maskable.png`, `apple-touch-icon.png`), todos con el trofeo y los
  colores de marca. Con esto el teléfono ofrece "Instalar" / "Agregar a
  inicio" y la app abre en pantalla completa, con su propio ícono, como una
  app normal — ver la sección **"Instalarla en el teléfono"** más abajo.

---

## 📱 Instalarla en el teléfono (PWA)

Esto **no es una app nueva que subir a una tienda** — es la misma página web
de siempre, pero ahora cumple los requisitos técnicos para que el teléfono la
deje "instalar" con ícono propio y sin la barra del navegador.

**Android (Chrome):**
1. Abrí el link de la quiniela en Chrome.
2. Va a aparecer un botón "Instalar app" solo, o desde el menú ⋮ → **"Instalar app"** / **"Agregar a pantalla de inicio"**.
3. Listo — queda un ícono como cualquier otra app, y abre en pantalla completa.

**iPhone (Safari):**
- iOS **no muestra un botón automático** — hay que hacerlo a mano, siempre:
  1. Abrí el link en **Safari** (tiene que ser Safari, no Chrome — en iOS todos los navegadores usan el motor de Safari pero solo Safari puede agregar a inicio).
  2. Tocá el ícono de compartir (el cuadrito con la flecha hacia arriba).
  3. Buscá **"Agregar a pantalla de inicio"**.

**Después de subir estos cambios**, si alguien de la familia ya tenía la
página guardada como acceso directo desde antes, puede que tenga que
borrarla y volver a agregarla una vez para que tome el ícono y el modo
pantalla-completa nuevos.

> Nota técnica: los datos de la quiniela siguen viviendo en Firestore y
> necesitan internet para estar al día — esto no la vuelve una app 100%
> offline, solo hace que abra como una app instalada en vez de una pestaña
> del navegador.

Versión **súper-mejorada** de tu quiniela: toma el motor más avanzado de
`quiniela-2026`, le corrige un par de detalles finos, le agrega funciones
nuevas, y le pone una identidad visual completamente nueva desde el login.

Tu Firebase ya viene configurado (es el mismo proyecto `quiniela-familia-2026`
que ya usabas), así que **no necesitas tocar nada de Firebase** — solo sube
los archivos y listo.

---

## Qué cambió respecto a tu quiniela_familia anterior

### 1. Motor de quiniela (lógica), verificado y con arreglos
- **Zonas horarias**: todo se guarda en UTC y se muestra siempre en hora de
  Guatemala (UTC‑6, sin horario de verano) — esto ya estaba bien en
  `quiniela-2026` y se mantiene igual.
- **Bracket nuevo**: el bracket radial animado de `quiniela-2026` (con
  banderas, iluminación de rondas y campeón) ahora vive aquí también.
- **Goleadores**: se muestran debajo de cada partido jugado (nombre + minuto),
  importados automáticamente de la fuente de datos.
- **Penales**: si un partido termina en empate, el admin puede capturar el
  marcador de penales; el bracket y la tabla usan correctamente al ganador de
  penales para avanzar de ronda.
- **Puntos cuando aciertas el ganador por penales**: si predijiste que un
  equipo iba a ganar y el partido terminó empatado pero ese equipo ganó en
  penales, **sí se te suman los puntos de "ganador acertado"**, como si
  hubieras acertado el resultado. Esto ya funcionaba bien en `quiniela-2026`
  y quedó verificado con pruebas manuales.
- **Arreglo**: la ventana de "partido en vivo" se extendía solo 2 horas, lo
  cual podía marcar un partido de eliminación directa como "Final" antes de
  que terminaran el tiempo extra y los penales. Ahora la ventana es de 2h40.
- **Función nueva — pronóstico de penales**: si tu pronóstico es un empate,
  te aparece una opción para elegir quién crees que avanza en penales. Si
  aciertas, ganas **+1 punto extra** (además de tus puntos por acertar el
  empate reglamentario). Esto no existía en ninguna de las dos versiones
  anteriores.
- **Auditoría de horarios**: herramienta de admin (traída de tu
  `quiniela_familia` original) que compara cada partido guardado contra la
  fuente oficial y te deja corregir uno por uno, además del botón de
  sincronización completa.

### 2. Look and feel — rediseño completo, desde el login
- Nueva identidad "boleto de lotería familiar": tipografía cálida (Fraunces +
  Manrope + JetBrains Mono para los marcadores), paleta marigold/berry en vez
  del azul de estadio genérico, y un listón de papel picado animado en el
  login.
- El bracket mantiene su ambiente de "noche de estadio" (fondo oscuro), que
  es el único lugar donde ese contraste se conserva a propósito — el resto de
  la app es cálido y de día.
- Mismo diseño responsivo: barra de pestañas se vuelve navegación inferior en
  celular.
- **Sin mascota** — se quitó por completo el video/canvas de la mascota (y
  los 3 archivos .mp4/.webm pesados que la acompañaban), tal como pediste.

### 3. Fuente de datos — más simple, sin llave obligatoria
- El botón **Sincronizar** en Admin trae calendario, resultados, goleadores y
  penales gratis desde openfootball — no requiere ninguna API key.
- Si además quieres marcador en vivo minuto a minuto (no solo al finalizar el
  partido), puedes conectar opcionalmente una API key gratuita de
  API-Football desde Admin → "Marcador en vivo (opcional)". Se guarda solo en
  tu navegador y las llamadas pasan por `/api/resultados` (función serverless
  en `api/`) para que la key nunca quede expuesta en el código fuente — a
  diferencia de `quiniela-2026`, donde la key quedaba escrita en texto plano
  en `app.js`.

---

## Publicar los cambios

1. Sube estos archivos a tu repositorio de GitHub existente (los mismos que
   ya tenías: `index.html`, `style.css`, `app.js`, y ahora también la carpeta
   `api/` y `vercel.json` si no la tenías ya).
2. Vercel vuelve a desplegar automáticamente en cuanto detecta el cambio.
3. Ya no hace falta ningún truco de "primer usuario" — tus usuarios y PINs
   existentes siguen ahí porque los datos viven en Firestore, no en el
   código.

---

## Estructura de archivos

```
quiniela_familia/
├── index.html         — estructura de la página (nuevo diseño)
├── style.css           — identidad visual nueva, completa
├── app.js               — motor de quiniela + funciones nuevas
├── api/resultados.js  — proxy serverless opcional para marcador en vivo
├── vercel.json          — configuración de rutas para el proxy
└── README.md            — esta guía
```
