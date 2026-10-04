/**
 * src/commands/stickers/ssearch.js
 * -----------------------------------------------------------------------
 * .ssearch — busca stickers por nombre/tema en Sticker.ly y envía uno
 * como sticker de WhatsApp, usando la API pública y gratuita de
 * delirius.online. No requiere API key.
 *
 * Basado en: https://github.com/Ryuzei-Ts/Raiden-WaBot/blob/main/commands/stickers/ssearch.ts
 * -----------------------------------------------------------------------
 */

import config from '../../../config.js';
import messages from '../../config/messages.js';
import { searchStickerly, fetchBuffer } from '../../utils/api.js';
import { bufferToSticker, addStickerMetadata } from '../../utils/downloader.js';

// Recuerda, por remitente + búsqueda, qué previews ya se enviaron, para
// no repetir siempre el mismo resultado al pedir lo mismo varias veces.
const usedPreviews = new Map();

const pickPack = (results, cacheKey) => {
    if (!usedPreviews.has(cacheKey)) usedPreviews.set(cacheKey, new Set());
    const used = usedPreviews.get(cacheKey);

    let pack = results.find((p) => p?.preview && !p.isAnimated && !used.has(p.preview));

    if (!pack) {
        // Ya se usaron todos: reiniciamos y repetimos desde el principio.
        used.clear();
        pack = results.find((p) => p?.preview && !p.isAnimated) || results.find((p) => p?.preview);
    }

    if (pack) used.add(pack.preview);
    return pack;
};

export default {
    name: 'ssearch',
    aliases: ['stickerly'],
    category: 'stickers',
    description: 'Busca y envía un sticker de Sticker.ly según tu búsqueda',
    usage: '.ssearch <búsqueda>',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const query = ctx.args.join(' ').trim();
        if (!query) {
            return ctx.reply(`❌️ ¿Qué sticker quieres buscar?\nEj: *${ctx.prefix}ssearch my melody*`);
        }

        await ctx.react('⏳️');

        try {
            const results = await searchStickerly(query);
            if (!results.length) {
                await ctx.react('❌️');
                return ctx.reply(`❌️ No se encontraron stickers para *"${query}"*.`);
            }

            const cacheKey = `${ctx.sender}_${query.toLowerCase()}`;
            const pack = pickPack(results, cacheKey);

            if (!pack?.preview) {
                await ctx.react('❌️');
                return ctx.reply(`❌️ No se encontraron stickers disponibles para *"${query}"*.`);
            }

            const previewBuffer = await fetchBuffer(pack.preview);
            const webp = await bufferToSticker(previewBuffer, false);
            const sticker = await addStickerMetadata(webp, {
                packname: pack.name || query,
                author: ctx.msg.pushName || config.botOwner
            });

            await ctx.sock.sendMessage(ctx.from, { sticker }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
};
