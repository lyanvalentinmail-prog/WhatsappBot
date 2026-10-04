/**
 * src/utils/helpers.js
 * -----------------------------------------------------------------------
 * Funciones de utilidad general reutilizadas por comandos y plugins.
 * -----------------------------------------------------------------------
 */

import axios from 'axios';

/** Pausa la ejecución "ms" milisegundos */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Descarga un recurso remoto y devuelve un Buffer */
export const getBuffer = async (url, options = {}) => {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', ...options });
    return Buffer.from(data);
};

/** Verifica si un string es una URL válida */
export const isUrl = (text = '') => {
    try {
        // eslint-disable-next-line no-new
        new URL(text);
        return /^https?:\/\//i.test(text);
    } catch {
        return false;
    }
};

/** Normaliza un número de teléfono dejando solo dígitos */
export const normalizeNumber = (number = '') => String(number).replace(/[^0-9]/g, '');

/** Convierte un número/JID a formato "numero@s.whatsapp.net" */
export const toJid = (number) => {
    const clean = normalizeNumber(number);
    return `${clean}@s.whatsapp.net`;
};

/** Extrae el número de un JID ("numero@s.whatsapp.net" -> "numero") */
export const jidToNumber = (jid = '') => jid.split('@')[0].split(':')[0];

/** Formatea milisegundos a un runtime legible (ej: 1d 2h 3m 4s) */
export const formatRuntime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
};

/** Formatea bytes a una unidad legible (KB, MB, GB...) */
export const formatBytes = (bytes = 0) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
};

/** Elige un elemento aleatorio de un arreglo */
export const randomItem = (array = []) => array[Math.floor(Math.random() * array.length)];

/** Genera un ID corto aleatorio (útil para nombres de archivos temporales) */
export const randomId = (length = 8) =>
    Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('');

/**
 * Extrae los JIDs mencionados o citados en un mensaje.
 * Devuelve un arreglo de JIDs (puede estar vacío).
 */
export const extractMentions = (msg) => {
    const contextInfo =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        {};

    const mentioned = contextInfo.mentionedJid || [];
    const quotedParticipant = contextInfo.participant ? [contextInfo.participant] : [];

    return [...new Set([...mentioned, ...quotedParticipant])];
};

/** Capitaliza la primera letra de un texto */
export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

export default {
    sleep,
    getBuffer,
    isUrl,
    normalizeNumber,
    toJid,
    jidToNumber,
    formatRuntime,
    formatBytes,
    randomItem,
    randomId,
    extractMentions,
    capitalize
};
