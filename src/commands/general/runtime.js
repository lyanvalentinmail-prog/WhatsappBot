/**
 * .runtime — tiempo que lleva encendido el bot.
 */
import { formatRuntime } from '../../utils/helpers.js';

export default {
    name: 'runtime',
    aliases: ['uptime'],
    category: 'general',
    description: 'Muestra cuánto tiempo lleva encendido el bot',
    usage: '.runtime',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        await ctx.reply(`⏱️ El bot lleva encendido: *${formatRuntime(process.uptime() * 1000)}*`);
    }
};
