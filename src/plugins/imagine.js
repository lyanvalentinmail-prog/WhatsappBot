/**
 * src/plugins/imagine.js
 * -----------------------------------------------------------------------
 * Plugin .imagine — genera una imagen a partir de una descripción usando
 * la API de imágenes de OpenAI (configurable vía .env).
 * -----------------------------------------------------------------------
 */

import messages from '../config/messages.js';
import { generateImageOpenAI } from '../utils/api.js';

export default {
    name: 'imagine',
    aliases: ['img', 'crearimagen'],
    category: 'ia',
    description: 'Crea una imagen a partir de una descripción usando IA',
    usage: '.imagine un gato astronauta en la luna',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const prompt = ctx.args.join(' ');
        if (!prompt) return ctx.reply('❌ Describe lo que quieres generar. Ej: .imagine un dragón de cristal');

        await ctx.reply(messages.wait);
        try {
            const result = await generateImageOpenAI(prompt);
            const image = result.startsWith('data:') ? { url: result } : { url: result };
            await ctx.sock.sendMessage(ctx.from, { image, caption: `🎨 *${prompt}*` }, { quoted: ctx.msg });
        } catch (err) {
            if (String(err.message).includes('OPENAI_API_KEY')) {
                return ctx.reply(messages.aiNotConfigured('OPENAI_API_KEY'));
            }
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
};
