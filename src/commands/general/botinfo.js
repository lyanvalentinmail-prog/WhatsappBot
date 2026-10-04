/**
 * .botinfo — información general sobre el bot.
 */
import os from 'os';
import config from '../../../config.js';
import { commandHandler } from '../../handlers/commands.js';
import { formatRuntime, formatBytes } from '../../utils/helpers.js';

export default {
    name: 'botinfo',
    aliases: ['infobot', 'about'],
    category: 'general',
    description: 'Muestra información técnica del bot',
    usage: '.botinfo',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const uptime = formatRuntime(process.uptime() * 1000);
        const mem = formatBytes(process.memoryUsage().rss);

        const text =
            `╭─〔 ${config.botName} 〕\n` +
            `│\n` +
            `│ Versión: ${config.version}\n` +
            `│ Prefijo: ${config.prefix}\n` +
            `│ Owner: ${config.botOwner}\n` +
            `│ Modo: ${config.mode}\n` +
            `│ Comandos: ${commandHandler.size}\n` +
            `│ Uptime: ${uptime}\n` +
            `│ RAM usada: ${mem}\n` +
            `│ Node.js: ${process.version}\n` +
            `│ Plataforma: ${os.platform()} (${os.arch()})\n` +
            `│\n` +
            `╰──────────────`;

        await ctx.reply(text);
    }
};
