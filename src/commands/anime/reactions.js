/**
 * src/commands/anime/reactions.js
 * -----------------------------------------------------------------------
 * Comandos de reacciones estilo "anime" (.kill, .hug, .kiss, ...).
 * Se generan todos a partir de una sola plantilla para no repetir código
 * (DRY): agregar una reacción nueva es sumar una línea al arreglo
 * ACTIONS de abajo, no hay que escribir un archivo nuevo por comando.
 * -----------------------------------------------------------------------
 */

import messages from '../../config/messages.js';
import { toSmallCaps } from '../../config/menu.js';

const FACE = '૮₍ ˃̵͈᷄ . ฅ ₎ა';

const ACTIONS = [
    { name: 'kill', aliases: ['matar', 'asesinar'], verb: 'ha sido asesinado' },
    { name: 'hug', aliases: ['abrazar'], verb: 'fue abrazado cálidamente' },
    { name: 'kiss', aliases: ['besar'], verb: 'fue besado' },
    { name: 'pat', aliases: ['acariciar'], verb: 'recibió una caricia en la cabeza' },
    { name: 'slap', aliases: ['slapt', 'bofetada'], verb: 'recibió una bofetada' },
    { name: 'bite', aliases: ['morder'], verb: 'fue mordido' },
    { name: 'poke', aliases: ['tocar'], verb: 'recibió un toque' },
    { name: 'peek', aliases: ['espiar'], verb: 'está siendo espiado' }
];

const createReactionCommand = ({ name, aliases, verb }) => ({
    name,
    aliases,
    category: 'anime',
    description: `Comando de reacción de anime: ${verb}`,
    usage: `.${name} @usuario`,
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const target = ctx.mentions[0] || ctx.quoted?.key?.participant;
        if (!target) return ctx.reply(messages.needMention);

        const text =
            `❀ ${FACE}\n\n` +
            `> ${toSmallCaps(`el usuario`)} @${target.split('@')[0]} ${toSmallCaps(verb)}.\n\n` +
            `ᅟᅟ︶͜︶͜︶`;

        await ctx.reply({ text, mentions: [target] });
    }
});

export default ACTIONS.map(createReactionCommand);
