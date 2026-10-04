import messages from '../../config/messages.js';

export default {
    name: 'promote',
    aliases: ['admin'],
    category: 'grupo',
    description: 'Convierte a un usuario en administrador',
    usage: '.promote @usuario',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        const target = ctx.mentions[0];
        if (!target) return ctx.reply(messages.needMention);

        await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'promote');
        await ctx.reply({ text: `✅ @${target.split('@')[0]} ahora es administrador.`, mentions: [target] });
    }
};
