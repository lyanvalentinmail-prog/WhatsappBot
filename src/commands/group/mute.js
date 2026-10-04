import { updateGroupSettings } from '../../database/index.js';

export default {
    name: 'mute',
    aliases: ['silenciar'],
    category: 'grupo',
    description: 'Restringe el grupo para que solo los admins escriban',
    usage: '.mute',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        await ctx.sock.groupSettingUpdate(ctx.from, 'announcement');
        updateGroupSettings(ctx.from, { muted: true });
        await ctx.reply('🔇 El grupo fue silenciado. Solo los administradores pueden escribir.');
    }
};
