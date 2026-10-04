import messages from '../../config/messages.js';
import { unblockUser } from '../../database/index.js';

export default {
    name: 'unblock',
    aliases: ['desbloquear'],
    category: 'owner',
    description: 'Desbloquea a un usuario previamente bloqueado',
    usage: '.unblock @usuario',
    ownerOnly: true,
    async execute(ctx) {
        const target = ctx.mentions[0] || ctx.quoted?.key?.participant;
        if (!target) return ctx.reply(messages.needMention);

        unblockUser(target);
        await ctx.reply({ text: `✅ @${target.split('@')[0]} fue desbloqueado.`, mentions: [target] });
    }
};
