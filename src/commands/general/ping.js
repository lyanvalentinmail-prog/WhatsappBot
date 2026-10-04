/**
 * .ping — muestra la latencia de respuesta del bot.
 */
import messages from '../../config/messages.js';

export default {
    name: 'ping',
    aliases: ['p', 'ms'],
    category: 'general',
    description: 'Muestra la latencia del bot',
    usage: '.ping',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const start = Date.now();
        const sent = await ctx.reply('🏓 Midiendo...');
        const ms = Date.now() - start;
        await ctx.sock.sendMessage(ctx.from, { text: messages.pong(ms), edit: sent.key }).catch(() => {
            // Si el servidor/cliente no soporta edición de mensajes, se ignora el error.
        });
    }
};
