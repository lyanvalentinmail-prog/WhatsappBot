import messages from '../../config/messages.js';
import { toJid, normalizeNumber } from '../../utils/helpers.js';

export default {
    name: 'add',
    aliases: ['invitar'],
    category: 'grupo',
    description: 'Agrega un número al grupo',
    usage: '.add 5491122334455',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    async execute(ctx) {
        const number = normalizeNumber(ctx.args[0]);
        if (!number) return ctx.reply(messages.invalidNumber);

        const jid = toJid(number);
        try {
            await ctx.sock.groupParticipantsUpdate(ctx.from, [jid], 'add');
            await ctx.reply(`✅ Se envió la invitación a +${number}.`);
        } catch (err) {
            await ctx.reply('❌ No se pudo agregar al usuario (puede tener la privacidad restringida).');
        }
    }
};
