/**
 * src/config/menu.js
 * -----------------------------------------------------------------------
 * Configuración visual del menú (.menu). Aquí se define el orden de las
 * categorías, sus nombres "bonitos", sus descripciones y los textos de
 * cabecera/pie, siguiendo EXACTAMENTE la plantilla de diseño pedida.
 *
 * El contenido real de los comandos NO está escrito aquí: se genera
 * automáticamente leyendo los comandos cargados por el CommandHandler
 * (ver src/handlers/commands.js). Si agregas un archivo nuevo dentro de
 * src/commands/, aparecerá solo en su categoría sin tocar este archivo.
 * -----------------------------------------------------------------------
 */

/**
 * Orden, nombre y descripción de cada categoría.
 * La "key" debe coincidir con el campo "category" usado en los comandos.
 */
export const categories = {
    general: {
        label: 'General',
        emoji: '✎',
        order: 1,
        description: 'Comandos generales del bot'
    },
    grupo: {
        label: 'Grupo',
        emoji: '👥',
        order: 2,
        description: 'Comandos para administrar el grupo'
    },
    anime: {
        label: 'Anime',
        emoji: '❀',
        order: 3,
        description: 'Comandos de reacciones de anime'
    },
    ia: {
        label: 'IA',
        emoji: '🤖',
        order: 4,
        description: 'Habla con inteligencia artificial'
    },
    descargas: {
        label: 'Descargas',
        emoji: '📥',
        order: 5,
        description: 'Descarga contenido multimedia de internet'
    },
    herramientas: {
        label: 'Herramientas',
        emoji: '🛠️',
        order: 6,
        description: 'Utilidades variadas para el día a día'
    },
    juegos: {
        label: 'Juegos',
        emoji: '🎮',
        order: 7,
        description: 'Minijuegos para divertirte'
    },
    owner: {
        label: 'Propietario',
        emoji: '👑',
        order: 8,
        description: 'Comandos exclusivos del propietario del bot'
    }
};

/** Convierte texto normal a "pseudo smallcaps" como en el diseño pedido */
const smallCapsMap = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
    // Vocales acentuadas: el alfabeto "small caps" no tiene glifos propios,
    // así que se arma combinando la letra base con el acento (combining mark).
    á: 'ᴀ\u0301', é: 'ᴇ\u0301', í: 'ɪ\u0301', ó: 'ᴏ\u0301', ú: 'ᴜ\u0301',
    ñ: 'ɴ\u0303', ü: 'ᴜ\u0308'
};

export const toSmallCaps = (text = '') =>
    text
        .toLowerCase()
        .split('')
        .map((ch) => smallCapsMap[ch] || ch)
        .join('');

/**
 * Alfabeto "bold serif" (𝐀-𝐙) usado para la primera letra de cada palabra.
 * IMPORTANTE: estos caracteres están fuera del plano BMP de Unicode (cada
 * uno ocupa un par subrogado de 2 code units), por lo que hay que separar
 * la cadena con el operador spread (que sí recorre por code point) y NO
 * con ".split('')" (que la rompería a la mitad y generaría caracteres
 * inválidos, visibles como "�").
 */
const boldCapitals = [...'𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'];
const boldMap = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
    boldMap[c] = boldCapitals[i];
});

/**
 * Da estilo "𝐍ᴏᴍʙʀᴇ" a un texto: primera letra de cada palabra en bold
 * serif y el resto en smallcaps. Es el estilo usado en toda la plantilla
 * del menú (𝐇ᴏʟᴀ!, 𝐄ɴʟᴀᴄᴇ, 𝐃ᴇᴠᴇʟᴏᴘᴇʀ, nombres de categorías, etc).
 *
 * Caso especial: si una palabra es un acrónimo corto en mayúsculas (ej:
 * "IA"), se pone TODA en bold en vez de solo la primera letra, para que
 * quede "𝐈𝐀" y no "𝐈ᴀ".
 */
export const toStyledTitle = (text = '') =>
    text
        .split(' ')
        .map((word) => {
            if (!word) return word;

            const isAcronym = word.length <= 4 && word === word.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(word);
            if (isAcronym) {
                return word
                    .split('')
                    .map((ch) => boldMap[ch] || ch)
                    .join('');
            }

            const firstChar = word[0].toUpperCase();
            const rest = word.slice(1);
            return (boldMap[firstChar] || firstChar) + toSmallCaps(rest);
        })
        .join(' ');

/** Tipos de argumento soportados y su representación en el menú */
export const argLabels = {
    mention: '<mention>',
    texto: '<texto>',
    url: '<url>',
    numero: '<número>',
    opcion: '<opción>'
};

export const menuConfig = {
    // Separadores decorativos usados entre secciones del menú
    divider: '︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵ ᅟິᅟᅟ︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵',
    footerDivider: 'ᅟᅟ︶͜︶͜︶ᅟᅟ֪ᅟ֪ᅟᅟ︶͜︶͜︶',
    sectionDivider: 'ᅟᅟ︶͜︶͜︶ᅟᅟ﹙ ❀﹚ᅟᅟ︶͜︶͜︶',
    // Carita decorativa usada delante de cada comando en el listado
    commandFace: '૮₍ ˃̵͈᷄ . ฅ ₎ა',
    // Carita decorativa usada en las respuestas de IA
    aiFace: '≽(˵◝ ⩊  ◜˵ マ≼'
};

export default menuConfig;
