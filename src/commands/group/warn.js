import messages from '../../config/messages.js';
import { addWarning } from '../../database/index.js';

const MAX_WARNINGS = 3;

export default {
    name: 'warn',
    aliases: ['advertir'],
    category: 'grupo',
    description: 'Da una advertencia a un usuario (al llegar a 3 es expulsado)',
    usage: '.warn @usuario',
    args: 'mention',
    groupOnly: true,
    adminOnly: true,
    async execute(ctx) {
        const target = ctx.mentions[0];
        if (!target) return ctx.reply(messages.needMention);

        const total = addWarning(ctx.from, target);
        await ctx.reply({
            text: `⚠️ @${target.split('@')[0]} tiene ${total}/${MAX_WARNINGS} advertencias.`,
            mentions: [target]
        });

        if (total >= MAX_WARNINGS && ctx.isBotAdmin) {
            await ctx.sock.groupParticipantsUpdate(ctx.from, [target], 'remove');
            await ctx.reply({
                text: `🚫 @${target.split('@')[0]} alcanzó el máximo de advertencias y fue expulsado.`,
                mentions: [target]
            });
        }
    }
};
