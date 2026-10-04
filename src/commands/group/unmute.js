import { updateGroupSettings } from '../../database/index.js';

export default {
    name: 'unmute',
    aliases: ['activar'],
    category: 'grupo',
    description: 'Permite que todos los miembros vuelvan a escribir',
    usage: '.unmute',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        await ctx.sock.groupSettingUpdate(ctx.from, 'not_announcement');
        updateGroupSettings(ctx.from, { muted: false });
        await ctx.reply('🔊 El grupo ya no está silenciado. Todos pueden escribir.');
    }
};
