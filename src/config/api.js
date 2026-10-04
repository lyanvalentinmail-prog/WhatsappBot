/**
 * src/config/api.js
 * -----------------------------------------------------------------------
 * Endpoints públicos de las APIs de IA utilizadas por el bot.
 * Las API KEYS nunca se escriben aquí: se leen desde ".env" a través de
 * config.js. Este archivo solo centraliza las URLs y parámetros fijos,
 * para que agregar un nuevo proveedor sea tan simple como sumar una
 * entrada aquí y una función en src/utils/api.js.
 * -----------------------------------------------------------------------
 */

export const apiEndpoints = {
    openai: {
        chat: 'https://api.openai.com/v1/chat/completions',
        image: 'https://api.openai.com/v1/images/generations'
    },
    gemini: {
        // El modelo se interpola en src/utils/api.js
        generate: (model) =>
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    },
    groq: {
        chat: 'https://api.groq.com/openai/v1/chat/completions'
    },
    huggingface: {
        // El modelo se interpola en src/utils/api.js (HUGGINGFACE_IMAGE_MODEL en .env)
        // IMPORTANTE: Hugging Face apagó api-inference.huggingface.co (dominio
        // retirado, ya no resuelve DNS) y movió todo a router.huggingface.co.
        image: (model) => `https://router.huggingface.co/hf-inference/models/${model}`
    },
    delirius: {
        // API pública y gratuita (sin key) usada por .ssearch.
        stickerlySearch: (query) =>
            `https://api.delirius.online/search/stickerly?query=${encodeURIComponent(query)}`
    },
    ferdev: {
        // Respaldo de .ssearch (requiere FERDEV_API_KEY, gratis con registro
        // en https://api.ferdev.me/register) usado solo si delirius.online
        // no responde.
        stickerlySearch: (query, apikey) =>
            `https://api.ferdev.me/sticker/stickerlysearch?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apikey)}`
    }
};

export default apiEndpoints;
