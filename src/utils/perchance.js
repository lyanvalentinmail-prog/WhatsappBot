/**
 * src/utils/perchance.js
 * -----------------------------------------------------------------------
 * Integración NO OFICIAL con el generador de imágenes de Perchance
 * (https://perchance.org/ai-text-to-image-generator), usada por el
 * comando .image.
 *
 * Perchance no publica ninguna API: este módulo reconstruye, con pedidos
 * HTTP comunes (axios, sin navegador ni automatización tipo
 * Selenium/Puppeteer/Playwright), el mismo flujo de dos pasos que usa la
 * propia web:
 *
 *   1) GET  /api/verifyUser    -> entrega una "userKey" de sesión.
 *   2) POST /api/generate      -> genera la imagen con esa clave.
 *   3) GET  /api/downloadTemporaryImage (o la ruta "proxy" que devuelva
 *                                 el paso 2) -> descarga los bytes del JPG.
 *
 * Al ser un servicio no documentado, puede dejar de funcionar o cambiar
 * sin aviso. Si eso pasa, los errores quedan con un mensaje claro para
 * quien use el bot (ver src/commands/ia/image.js).
 * -----------------------------------------------------------------------
 */

import axios from 'axios';
import { logger } from './logger.js';

const BASE_URL = 'https://image-generation.perchance.org/api';
const SITE_URL = 'https://perchance.org/ai-text-to-image-generator';

// Headers "de navegador" para reducir la chance de que algún filtro
// anti-bot básico rechace el pedido por no parecer tráfico real.
const BROWSER_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    Referer: SITE_URL,
    Origin: 'https://perchance.org'
};

const RESOLUTIONS = {
    square: '768x768',
    portrait: '512x768',
    landscape: '768x512'
};

class PerchanceError extends Error {}

/** Cache simple en memoria de la userKey, para no pedir una nueva en cada imagen */
let keyCache = { userKey: null, cookie: '', fetchedAt: 0 };
const KEY_TTL_MS = 8 * 60 * 1000; // 8 minutos

const randomFloat = () => Math.random();
const randomInt = (max) => Math.floor(Math.random() * max);

/** Junta los "Set-Cookie" de una respuesta en un único header "Cookie" */
const extractCookie = (setCookieHeader) => {
    if (!setCookieHeader) return '';
    const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    return list.map((c) => c.split(';')[0]).join('; ');
};

/** Busca recursivamente un token/ruta de descarga "proxy" dentro de la respuesta de /generate */
const findProxyDownload = (value) => {
    if (typeof value === 'string') {
        if (value.includes('downloadTemporaryImageViaProxy')) return value;
        if (value.startsWith('v1.') && value.length > 80) {
            return `/downloadTemporaryImageViaProxy?t=${value}`;
        }
        return null;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findProxyDownload(item);
            if (found) return found;
        }
        return null;
    }
    if (value && typeof value === 'object') {
        for (const item of Object.values(value)) {
            const found = findProxyDownload(item);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Obtiene (o reutiliza) una userKey de sesión consultando /api/verifyUser.
 * @param {boolean} force fuerza a pedir una clave nueva aunque haya cache
 */
const getUserKey = async (force = false) => {
    const fresh = keyCache.userKey && Date.now() - keyCache.fetchedAt < KEY_TTL_MS;
    if (fresh && !force) return keyCache;

    let response;
    try {
        response = await axios.get(`${BASE_URL}/verifyUser`, {
            params: { thread: 0, __cacheBust: randomFloat() },
            headers: BROWSER_HEADERS,
            timeout: 20_000,
            validateStatus: () => true
        });
    } catch (err) {
        throw new PerchanceError(
            `No se pudo contactar a Perchance (${err.code || err.message}). Puede que el servicio esté caído o bloqueado desde tu red.`
        );
    }

    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || '');

    if (response.status === 429 || body.includes('too_many_requests')) {
        throw new PerchanceError('Perchance está limitando las solicitudes (demasiados pedidos). Probá de nuevo en un rato.');
    }

    const match = body.match(/"userKey"\s*:\s*"([a-f0-9]{16,64})"/i);
    if (!match) {
        throw new PerchanceError(
            'No se pudo obtener la clave de sesión de Perchance. Es posible que el sitio haya cambiado su estructura interna.'
        );
    }

    keyCache = {
        userKey: match[1],
        cookie: extractCookie(response.headers?.['set-cookie']) || keyCache.cookie,
        fetchedAt: Date.now()
    };

    return keyCache;
};

/** Llama a /api/generate y devuelve el JSON crudo de respuesta */
const requestGenerate = async ({ userKey, cookie }, { prompt, negativePrompt, resolution }) => {
    const url = `${BASE_URL}/generate`;
    const { data, status } = await axios.post(
        url,
        {
            generatorName: 'ai-image-generator',
            channel: 'ai-text-to-image-generator',
            subChannel: 'public',
            prompt,
            negativePrompt: negativePrompt || '',
            seed: -1,
            resolution,
            guidanceScale: 7
        },
        {
            params: {
                userKey,
                requestId: `aiImageCompletion${randomInt(2 ** 30)}`,
                __cacheBust: randomFloat()
            },
            headers: {
                ...BROWSER_HEADERS,
                'Content-Type': 'application/json',
                ...(cookie ? { Cookie: cookie } : {})
            },
            timeout: 60_000,
            validateStatus: () => true
        }
    );

    if (status === 401 || status === 403) {
        throw new PerchanceError('INVALID_KEY');
    }

    return data;
};

/** Descarga la imagen generada y devuelve un Buffer con los bytes */
const downloadImage = async ({ imageId, proxyPath, cookie }) => {
    const urls = [];
    if (proxyPath) urls.push(`${BASE_URL}${proxyPath.startsWith('/') ? '' : '/'}${proxyPath}`);
    urls.push(`${BASE_URL}/downloadTemporaryImage?imageId=${encodeURIComponent(imageId)}`);

    let lastError;
    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: { ...BROWSER_HEADERS, ...(cookie ? { Cookie: cookie } : {}) },
                timeout: 60_000,
                validateStatus: (s) => s === 200
            });
            return Buffer.from(response.data);
        } catch (err) {
            lastError = err;
        }
    }

    throw new PerchanceError(`No se pudo descargar la imagen generada (${lastError?.message || 'error desconocido'}).`);
};

/**
 * Genera una imagen con Perchance.
 * @param {object} opts
 * @param {string} opts.prompt Descripción de la imagen.
 * @param {string} [opts.negativePrompt] Qué evitar en la imagen.
 * @param {{promptSuffix?: string, negativeSuffix?: string}} [opts.style] Estilo (ver perchanceStyles.js)
 * @param {'square'|'portrait'|'landscape'} [opts.shape='square']
 * @returns {Promise<{buffer: Buffer, imageId: string}>}
 */
export const generatePerchanceImage = async ({ prompt, negativePrompt = '', style = {}, shape = 'square' }) => {
    if (!prompt || !prompt.trim()) {
        throw new PerchanceError('Falta describir la imagen a generar.');
    }

    const resolution = RESOLUTIONS[shape] || RESOLUTIONS.square;
    const fullPrompt = style.promptSuffix ? `${prompt}, ${style.promptSuffix}` : prompt;
    const fullNegative = style.negativeSuffix
        ? `${negativePrompt ? negativePrompt + ', ' : ''}${style.negativeSuffix}`
        : negativePrompt;

    let session = await getUserKey();
    let data;

    // Reintenta una vez con clave nueva si Perchance la rechaza, y hasta
    // unos pocos ciclos si pide esperar a que termine un pedido anterior.
    for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
            data = await requestGenerate(session, { prompt: fullPrompt, negativePrompt: fullNegative, resolution });
        } catch (err) {
            if (err.message === 'INVALID_KEY' && attempt === 0) {
                session = await getUserKey(true);
                continue;
            }
            throw err;
        }

        if (data?.status === 'waiting_for_prev_request_to_finish') {
            await new Promise((r) => setTimeout(r, 4000));
            continue;
        }

        break;
    }

    const imageId = data?.imageId || data?.result?.imageId;
    if (!imageId) {
        logger.debug('Respuesta inesperada de Perchance /generate', data);
        if (typeof data === 'string' && data.includes('too_many_requests')) {
            throw new PerchanceError('Perchance está limitando las solicitudes. Probá de nuevo en un rato.');
        }
        throw new PerchanceError('Perchance no devolvió una imagen válida. Puede que el servicio haya cambiado o esté ocupado.');
    }

    const proxyPath = findProxyDownload(data);
    const buffer = await downloadImage({ imageId, proxyPath, cookie: session.cookie });

    return { buffer, imageId };
};

export default generatePerchanceImage;
