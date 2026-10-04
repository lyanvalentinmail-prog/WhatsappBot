import messages from '../../config/messages.js';
import { removeWarning, getWarnings } from '../../database/index.js';

export default {
    name: 'unwarn',
    aliases: ['quitaradvertencia'],
    category: 'grupo',
    description: 'Quita una advertencia a un usuario',
    usage: '.unwarn @usuario',
    groupOnly: true,
    adminOnly: true,
    async execute(ctx) {
        const target = ctx.mentions[0];
        if (!target) return ctx.reply(messages.needMention);

        removeWarning(ctx.from, target);
        const total = getWarnings(ctx.from, target);
        await ctx.reply({
            text: `✅ Advertencia quitada a @${target.split('@')[0]}. Ahora tiene ${total}.`,
            mentions: [target]
        });
    }
};
