/**
 * src/commands/stickers/brat.js
 * -----------------------------------------------------------------------
 * .brat — genera un sticker estilo "BRAT" (fondo liso + texto, inspirado
 * en el álbum de Charli XCX) a partir de un texto.
 *
 * La imagen se genera 100% LOCAL con FFmpeg (ver src/utils/bratImage.js):
 * no depende de ninguna API externa, así que siempre funciona mientras
 * tengas FFmpeg instalado (ya es un requisito del bot para los demás
 * comandos de sticker).
 * -----------------------------------------------------------------------
 */

import config from '../../../config.js';
import messages from '../../config/messages.js';
import { generateBratImage } from '../../utils/bratImage.js';
import { bufferToSticker, addStickerMetadata } from '../../utils/downloader.js';

const THEMES = ['green', 'white', 'black'];

export default {
    name: 'brat',
    aliases: ['bratsticker'],
    category: 'stickers',
    description: 'Genera un sticker estilo BRAT con tu texto',
    usage: '.brat <texto> (opcional: | verde/blanco/negro)',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const fullText = ctx.args.join(' ').trim();
        if (!fullText) {
            return ctx.reply(
                `❌️ ¿Qué texto quieres poner?\nEj: *${ctx.prefix}brat Hola mundo*\n` +
                    `Colores: *${ctx.prefix}brat Hola mundo | blanco*`
            );
        }

        const [text, colorArg] = fullText.split('|').map((s) => s?.trim());
        const colorMap = { verde: 'green', blanco: 'white', negro: 'black' };
        const theme = THEMES.includes(colorArg) ? colorArg : colorMap[colorArg?.toLowerCase()] || 'green';

        await ctx.react('⏳️');

        try {
            const imageBuffer = await generateBratImage(text, { theme });
            const webp = await bufferToSticker(imageBuffer, false);
            const sticker = await addStickerMetadata(webp, {
                packname: config.botName,
                author: config.botOwner
            });

            await ctx.sock.sendMessage(ctx.from, { sticker }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
};
