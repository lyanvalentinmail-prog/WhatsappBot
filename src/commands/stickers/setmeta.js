/**
 * src/commands/stickers/setmeta.js
 * -----------------------------------------------------------------------
 * .setmeta — guarda un pack/autor por defecto para tus stickers, así no
 * tienes que escribirlos cada vez que uses .sticker. Se guarda por
 * usuario (remitente), no por chat/grupo.
 *
 * Formatos admitidos:
 *   .setmeta Mi Pack            -> solo pack
 *   .setmeta Mi Pack|Mi Autor   -> pack y autor
 *   .setmeta |Mi Autor          -> solo autor (deja el pack en blanco)
 * El separador puede ser "|", "/", "\" o "•".
 * -----------------------------------------------------------------------
 */

import messages from '../../config/messages.js';
import { setStickerMeta } from '../../database/index.js';

export default {
    name: 'setmeta',
    aliases: ['stickermeta'],
    category: 'stickers',
    description: 'Guarda un pack/autor por defecto para tus stickers',
    usage: '.setmeta <Pack> | <Autor>',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const text = ctx.args.join(' ').trim();

        if (!text) {
            return ctx.reply(messages.setMetaUsage(ctx.prefix));
        }

        const hasSeparator = /[|/\\•]/.test(text);

        if (!hasSeparator) {
            // Solo se indicó el pack
            setStickerMeta(ctx.sender, { pack: text, author: '' });
            return ctx.reply(messages.setMetaPackOnly(text));
        }

        const [rawPack, rawAuthor] = text.split(/[|/\\•]/).map((s) => s?.trim() || '');

        if (rawPack && rawAuthor) {
            setStickerMeta(ctx.sender, { pack: rawPack, author: rawAuthor });
            return ctx.reply(messages.setMetaBoth(rawPack, rawAuthor));
        }

        if (!rawPack && rawAuthor) {
            setStickerMeta(ctx.sender, { pack: '', author: rawAuthor });
            return ctx.reply(messages.setMetaAuthorOnly(rawAuthor));
        }

        if (rawPack && !rawAuthor) {
            setStickerMeta(ctx.sender, { pack: rawPack, author: '' });
            return ctx.reply(messages.setMetaPackOnly(rawPack));
        }

        return ctx.reply(messages.setMetaUsage(ctx.prefix));
    }
};
