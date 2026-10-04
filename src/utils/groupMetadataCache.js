/**
 * src/utils/groupMetadataCache.js
 * -----------------------------------------------------------------------
 * Baileys NO cachea sock.groupMetadata(): cada llamada hace una consulta
 * de red (IQ) a los servidores de WhatsApp. Pedirla en cada mensaje
 * entrante (como se hacía antes) agrega una latencia de red extra antes
 * de poder responder cualquier cosa, incluso para mensajes que ni
 * siquiera son comandos. Esto hace que el bot se sienta "lento" o
 * directamente que no responda en grupos activos.
 *
 * Esta caché en memoria evita pedir la metadata de nuevo si ya la
 * tenemos de los últimos minutos, y se invalida automáticamente cuando
 * hay cambios reales en el grupo (entra/sale alguien, cambia el admin,
 * etc. -> evento "group-participants.update").
 * -----------------------------------------------------------------------
 */

import { logger } from './logger.js';

const TTL_MS = 5 * 60 * 1000; // 5 minutos

/** @type {Map<string, { data: object, expiresAt: number }>} */
const cache = new Map();

/** @type {Map<string, Promise<object>>} */
const inFlight = new Map();

/**
 * Devuelve la metadata del grupo, usando la caché si está vigente.
 * Si varias llamadas piden lo mismo al mismo tiempo (ej: ráfaga de
 * mensajes), comparten la misma request en curso en vez de disparar una
 * consulta de red por cada una.
 */
export const getGroupMetadata = async (sock, jid) => {
    const cached = cache.get(jid);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    if (inFlight.has(jid)) {
        return inFlight.get(jid);
    }

    const promise = sock
        .groupMetadata(jid)
        .then((data) => {
            cache.set(jid, { data, expiresAt: Date.now() + TTL_MS });
            return data;
        })
        .catch((err) => {
            logger.debug(`No se pudo obtener metadata del grupo ${jid}: ${err?.message || err}`);
            return null;
        })
        .finally(() => {
            inFlight.delete(jid);
        });

    inFlight.set(jid, promise);
    return promise;
};

/** Invalida la caché de un grupo puntual (ej: cambió algo en vivo) */
export const invalidateGroupMetadata = (jid) => {
    cache.delete(jid);
};

export default { getGroupMetadata, invalidateGroupMetadata };
