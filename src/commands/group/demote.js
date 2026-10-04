import messages from '../../config/messages.js';

export default {
    name: 'demote',
    aliases: ['unadmin'],
    category: 'grupo',
    description: 'Quita el rol de administrador a un usuario',
    usage: '.demote @usuario',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        const target = ctx.mentions[0];
        if (!target) return ctx.reply(messages.needMention);

        await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'demote');
        await ctx.reply({ text: `✅ @${target.split('@')[0]} ya no es administrador.`, mentions: [target] });
    }
};
