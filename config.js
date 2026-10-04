/**
 * config.js
 * -----------------------------------------------------------------------
 * Punto único de lectura de las variables de entorno (.env).
 * Todo el proyecto importa la configuración desde aquí, nunca debe leerse
 * "process.env" directamente en otros archivos, así es más fácil de
 * mantener y de personalizar.
 * -----------------------------------------------------------------------
 */

import dotenv from 'dotenv';
dotenv.config();

/** Convierte "true"/"false" (string) en boolean real */
const toBool = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).trim().toLowerCase() === 'true';
};

export const config = {
    // Identidad del bot
    botName: process.env.BOT_NAME || 'MiBot',
    botType: process.env.BOT_TYPE || 'Multi Device',
    botOwner: process.env.BOT_OWNER || 'Owner',
    prefix: process.env.BOT_PREFIX || '.',
    allowNoPrefix: toBool(process.env.ALLOW_NO_PREFIX, false),
    mode: (process.env.BOT_MODE || 'public').toLowerCase(), // public | private
    language: process.env.LANGUAGE || 'es',
    menuStyle: process.env.MENU_STYLE || 'default',

    // Conexión
    pairingNumber: (process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, ''),
    usePairingCode: toBool(process.env.USE_PAIRING_CODE, false),

    // Información para el menú / README
    groupLink: process.env.GROUP_LINK || '',
    developerName: process.env.DEVELOPER_NAME || 'Lyan',
    developerNumber: process.env.DEVELOPER_NUMBER || '',
    githubRepo: process.env.GITHUB_REPO || '',

    // IA
    ai: {
        openaiKey: process.env.OPENAI_API_KEY || '',
        geminiKey: process.env.GEMINI_API_KEY || '',
        groqKey: process.env.GROQ_API_KEY || '',
        huggingfaceKey: process.env.HUGGINGFACE_API_KEY || '',
        openaiModel: process.env.OPENAI_MODEL || 'gpt-6-luna',
        openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare',
        geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        huggingfaceImageModel:
            process.env.HUGGINGFACE_IMAGE_MODEL || 'stabilityai/stable-diffusion-3-medium-diffusers'
    },

    // Descargas
    downloads: {
        apiUrl: process.env.DOWNLOAD_API_URL || '',
        apiKey: process.env.DOWNLOAD_API_KEY || ''
    },

    // Stickers (búsqueda de Sticker.ly)
    stickers: {
        // Respaldo OPCIONAL para .ssearch cuando la API gratuita principal
        // (delirius.online, sin key) esté caída. Se obtiene gratis
        // registrándose en https://api.ferdev.me/register
        ferdevApiKey: process.env.FERDEV_API_KEY || ''
    },

    // Base de datos
    database: {
        driver: process.env.DATABASE_DRIVER || 'json',
        url: process.env.DATABASE_URL || './src/database/storage/database.json'
    },

    timezone: process.env.TIMEZONE || 'America/Montevideo',

    // Metadatos fijos del proyecto
    version: '1.0.0'
};

export default config;
