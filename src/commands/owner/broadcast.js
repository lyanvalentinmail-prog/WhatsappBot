import { getRawData } from '../../database/index.js';
import { sleep } from '../../utils/helpers.js';

export default {
    name: 'broadcast',
    aliases: ['bc'],
    category: 'owner',
    description: 'Envía un mensaje a todos los usuarios conocidos por el bot',
    usage: '.broadcast <mensaje>',
    ownerOnly: true,
    async execute(ctx) {
        const text = ctx.args.join(' ');
        if (!text) return ctx.reply('❌ Debes escribir un mensaje: .broadcast <mensaje>');

        const users = Object.keys(getRawData().users);
        await ctx.reply(`📣 Enviando difusión a ${users.length} chats...`);

        let sent = 0;
        for (const jid of users) {
            try {
                await ctx.sock.sendMessage(jid, { text: `📢 *Difusión*\n\n${text}` });
                sent += 1;
                await sleep(500); // Evita flood/ban por envío masivo
            } catch {
                /* se ignora si un chat falla */
            }
        }

        await ctx.reply(`✅ Difusión enviada a ${sent}/${users.length} chats.`);
    }
};
