import messages from '../../config/messages.js';

export default {
    name: 'kick',
    aliases: ['ban'],
    category: 'grupo',
    description: 'Expulsa a un usuario del grupo',
    usage: '.kick @usuario',
    args: 'mention',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        const target = ctx.mentions[0];
        if (!target) return ctx.reply(messages.needMention);

        await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'remove');
        await ctx.reply({ text: `✅️ @${target.split('@')[0]} fue expulsado del grupo.`, mentions: [target] });
    }
};
