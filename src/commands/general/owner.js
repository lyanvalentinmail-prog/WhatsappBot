/**
 * .owner — comparte el contacto del propietario/desarrollador del bot.
 */
import config from '../../../config.js';
import { toJid } from '../../utils/helpers.js';

export default {
    name: 'owner',
    aliases: ['creador', 'dev'],
    category: 'general',
    description: 'Muestra el contacto del propietario del bot',
    usage: '.owner',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        if (!config.developerNumber) {
            return ctx.reply(`👑 Propietario: *${config.botOwner}*`);
        }

        await ctx.sock.sendMessage(ctx.from, {
            contacts: {
                displayName: config.developerName || config.botOwner,
                contacts: [
                    {
                        vcard:
                            'BEGIN:VCARD\n' +
                            'VERSION:3.0\n' +
                            `FN:${config.developerName || config.botOwner}\n` +
                            `TEL;type=CELL;type=VOICE;waid=${config.developerNumber}:+${config.developerNumber}\n` +
                            'END:VCARD'
                    }
                ]
            }
        });
    }
};
