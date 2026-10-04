/**
 * src/utils/api.js
 * -----------------------------------------------------------------------
 * Capa común para hablar con APIs externas (IA, descargas, etc).
 * Los comandos NUNCA deben llamar a "axios" directamente: siempre pasan
 * por aquí. Así, agregar un nuevo proveedor (Claude, DeepSeek, Mistral,
 * OpenRouter...) solo requiere sumar una función en este archivo.
 * -----------------------------------------------------------------------
 */

import axios from 'axios';
import config from '../../config.js';
import apiEndpoints from '../config/api.js';
import { logger } from './logger.js';

/**
 * Traduce errores HTTP comunes (401/403/404) de las APIs de IA a un
 * mensaje entendible, en vez de dejar pasar el genérico de axios
 * ("Request failed with status code 404"). Un 404 en estas APIs casi
 * siempre significa que el modelo configurado (ej: OPENAI_MODEL,
 * GEMINI_MODEL, GROQ_MODEL) fue descontinuado por el proveedor.
 */
const describeHttpError = (service, modelEnvVar, model, err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
        return new Error(`La API key de ${service} es inválida o no tiene permisos.`);
    }
    if (status === 404) {
        return new Error(
            `El modelo "${model}" de ${service} ya no existe o fue descontinuado ` +
                `(HTTP 404). Revisá los modelos vigentes del proveedor y actualizá ` +
                `${modelEnvVar} en tu .env.`
        );
    }
    if (status === 429) {
        return new Error(`${service} está limitando las solicitudes (demasiados pedidos). Probá de nuevo en un rato.`);
    }
    return err;
};

/**
 * Chatea con OpenAI (ChatGPT).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const askOpenAI = async (prompt) => {
    if (!config.ai.openaiKey) throw new Error('OPENAI_API_KEY no configurada en .env');

    try {
        const { data } = await axios.post(
            apiEndpoints.openai.chat,
            {
                model: config.ai.openaiModel,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    Authorization: `Bearer ${config.ai.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60_000
            }
        );

        return data.choices?.[0]?.message?.content?.trim() || 'No se obtuvo respuesta.';
    } catch (err) {
        throw describeHttpError('OpenAI', 'OPENAI_MODEL', config.ai.openaiModel, err);
    }
};

/**
 * Genera una imagen con el modelo de imágenes de OpenAI.
 * @param {string} prompt
 * @returns {Promise<string>} URL o base64 de la imagen generada
 */
export const generateImageOpenAI = async (prompt) => {
    if (!config.ai.openaiKey) throw new Error('OPENAI_API_KEY no configurada en .env');

    try {
        const { data } = await axios.post(
            apiEndpoints.openai.image,
            {
                model: config.ai.openaiImageModel,
                prompt,
                n: 1,
                size: '1024x1024'
            },
            {
                headers: {
                    Authorization: `Bearer ${config.ai.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120_000
            }
        );

        const item = data.data?.[0];
        if (!item) throw new Error('No se pudo generar la imagen.');
        return item.url || `data:image/png;base64,${item.b64_json}`;
    } catch (err) {
        throw describeHttpError('OpenAI', 'OPENAI_IMAGE_MODEL', config.ai.openaiImageModel, err);
    }
};

/**
 * Chatea con Google Gemini.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const askGemini = async (prompt) => {
    if (!config.ai.geminiKey) throw new Error('GEMINI_API_KEY no configurada en .env');

    try {
        const url = apiEndpoints.gemini.generate(config.ai.geminiModel);
        const { data } = await axios.post(
            `${url}?key=${config.ai.geminiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60_000 }
        );

        return (
            data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim() ||
            'No se obtuvo respuesta.'
        );
    } catch (err) {
        throw describeHttpError('Gemini', 'GEMINI_MODEL', config.ai.geminiModel, err);
    }
};


/**
 * Genera una imagen con un modelo de Hugging Face (Inference API), a
 * partir de un prompt de texto. Requiere una cuenta gratuita en
 * huggingface.co y un token de acceso (sin tarjeta de crédito):
 * https://huggingface.co/settings/tokens
 *
 * La Inference API a veces responde JSON en vez de la imagen mientras el
 * modelo "despierta" (cold start) o hay cola; en ese caso se reintenta
 * automáticamente unas pocas veces antes de fallar.
 *
 * @param {string} prompt
 * @param {string} [negativePrompt] Qué evitar en la imagen.
 * @returns {Promise<Buffer>} Imagen en bytes (PNG/JPEG)
 */
export const generateImageHuggingFace = async (prompt, negativePrompt = '') => {
    if (!config.ai.huggingfaceKey) throw new Error('HUGGINGFACE_API_KEY no configurada en .env');

    const url = apiEndpoints.huggingface.image(config.ai.huggingfaceImageModel);
    const body = {
        inputs: prompt,
        ...(negativePrompt ? { parameters: { negative_prompt: negativePrompt } } : {})
    };

    const doRequest = () =>
        axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${config.ai.huggingfaceKey}`,
                'Content-Type': 'application/json',
                Accept: 'image/png'
            },
            responseType: 'arraybuffer',
            timeout: 120_000,
            validateStatus: () => true
        });

    let response = await doRequest();

    // Hasta 4 reintentos mientras el modelo esté "cargando" o haya cola.
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const contentType = response.headers?.['content-type'] || '';
        if (!contentType.includes('application/json')) break;

        let payload = {};
        try {
            payload = JSON.parse(Buffer.from(response.data).toString('utf8'));
        } catch {
            payload = {};
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error('HUGGINGFACE_API_KEY inválida o sin permisos para este modelo.');
        }

        if (response.status === 402) {
            throw new Error(
                'Se agotó el crédito gratuito mensual de Hugging Face para generar imágenes. ' +
                    'Esperá al próximo mes o cargá crédito en huggingface.co/pricing.'
            );
        }

        if (response.status === 404) {
            throw new Error(
                `El modelo "${config.ai.huggingfaceImageModel}" no está disponible en Hugging Face. ` +
                    'Probá cambiar HUGGINGFACE_IMAGE_MODEL en tu .env.'
            );
        }

        if (payload.error && /loading|queue/i.test(payload.error)) {
            const waitMs = Math.min(Math.ceil((payload.estimated_time || 12) * 1000), 25_000);
            logger.debug(`Hugging Face: modelo cargando, reintentando en ${waitMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            response = await doRequest();
            continue;
        }

        throw new Error(payload.error || `Hugging Face devolvió un error (HTTP ${response.status}).`);
    }

    if (response.status !== 200) {
        throw new Error(`Hugging Face devolvió un error (HTTP ${response.status}).`);
    }

    return Buffer.from(response.data);
};

/**
 * Chatea usando Groq (modelos tipo Llama a muy alta velocidad).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const askGroq = async (prompt) => {
    if (!config.ai.groqKey) throw new Error('GROQ_API_KEY no configurada en .env');

    try {
        const { data } = await axios.post(
            apiEndpoints.groq.chat,
            {
                model: config.ai.groqModel,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    Authorization: `Bearer ${config.ai.groqKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60_000
            }
        );

        return data.choices?.[0]?.message?.content?.trim() || 'No se obtuvo respuesta.';
    } catch (err) {
        throw describeHttpError('Groq', 'GROQ_MODEL', config.ai.groqModel, err);
    }
};

/**
 * Descarga cualquier URL como Buffer (imagen, preview, etc). Usada por
 * .brat y .ssearch para traer el resultado de APIs externas.
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<Buffer>}
 */
export const fetchBuffer = async (url, timeoutMs = 30_000) => {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: timeoutMs,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    return Buffer.from(data);
};

/**
 * Intenta "adivinar" la forma de la respuesta de un buscador de
 * Sticker.ly, probando varios nombres de campo comunes entre distintas
 * APIs de terceros (no todas devuelven exactamente lo mismo). Si el
 * formato real difiere, esto puede necesitar un ajuste puntual: queda
 * registrado en logs de debug para poder diagnosticarlo.
 * @returns {Array<{name: string, preview: string, isAnimated?: boolean}>}
 */
const normalizeStickerlyResults = (raw) => {
    const list =
        (Array.isArray(raw?.data) && raw.data) ||
        (Array.isArray(raw?.result) && raw.result) ||
        (Array.isArray(raw?.results) && raw.results) ||
        (Array.isArray(raw) && raw) ||
        [];

    return list
        .map((item) => {
            const preview =
                item?.preview ||
                item?.thumbnail ||
                item?.thumb ||
                item?.image ||
                item?.imageUrl ||
                item?.cover ||
                item?.stickers?.[0]?.imageUrl ||
                item?.stickers?.[0]?.url ||
                '';
            const name = item?.name || item?.packName || item?.title || '';
            const isAnimated = Boolean(item?.isAnimated ?? item?.animated ?? false);
            return preview ? { name, preview, isAnimated } : null;
        })
        .filter(Boolean);
};

/**
 * Busca stickers de Sticker.ly por nombre/tema. Intenta primero la API
 * pública y gratuita de delirius.online (sin key); si no responde (ese
 * servicio se cae con frecuencia) y hay una FERDEV_API_KEY configurada
 * en .env (gratis, registrándose en https://api.ferdev.me/register), la
 * usa como respaldo automático.
 * @param {string} query
 * @returns {Promise<Array<{name: string, preview: string, isAnimated?: boolean}>>}
 */
export const searchStickerly = async (query) => {
    try {
        const { data } = await axios.get(apiEndpoints.delirius.stickerlySearch(query), {
            timeout: 10_000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/120.0.0.0 Mobile Safari/537.36' }
        });
        // Petición exitosa: devolvemos lo que haya (puede ser [] si
        // legítimamente no hay resultados para esa búsqueda, eso no es un
        // error, lo maneja el comando mostrando "no se encontraron...").
        return normalizeStickerlyResults(data);
    } catch (err) {
        // Acá sí falló la petición en sí (timeout, 5xx, DNS caída, etc.),
        // no que "no haya resultados". Intentamos el respaldo si hay key.
        logger.debug(`delirius.online (stickerly) falló: ${err.message}`);

        if (config.stickers.ferdevApiKey) {
            try {
                const { data } = await axios.get(
                    apiEndpoints.ferdev.stickerlySearch(query, config.stickers.ferdevApiKey),
                    { timeout: 10_000 }
                );
                return normalizeStickerlyResults(data);
            } catch (ferdevErr) {
                logger.debug(`ferdev.me (stickerly) también falló: ${ferdevErr.message}`);
            }
        }

        // El buscador de Sticker.ly depende de un servicio público gratuito
        // de terceros que el bot no controla. Si está caído (timeout, 5xx,
        // DNS, etc.) lo avisamos claro en vez de un error genérico de axios.
        throw new Error(
            'El buscador de stickers no está disponible en este momento (el/los servicio/s externo/s ' +
                'que usa están caídos). No depende del bot: probá de nuevo más tarde.'
        );
    }
};

/**
 * Llama a una API externa de descargas configurada por el usuario en .env
 * (DOWNLOAD_API_URL). El bot no incluye ningún servicio de terceros
 * "hardcodeado": cada usuario conecta la API que prefiera siguiendo este
 * mismo contrato: GET {DOWNLOAD_API_URL}/<endpoint>?url=<url>
 *
 * @param {string} endpoint ej: "youtube", "tiktok", "instagram"
 * @param {string} targetUrl URL del contenido a descargar
 */
export const fetchDownload = async (endpoint, targetUrl) => {
    if (!config.downloads.apiUrl) {
        throw new Error('DOWNLOAD_API_URL no configurada en .env');
    }

    const { data } = await axios.get(`${config.downloads.apiUrl}/${endpoint}`, {
        params: { url: targetUrl },
        headers: config.downloads.apiKey
            ? { Authorization: `Bearer ${config.downloads.apiKey}` }
            : {},
        timeout: 60_000
    });

    return data;
};

/** Wrapper genérico con manejo de errores homogéneo para cualquier petición GET */
export const safeGet = async (url, options = {}) => {
    try {
        const { data } = await axios.get(url, options);
        return data;
    } catch (err) {
        logger.error(`Error en petición GET a ${url}`, err);
        throw err;
    }
};

export default {
    askOpenAI,
    generateImageOpenAI,
    askGemini,
    askGroq,
    generateImageHuggingFace,
    fetchBuffer,
    searchStickerly,
    fetchDownload,
    safeGet
};
