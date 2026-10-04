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
        image: (model) => `https://api-inference.huggingface.co/models/${model}`
    }
};

export default apiEndpoints;
