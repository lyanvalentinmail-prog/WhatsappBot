import messages from '../../config/messages.js';
import { blockUser } from '../../database/index.js';

export default {
    name: 'block',
    aliases: ['bloquear'],
    category: 'owner',
    description: 'Bloquea a un usuario para que no use el bot',
    usage: '.block @usuario',
    args: 'mention',
    ownerOnly: true,
    async execute(ctx) {
        const target = ctx.mentions[0] || ctx.quoted?.key?.participant;
        if (!target) return ctx.reply(messages.needMention);

        blockUser(target);
        await ctx.reply({ text: `🚫 @${target.split('@')[0]} fue bloqueado.`, mentions: [target] });
    }
};
