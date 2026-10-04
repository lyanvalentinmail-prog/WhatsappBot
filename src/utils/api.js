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
 * Chatea con OpenAI (ChatGPT).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const askOpenAI = async (prompt) => {
    if (!config.ai.openaiKey) throw new Error('OPENAI_API_KEY no configurada en .env');

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
};

/**
 * Genera una imagen con el modelo de imágenes de OpenAI.
 * @param {string} prompt
 * @returns {Promise<string>} URL o base64 de la imagen generada
 */
export const generateImageOpenAI = async (prompt) => {
    if (!config.ai.openaiKey) throw new Error('OPENAI_API_KEY no configurada en .env');

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
};

/**
 * Chatea con Google Gemini.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const askGemini = async (prompt) => {
    if (!config.ai.geminiKey) throw new Error('GEMINI_API_KEY no configurada en .env');

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
    fetchDownload,
    safeGet
};
