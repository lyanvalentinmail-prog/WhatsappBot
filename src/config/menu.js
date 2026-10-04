/**
 * src/config/menu.js
 * -----------------------------------------------------------------------
 * Configuración visual del menú (.menu). Aquí se define el orden de las
 * categorías, sus nombres "bonitos" y los textos de cabecera/pie.
 *
 * El contenido real de los comandos NO está escrito aquí: se genera
 * automáticamente leyendo los comandos cargados por el CommandHandler
 * (ver src/handlers/commands.js). Si agregas un archivo nuevo dentro de
 * src/commands/, aparecerá solo en su categoría sin tocar este archivo.
 * -----------------------------------------------------------------------
 */

/**
 * Orden y metadatos de cada categoría.
 * La "key" debe coincidir con el campo "category" usado en los comandos.
 */
export const categories = {
    general: { label: 'General', emoji: '✎', order: 1 },
    grupo: { label: 'Grupo', emoji: '👥', order: 2 },
    anime: { label: 'Anime', emoji: '❀', order: 3 },
    ia: { label: 'Inteligencia Artificial', emoji: '🤖', order: 4 },
    descargas: { label: 'Descargas', emoji: '📥', order: 5 },
    herramientas: { label: 'Herramientas', emoji: '🛠️', order: 6 },
    juegos: { label: 'Juegos', emoji: '🎮', order: 7 },
    owner: { label: 'Propietario', emoji: '👑', order: 8 }
};

/** Convierte texto normal a "pseudo smallcaps" como en el diseño pedido */
const smallCapsMap = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

export const toSmallCaps = (text = '') =>
    text
        .toLowerCase()
        .split('')
        .map((ch) => smallCapsMap[ch] || ch)
        .join('');

export const menuConfig = {
    // Separadores decorativos usados entre secciones del menú
    divider: '︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵ ᅟິᅟᅟ︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵',
    footerDivider: 'ᅟᅟ︶͜︶͜︶ᅟᅟ֪ᅟ֪ᅟᅟ︶͜︶͜︶',
    sectionDivider: 'ᅟᅟ︶͜︶͜︶ᅟᅟ﹙ ❀﹚ᅟᅟ︶͜︶͜︶'
};

export default menuConfig;
