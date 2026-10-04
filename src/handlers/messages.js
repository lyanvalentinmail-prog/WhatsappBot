/**
 * src/handlers/messages.js
 * -----------------------------------------------------------------------
 * Punto central de procesamiento de cada mensaje entrante:
 *   1. Normaliza el mensaje (texto, remitente, grupo, etc).
 *   2. Detecta si es un comando (según el prefijo configurado).
 *   3. Valida permisos (owner/admin/grupo/privado/botAdmin).
 *   4. Ejecuta el comando dentro de un try/catch para que un error en un
 *      comando NUNCA tumbe el bot completo.
 * -----------------------------------------------------------------------
 */

import config from '../../config.js';
import { ownerNumbers } from '../config/bot.js';
import messages from '../config/messages.js';
import { commandHandler } from './commands.js';
import { extractText, getQuotedMessage } from '../utils/formatter.js';
import { extractMentions, jidToNumber, normalizeNumber } from '../utils/helpers.js';
import { isBlocked, incrementUserMessages } from '../database/index.js';
import { getGroupMetadata } from '../utils/groupMetadataCache.js';
import { logger } from '../utils/logger.js';

/** Devuelve el listado de JIDs administradores de un grupo */
const getGroupAdmins = (groupMetadata) =>
    (groupMetadata?.participants || [])
        .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
        .map((p) => p.id);

/**
 * Construye el "contexto" (ctx) que reciben todos los comandos.
 *
 * IMPORTANTE (rendimiento): esto NO pide la metadata del grupo por red.
 * sock.groupMetadata() siempre hace una consulta de red a WhatsApp (no
 * tiene caché propia), así que pedirla acá adentro para CADA mensaje
 * entrante (incluso charla normal que ni es un comando) agrega latencia
 * innecesaria y puede hacer que el bot se sienta lento o "colgado" en
 * grupos activos. Por eso la metadata se resuelve aparte, solo cuando
 * hace falta (ver `attachGroupInfo` más abajo), y usando una caché.
 */
const buildContext = (sock, msg) => {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const botJid = sock.user?.id?.split(':')[0];

    // IMPORTANTE: si vinculaste el bot con tu propio número de WhatsApp
    // (lo habitual en Termux), los mensajes que vos mismo escribís llegan
    // con fromMe=true. En privado, "from" sería el chat (la otra persona),
    // NO quien escribió: en ese caso el remitente real sos vos (el bot).
    const sender = isGroup
        ? msg.key.participant || `${botJid}@s.whatsapp.net`
        : msg.key.fromMe
          ? `${botJid}@s.whatsapp.net`
          : from;
    const senderNumber = normalizeNumber(jidToNumber(sender));

    const isOwner = ownerNumbers.includes(senderNumber);

    const text = extractText(msg);
    const quoted = getQuotedMessage(msg);
    const mentions = extractMentions(msg);

    const reply = (content, options = {}) => {
        const payload = typeof content === 'string' ? { text: content } : content;
        return sock.sendMessage(from, payload, { quoted: msg, ...options });
    };

    const react = (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } });

    return {
        sock,
        msg,
        from,
        isGroup,
        botJid,
        sender,
        senderNumber,
        text,
        quoted,
        mentions,
        groupMetadata: null,
        groupAdmins: [],
        isOwner,
        isAdmin: false,
        isBotAdmin: false,
        reply,
        react,
        config
    };
};

/**
 * Completa `ctx` con datos del grupo (metadata, admins) solo cuando hace
 * falta: se llama una única vez, después de confirmar que el mensaje es
 * un comando válido dentro de un grupo. Usa caché (ver
 * src/utils/groupMetadataCache.js) para no golpear la red en cada
 * comando.
 */
const attachGroupInfo = async (ctx) => {
    if (!ctx.isGroup) return ctx;

    const groupMetadata = await getGroupMetadata(ctx.sock, ctx.from);
    const groupAdmins = getGroupAdmins(groupMetadata);

    ctx.groupMetadata = groupMetadata;
    ctx.groupAdmins = groupAdmins;
    ctx.isAdmin = groupAdmins.includes(ctx.sender);
    ctx.isBotAdmin = groupAdmins.some((jid) => jidToNumber(jid) === ctx.botJid);

    return ctx;
};

/** Separa el texto en comando + argumentos, respetando el prefijo configurado */
const parseCommand = (text) => {
    const prefix = config.prefix;
    let body = text.trim();
    let usedPrefix = '';

    if (body.startsWith(prefix)) {
        usedPrefix = prefix;
        body = body.slice(prefix.length);
    } else if (!config.allowNoPrefix) {
        return null; // No es un comando
    }

    if (!body) return null;

    const [cmdName, ...args] = body.trim().split(/\s+/);
    return { cmdName: cmdName?.toLowerCase(), args, usedPrefix };
};

/**
 * Procesa un mensaje entrante. Se llama desde src/connection/connect.js
 * en el evento "messages.upsert".
 */
export const handleMessage = async (sock, msg) => {
    try {
        if (!msg.message) return;
        if (msg.key.remoteJid === 'status@broadcast') return;

        // Nota: NO se ignoran los mensajes "fromMe". Cuando el bot está
        // vinculado con tu propio número de WhatsApp (lo normal en Termux),
        // los comandos que vos mismo escribís también llegan con
        // fromMe=true, y deben poder ejecutarse (sos el owner).
        const ctx = buildContext(sock, msg);
        logger.debug(`Mensaje recibido de ${ctx.sender} en ${ctx.from}: "${ctx.text}"`);
        if (!ctx.text) return;

        // Usuario bloqueado: se ignora silenciosamente
        if (isBlocked(ctx.sender)) return;

        incrementUserMessages(ctx.sender);

        const parsed = parseCommand(ctx.text);
        if (!parsed || !parsed.cmdName) return;

        const command = commandHandler.find(parsed.cmdName);
        if (!command) {
            logger.debug(`Comando no encontrado: "${parsed.cmdName}" (prefijo configurado: "${config.prefix}")`);
            return; // No se responde nada si el comando no existe (evita spam)
        }

        ctx.args = parsed.args;
        ctx.prefix = parsed.usedPrefix || config.prefix;
        ctx.commandName = command.name;

        // Recién ahora (comando confirmado) vale la pena pedir la
        // metadata del grupo, y queda cacheada para el próximo comando.
        await attachGroupInfo(ctx);

        // ---- Validación de permisos ----
        if (config.mode === 'private' && !ctx.isOwner) {
            return reply(ctx, messages.botDisabledPrivate);
        }

        if (command.ownerOnly && !ctx.isOwner) {
            return reply(ctx, messages.ownerOnly);
        }

        if (command.groupOnly && !ctx.isGroup) {
            return reply(ctx, messages.groupOnly);
        }

        if (command.privateOnly && ctx.isGroup) {
            return reply(ctx, messages.privateOnly);
        }

        if (command.adminOnly && ctx.isGroup && !ctx.isAdmin && !ctx.isOwner) {
            return reply(ctx, messages.adminOnly);
        }

        if (command.botAdmin && ctx.isGroup && !ctx.isBotAdmin) {
            return reply(ctx, messages.botAdminRequired);
        }

        // ---- Ejecución segura del comando ----
        try {
            await command.execute(ctx);
        } catch (err) {
            logger.error(`Error ejecutando el comando "${command.name}"`, err);
            await reply(ctx, messages.commandError(err.message || err));
        }
    } catch (err) {
        logger.error('Error procesando mensaje entrante', err);
    }
};

const reply = (ctx, text) => ctx.reply(text);

export default handleMessage;

