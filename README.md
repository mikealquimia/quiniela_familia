# 🎉 Quiniela Familia · Mundial 2026

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
