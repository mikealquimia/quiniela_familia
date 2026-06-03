# 🏆 Quiniela Mundial 2026

Aplicación web para llevar la quiniela de tu empresa. Todos comparten los mismos datos en tiempo real.

---

## Paso 1 — Crear base de datos gratuita en Firebase

Los datos de todos los participantes se guardan en Firebase (gratis, de Google).

1. Ve a https://console.firebase.google.com
2. Haz clic en **"Agregar proyecto"**
3. Nombre del proyecto: `quiniela-2026` (o el que quieras)
4. Desactiva Google Analytics (no es necesario) → **Crear proyecto**
5. En el menú izquierdo ve a **Firestore Database** → **Crear base de datos**
   - Elige **"Comenzar en modo de prueba"** → Siguiente → Selecciona tu región → Listo
6. En el menú izquierdo ve a **Configuración del proyecto** (ícono de engranaje ⚙️)
7. Baja hasta **"Tus apps"** → clic en el ícono **`</>`** (web)
8. Registra la app con el nombre `quiniela-web` → **Registrar app**
9. Copia el objeto `firebaseConfig` que aparece, se ve así:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "quiniela-2026.firebaseapp.com",
  projectId: "quiniela-2026",
  storageBucket: "quiniela-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Paso 2 — Pegar tu config en el código

Abre el archivo `app.js` y busca la sección al inicio:

```js
const FIREBASE_CONFIG = {
  apiKey: "REEMPLAZA_ESTO",
  ...
};
```

Reemplaza **cada valor** con los que copiaste de Firebase. Guarda el archivo.

---

## Paso 3 — Subir a GitHub

1. Ve a https://github.com → **"New repository"**
2. Nombre: `quiniela-2026` → **Create repository**
3. Sube los 3 archivos: `index.html`, `style.css`, `app.js`
   - Clic en **"uploading an existing file"**
   - Arrastra los 3 archivos → **Commit changes**

---

## Paso 4 — Publicar en Vercel (gratis)

1. Ve a https://vercel.com → **"Sign up"** con tu cuenta de GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repositorio `quiniela-2026` → **Deploy**
4. ¡Listo! En 30 segundos tendrás una URL tipo `quiniela-2026.vercel.app`

Comparte esa URL con todos tus compañeros y ya pueden entrar desde cualquier computadora o celular.

---

## Paso 5 — Primer uso

1. Entra a la app con la URL de Vercel
2. Como no hay usuarios todavía, primero necesitas crearte como admin.
   - **Truco para el primer usuario:** abre `app.js`, busca la función `initFirebase()` y agrega esto al final antes del cierre `}`:
   ```js
   // Solo para el primer usuario — borra esto después
   // Descomenta la línea de abajo, guarda, sube el archivo, entra a la app, luego bórrala
   // state.users.push({ id: 'admin1', name: 'TuNombre', isAdmin: true }); await saveState();
   ```
   - O más fácil: en la consola del navegador (F12 → Console) pega:
   ```js
   // Abre la consola en la página de la quiniela y pega esto:
   state.users.push({ id: 'admin1', name: 'TuNombre', isAdmin: true });
   saveState().then(() => location.reload());
   ```
3. Recarga la página, selecciona tu nombre, entra y desde el panel **Admin** agrega a todos.

---

## Actualizar la app

Si haces cambios al código, sube los archivos modificados a GitHub y Vercel los publica automáticamente.

---

## Estructura de archivos

```
quiniela/
├── index.html   — estructura de la página
├── style.css    — estilos y diseño
├── app.js       — lógica y conexión a Firebase
└── README.md    — esta guía
```
