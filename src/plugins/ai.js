/**
 * src/plugins/ai.js
 * -----------------------------------------------------------------------
 * Plugin de Inteligencia Artificial: .chatgpt, .gemini, .groq
 * Las claves se leen desde .env a través de config.js / src/utils/api.js.
 * Para agregar un proveedor nuevo (Claude, DeepSeek, Mistral,
 * OpenRouter...): 1) agrega la función en src/utils/api.js,
 * 2) suma un objeto de comando aquí mismo.
 * -----------------------------------------------------------------------
 */

import messages from '../config/messages.js';
import { askOpenAI, askGemini, askGroq } from '../utils/api.js';

const createAiCommand = ({ name, aliases, envVar, fn, label }) => ({
    name,
    aliases,
    category: 'ia',
    description: `Habla con ${label} (inteligencia artificial)`,
    usage: `.${name} <mensaje>`,
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const prompt = ctx.args.join(' ') || ctx.quoted?.message?.conversation;
        if (!prompt) return ctx.reply(`❌ Escribe un mensaje después del comando. Ej: .${name} hola`);

        await ctx.reply(messages.wait);
        try {
            const answer = await fn(prompt);
            await ctx.reply(`🤖 *${label}*\n\n${answer}`);
        } catch (err) {
            if (String(err.message).includes(envVar)) {
                return ctx.reply(messages.aiNotConfigured(envVar));
            }
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
});

export default [
    createAiCommand({
        name: 'chatgpt',
        aliases: ['gpt', 'ia'],
        envVar: 'OPENAI_API_KEY',
        fn: askOpenAI,
        label: 'ChatGPT'
    }),
    createAiCommand({
        name: 'gemini',
        aliases: ['bard'],
        envVar: 'GEMINI_API_KEY',
        fn: askGemini,
        label: 'Gemini'
    }),
    createAiCommand({
        name: 'groq',
        aliases: ['llama'],
        envVar: 'GROQ_API_KEY',
        fn: askGroq,
        label: 'Groq'
    })
];
