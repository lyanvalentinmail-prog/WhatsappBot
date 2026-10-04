# 🤖 Bot de WhatsApp (Baileys + Node.js)

Bot de WhatsApp **modular**, **estable** y **fácil de personalizar**, pensado para
correr directamente desde **Termux (Android)** o desde cualquier servidor con
Node.js. Usa [Baileys](https://github.com/WhiskeySockets/Baileys) para
conectarse a WhatsApp (sin Selenium, sin Puppeteer, sin navegadores).

---

## 📂 Estructura del proyecto

```
bot-whatsapp/
│
├── index.js                 # Punto de entrada (arranque del bot)
├── config.js                 # Lectura centralizada de .env
├── .env.example               # Plantilla de configuración
├── package.json
│
├── src/
│   ├── connection/
│   │   ├── connect.js          # Conexión con WhatsApp (QR / Pairing Code)
│   │   └── session.js          # Guardado/borrado de la sesión
│   │
│   ├── handlers/
│   │   ├── messages.js         # Procesa cada mensaje entrante
│   │   ├── commands.js         # Carga automática de comandos/plugins
│   │   └── events.js           # Eventos de grupo (bienvenida/despedida)
│   │
│   ├── commands/                # Comandos organizados por categoría
│   │   ├── general/
│   │   ├── grupo/
│   │   ├── anime/
│   │   ├── ia/                   # .image (Hugging Face)
│   │   ├── juegos/
│   │   ├── herramientas/
│   │   └── owner/
│   │
│   ├── plugins/                 # Funcionalidades extra "plug & play"
│   │   ├── ai.js                 # .chatgpt .gemini .groq
│   │   ├── imagine.js            # .imagine
│   │   ├── stickers.js           # .sticker .toimg
│   │   └── downloader.js         # .youtube .tiktok .instagram ...
│   │
│   ├── config/
│   │   ├── bot.js               # Config general + lista de owners
│   │   ├── menu.js              # Estilo y categorías del menú
│   │   ├── messages.js          # Todos los textos del bot
│   │   └── api.js               # Endpoints de las APIs de IA
│   │
│   ├── utils/
│   │   ├── formatter.js         # Lectura de mensajes/medios de Baileys
│   │   ├── downloader.js        # Conversión a sticker (FFmpeg)
│   │   ├── api.js                # Llamadas a OpenAI / Gemini / Groq / etc
│   │   ├── helpers.js            # Funciones genéricas
│   │   ├── logger.js             # Logs en consola + logs/
│   │   └── banner.js             # Cajas ASCII bonitas en consola
│   │
│   └── database/
│       ├── jsonAdapter.js        # Guardado en archivo JSON
│       └── index.js              # API de alto nivel (usuarios, grupos...)
│
├── sessions/                   # Credenciales de WhatsApp (NO se sube a git)
├── media/                      # Imágenes, videos, audios y stickers temporales
└── logs/                       # Historial de logs (NO se sube a git)
```

---

## 🚀 Instalación en Termux

```bash
pkg update && pkg upgrade
pkg install nodejs git ffmpeg -y

git clone https://github.com/lyanvalentinmail-prog/WhatsappBot bot-whatsapp
cd bot-whatsapp
npm install
```

> `ffmpeg` es necesario para crear stickers (imagen/video → webp).

### Configurar el bot

```bash
cp .env.example .env
nano .env
```

Completa al menos:

- `BOT_NAME` → nombre de tu bot
- `BOT_OWNER` → tu nombre
- `DEVELOPER_NUMBER` → tu número de WhatsApp (con código de país, sin `+`)
- `BOT_PREFIX` → el prefijo de los comandos (por defecto `.`)

Guarda con `Ctrl + O`, `Enter`, y sal con `Ctrl + X`.

### Iniciar el bot

```bash
npm start
```

También puedes usar `npm run dev` durante el desarrollo: reinicia
automáticamente el proceso cada vez que guardas un archivo.

---

## 🔌 Métodos de conexión

La **primera vez** que inicias el bot (o si borraste la carpeta `sessions/`),
verás un menú:

```
╭─〔 CONEXIÓN 〕
│
│ 1. Conectar mediante QR
│ 2. Conectar mediante Pairing Code
│
╰──────────────
```

### Opción 1 — Código QR

1. Elige la opción `1`.
2. Abre WhatsApp en tu teléfono → **Ajustes → Dispositivos vinculados →
   Vincular un dispositivo**.
3. Escanea el código QR que aparece en la terminal.

### Opción 2 — Pairing Code (código de vinculación)

1. Elige la opción `2`.
2. Escribe tu número de WhatsApp con código de país (ejemplo: `598991234567`).
3. El bot mostrará un código como `ABCD-EFGH`.
4. En tu teléfono: **WhatsApp → Dispositivos vinculados → Vincular con
   número de teléfono** e introduce el código.

> 💡 Si quieres que el bot **siempre** use Pairing Code sin preguntar, pon en
> tu `.env`:
> ```
> USE_PAIRING_CODE=true
> PAIRING_NUMBER=598991234567
> ```

Una vez conectado, la sesión queda guardada en `sessions/`. Mientras esa
carpeta exista y sea válida, **no se volverá a pedir QR ni pairing code** al
reiniciar el bot.

Si WhatsApp cierra la sesión desde el teléfono (logout), el bot detecta el
error, borra la sesión inválida automáticamente y te pedirá vincular de
nuevo la próxima vez que lo inicies.

---

## ⚙️ Configuración (.env)

Todo el comportamiento del bot se controla desde `.env`, sin tocar código:

| Variable | Descripción |
|---|---|
| `BOT_NAME` | Nombre del bot (aparece en el menú y respuestas) |
| `BOT_OWNER` | Nombre del propietario |
| `BOT_PREFIX` | Prefijo de los comandos (`.`, `!`, `#`, `/`, etc) |
| `ALLOW_NO_PREFIX` | `true` para poder escribir comandos sin prefijo |
| `BOT_MODE` | `public` (todos pueden usarlo) o `private` (solo el owner) |
| `LANGUAGE` | Idioma de los mensajes (actualmente `es`) |
| `PAIRING_NUMBER` / `USE_PAIRING_CODE` | Configuración de conexión |
| `GROUP_LINK`, `DEVELOPER_NAME`, `DEVELOPER_NUMBER`, `GITHUB_REPO` | Datos que se muestran en el `.menu` |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` | Claves de IA (opcional) |
| `DOWNLOAD_API_URL`, `DOWNLOAD_API_KEY` | Tu propia API de descargas (opcional) |
| `DATABASE_DRIVER`, `DATABASE_URL` | Base de datos (JSON por defecto) |

**Nunca** se deben escribir claves/API keys directamente en el código: todas
se leen desde `.env` a través de `config.js`.

---

## 🧩 Sistema de comandos

Cada comando es un archivo `.js` dentro de `src/commands/<categoria>/` que
exporta por defecto un objeto:

```js
export default {
    name: "ping",
    aliases: ["p", "ms"],
    category: "general",
    description: "Muestra la latencia del bot",
    usage: ".ping",
    groupOnly: false,
    ownerOnly: false,
    adminOnly: false,
    privateOnly: false,
    botAdmin: false,
    async execute(ctx) {
        await ctx.reply("🏓 Pong!");
    }
};
```

### Objeto `ctx` disponible en cada comando

| Propiedad | Descripción |
|---|---|
| `ctx.sock` | Instancia de Baileys (para funciones avanzadas) |
| `ctx.msg` | Mensaje original de WhatsApp |
| `ctx.from` | JID del chat (grupo o privado) |
| `ctx.sender` | JID de quien envió el mensaje |
| `ctx.isGroup` / `ctx.isOwner` / `ctx.isAdmin` / `ctx.isBotAdmin` | Booleans de contexto |
| `ctx.args` | Arreglo de argumentos después del comando |
| `ctx.text` | Texto completo del mensaje |
| `ctx.mentions` | JIDs mencionados o citados |
| `ctx.quoted` | Mensaje citado (si existe) |
| `ctx.reply(texto\|objeto)` | Responde en el mismo chat (cita el mensaje original) |
| `ctx.react(emoji)` | Reacciona al mensaje con un emoji |

### Permisos disponibles

- `ownerOnly` → solo el propietario del bot
- `adminOnly` → solo administradores del grupo
- `groupOnly` → solo funciona en grupos
- `privateOnly` → solo funciona en chat privado
- `botAdmin` → requiere que el bot sea admin del grupo

### ➕ Cómo agregar un comando nuevo

1. Crea un archivo, por ejemplo `src/commands/general/saludo.js`.
2. Exporta el objeto del comando (como el ejemplo de arriba).
3. ¡Listo! Al reiniciar el bot, el comando se carga solo y aparece
   automáticamente en `.menu` dentro de su categoría. No hace falta tocar
   ningún otro archivo.

Un mismo archivo también puede exportar un **arreglo** de comandos si
quieres agrupar varios relacionados (mira `src/commands/anime/reactions.js`
como ejemplo).

---

## 🔌 Sistema de plugins

Los plugins viven en `src/plugins/` y se cargan exactamente igual que los
comandos (incluso pueden exportar un arreglo). Es el lugar recomendado para
funcionalidades "grandes" como IA, descargas o stickers.

Para crear un plugin nuevo, por ejemplo `src/plugins/clima.js`:

```js
export default {
    name: "clima",
    aliases: ["weather"],
    category: "herramientas",
    description: "Consulta el clima de una ciudad",
    usage: ".clima Montevideo",
    async execute(ctx) {
        // tu lógica aquí, usando src/utils/api.js si necesitas llamar APIs
    }
};
```

---

## 📜 Menú y categorías

El menú (`.menu`) se genera **automáticamente** a partir de todos los
comandos cargados, leyendo su `category`, `aliases` y `description`. El
diseño visual y el orden de las categorías se controla en
`src/config/menu.js`.

```
.menu                 -> menú completo
.menu ia               -> solo comandos de IA
.menu anime             -> solo comandos de anime
.menu grupo              -> solo comandos de grupo
.menu descargas           -> solo comandos de descargas
.menu herramientas         -> solo comandos de herramientas
.menu juegos                -> solo comandos de juegos
.menu owner                  -> solo comandos de propietario
```

Todos los textos usados por el bot (errores, permisos, esperas, etc.) están
centralizados en `src/config/messages.js` — edítalo para cambiar el idioma o
el tono de las respuestas.

### 🎨 Plantilla visual del menú

El menú sigue una plantilla de diseño fija (cabecera decorada, categorías
con carita `❀ ૮₍ ˃̵͈᷄ . ฅ ₎ა` y argumentos entre `<...>`). Se genera así:

```
─ ׁ ׅ  𝐇ᴏʟᴀ!, sᴏʏ *MiBot* (𝐌ᴜʟᴛɪ 𝐃ᴇᴠɪᴄᴇ) . 𐔌՞ ܸ.ˬ.ܸ՞𐦯
✎ ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ʟᴏs ᴄᴏᴍᴀɴᴅᴏs
...
- ≽ ^⎚ ˕ ⎚^ ≼ *`𝐆ᴇɴᴇʀᴀʟ`* ᰨᰍ    *;*
> ✐ ᴄᴏᴍᴀɴᴅᴏs ɢᴇɴᴇʀᴀʟᴇs ᴅᴇʟ ʙᴏᴛ

  ❀ ૮₍ ˃̵͈᷄ . ฅ ₎ა   ݁  .kick + <mention>
> ── ˚. ᵎᵎ ۠ ᴇxᴘᴜʟsᴀ ᴀ ᴜɴ ᴜsᴜᴀʀɪᴏ ᴅᴇʟ ɢʀᴜᴘᴏ.
```

Personalización disponible:

- `BOT_TYPE` (.env) → texto entre paréntesis junto al nombre del bot en la
  cabecera (ej: `Multi Device`, `Bot Oficial`, `V2`).
- Cada comando puede declarar `args: 'mention' | 'texto' | 'url' | 'numero' | 'opcion'`
  para que el menú muestre automáticamente `<mention>`, `<texto>`, `<url>`,
  `<número>` u `<opción>` junto al nombre del comando. Si no se declara,
  no se muestra ningún argumento (comandos sin parámetros, como `.ping`).
- Las respuestas de los comandos de IA (`.chatgpt`, `.gemini`, `.groq`,
  `.imagine`) usan el mismo estilo de carita: `≽(˵◝ ⩊  ◜˵ マ≼`.
- Los símbolos de estado son fijos en todo el bot: `⏳️` (procesando),
  `✅️` (listo) y `❌️` (error) — ver `src/config/messages.js`.

---

## 🧠 Inteligencia Artificial

El bot incluye una capa común en `src/utils/api.js` para hablar con
distintos proveedores de IA. Ya vienen implementados:

- `.chatgpt` (OpenAI) → requiere `OPENAI_API_KEY`
- `.gemini` (Google) → requiere `GEMINI_API_KEY`
- `.groq` (Llama ultrarrápido) → requiere `GROQ_API_KEY`
- `.imagine` (generación de imágenes con OpenAI) → requiere `OPENAI_API_KEY`

Para agregar un proveedor nuevo (Claude, DeepSeek, Mistral, OpenRouter...):

1. Agrega su endpoint en `src/config/api.js`.
2. Agrega una función `askNombre()` en `src/utils/api.js`.
3. Suma un comando en `src/plugins/ai.js` usando el mismo patrón.

### 🖼️ `.image` — generación de imágenes con Hugging Face (gratis, sin tarjeta)

`.image <descripción> | <estilo>` genera una imagen a partir de tu
descripción usando un modelo de [Hugging Face](https://huggingface.co)
(Stable Diffusion XL por defecto). Requiere un token gratuito:

1. Crea una cuenta gratis en <https://huggingface.co/join> (no pide tarjeta).
2. Generá un token en <https://huggingface.co/settings/tokens> (alcanza con permisos de lectura).
3. Pegalo en tu `.env` como `HUGGINGFACE_API_KEY=hf_...`.

```
.image un gato astronauta pintando un cuadro | painted-anime
.image un paisaje de montaña          (usa el estilo "No style" por defecto)
.image estilos                        (lista los Art styles disponibles)
```

Art styles disponibles (`src/config/imageStyles.js`): **No style**,
**Painted Anime**, Cinematic, Traditional Japanese, Casual Photo,
Digital Painting y Concept Art. Se pueden escribir en minúsculas, con o
sin tildes/guiones (ej: `anime`, `Painted Anime` y `painted-anime` son
equivalentes).

El modelo usado se puede cambiar sin tocar código con
`HUGGINGFACE_IMAGE_MODEL` en `.env` (cualquier modelo de
"text-to-image" público del Hub de Hugging Face).

---

## 📥 Descargas (YouTube, TikTok, Instagram, Mediafire)

El bot **no trae ninguna API de terceros fija**. En su lugar, define un
contrato simple en `src/utils/api.js` (`fetchDownload`) que llama a la API
que tú configures en `DOWNLOAD_API_URL`:

```
GET {DOWNLOAD_API_URL}/<servicio>?url=<enlace>
```

Y espera una respuesta JSON como:

```json
{ "url": "https://enlace-directo-al-archivo", "title": "Nombre opcional" }
```

Si no configuras `DOWNLOAD_API_URL`, los comandos de descarga avisan
claramente al usuario en vez de fallar en silencio.

---

## 🖼️ Stickers

- `.sticker` o `.s` respondiendo a una imagen o video corto → crea un
  sticker (usa FFmpeg internamente).
- `.toimg` respondiendo a un sticker → lo convierte de vuelta en imagen.

Requiere tener `ffmpeg` instalado (`pkg install ffmpeg` en Termux).

---

## 🗄️ Base de datos

Por defecto el bot usa un archivo JSON (`src/database/storage/database.json`)
sin dependencias nativas, ideal para Termux. Guarda:

- Usuarios y su cantidad de mensajes
- Configuración por grupo (bienvenida, despedida, mute, etc.)
- Advertencias (`warn` / `unwarn`)
- Usuarios bloqueados

Toda la lógica de acceso está en `src/database/index.js`. Si en el futuro
quieres migrar a SQLite u otra base de datos, solo necesitas reemplazar
`src/database/jsonAdapter.js` manteniendo las mismas funciones exportadas:
el resto del bot no se entera del cambio.

---

## 🛠️ Solución de problemas comunes

| Problema | Solución |
|---|---|
| El QR no se ve bien en Termux | Agranda la fuente de la terminal o usa modo horizontal |
| "No se pudo crear el sticker" | Verifica que `ffmpeg` esté instalado: `ffmpeg -version` |
| El bot pide QR cada vez que reinicio | La sesión se cerró o se corrompió; borra `sessions/` y vuelve a vincular |
| "OPENAI_API_KEY no configurada" | Agrega la clave correspondiente en tu `.env` y reinicia |
| El bot no responde en grupos | Verifica que el número usado en `DEVELOPER_NUMBER`/owner sea correcto y que el bot no esté en `BOT_MODE=private` |
| Error de permisos en Termux | Ejecuta `termux-setup-storage` y vuelve a intentar |
| El proceso se cierra solo | Revisa `logs/` para ver el error exacto; los errores de comandos ya no cierran el bot, pero errores de conexión se reintentan automáticamente |
| El bot conecta pero no responde a ningún comando | Si vinculaste el bot con **tu propio número** (lo más común en Termux) y le escribes desde ese mismo número (a ti mismo o en un grupo), el bot SÍ te responde: estos mensajes se procesan igual que cualquier otro. Revisa que el prefijo que escribes coincida con `BOT_PREFIX` del `.env`, y activa `DEBUG=true` para ver en consola/`logs/` cada mensaje recibido y si el comando fue encontrado |

---

## 🔐 Seguridad

- `.env`, `sessions/` y `logs/` están excluidos de Git (`.gitignore`).
- Las API keys nunca se escriben en el código fuente.
- Los logs sanitizan automáticamente cualquier posible token/API key antes
  de guardarse en disco.
- Los errores de un comando se capturan individualmente: un comando roto
  nunca tumba el bot completo.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Ver [LICENSE](LICENSE).
