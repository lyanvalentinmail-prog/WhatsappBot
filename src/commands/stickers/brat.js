/**
 * src/commands/stickers/brat.js
 * -----------------------------------------------------------------------
 * .brat — genera un sticker estilo "BRAT" (fondo liso + texto, inspirado
 * en el álbum de Charli XCX) a partir de un texto, usando la API pública
 * y gratuita de delirius.online. No requiere API key.
 *
 * Basado en: https://github.com/Ryuzei-Ts/Raiden-WaBot/blob/main/commands/stickers/brat.ts
 * -----------------------------------------------------------------------
 */

import config from '../../../config.js';
import messages from '../../config/messages.js';
import { fetchBratImage } from '../../utils/api.js';
import { bufferToSticker, addStickerMetadata } from '../../utils/downloader.js';

/** Igual que en .sticker: ".brat Hola mundo|Mi Pack|Mi Autor" (opcional) */
const parsePackAuthor = (argsText) => {
    if (!argsText) return {};
    const parts = argsText.split(/[|/\\•]/).map((s) => s?.trim());
    return { pack: parts[1] || '', author: parts[2] || '' };
};

export default {
    name: 'brat',
    aliases: ['bratsticker'],
    category: 'stickers',
    description: 'Genera un sticker estilo BRAT con tu texto',
    usage: '.brat <texto>',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const fullText = ctx.args.join(' ').trim();
        if (!fullText) {
            return ctx.reply(`❌️ ¿Qué texto quieres poner?\nEj: *${ctx.prefix}brat Hola mundo*`);
        }

        // Solo el texto (antes del primer separador) se usa para la imagen.
        const text = fullText.split(/[|/\\•]/)[0].trim();
        const { pack, author } = parsePackAuthor(fullText);

        await ctx.react('⏳️');

        try {
            const imageBuffer = await fetchBratImage(text);
            const webp = await bufferToSticker(imageBuffer, false);
            const sticker = await addStickerMetadata(webp, {
                packname: pack || config.botName,
                author: author || config.botOwner
            });

            await ctx.sock.sendMessage(ctx.from, { sticker }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
};
