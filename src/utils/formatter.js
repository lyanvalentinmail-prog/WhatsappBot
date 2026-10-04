/**
 * src/utils/formatter.js
 * -----------------------------------------------------------------------
 * Funciones para interpretar y dar formato a los mensajes de Baileys:
 * extraer texto, detectar tipo de mensaje, obtener el mensaje citado
 * (quoted) y descargar medios (imagen, video, audio, sticker).
 * -----------------------------------------------------------------------
 */

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { baileysLogger } from './logger.js';

/** Devuelve el tipo de mensaje (ej: "conversation", "imageMessage"...) */
export const getMessageType = (msg) => {
    const message = msg?.message;
    if (!message) return null;
    return Object.keys(message)[0];
};

/** Extrae el texto plano de cualquier tipo de mensaje soportado */
export const extractText = (msg) => {
    const message = msg?.message;
    if (!message) return '';

    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.documentMessage?.caption ||
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        message.templateButtonReplyMessage?.selectedId ||
        ''
    );
};

/** Devuelve el mensaje citado (quoted) si existe, en formato "mensaje simulado" */
export const getQuotedMessage = (msg) => {
    const contextInfo =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.documentMessage?.contextInfo ||
        null;

    if (!contextInfo?.quotedMessage) return null;

    return {
        key: {
            remoteJid: msg.key.remoteJid,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant,
            fromMe: false
        },
        message: contextInfo.quotedMessage
    };
};

/** Indica si el mensaje (o su citado) contiene un medio descargable */
export const hasMedia = (msg) => {
    const quoted = getQuotedMessage(msg);
    const target = quoted || msg;
    const type = getMessageType(target);
    return ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(
        type
    );
};

/**
 * Descarga el medio del mensaje actual o del citado.
 * Devuelve un Buffer o null si no hay medios.
 */
export const downloadMedia = async (msg) => {
    try {
        const quoted = getQuotedMessage(msg);
        const target = quoted || msg;
        const type = getMessageType(target);
        if (!['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(type)) {
            return null;
        }
        const buffer = await downloadMediaMessage(
            target,
            'buffer',
            {},
            { logger: baileysLogger }
        );
        return buffer;
    } catch (err) {
        return null;
    }
};

export default { getMessageType, extractText, getQuotedMessage, hasMedia, downloadMedia };
