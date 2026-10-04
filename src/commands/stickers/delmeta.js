/**
 * src/commands/stickers/delmeta.js
 * -----------------------------------------------------------------------
 * .delmeta — borra el pack/autor por defecto que hayas guardado con
 * .setmeta. Tus próximos stickers volverán a usar los valores por
 * defecto del bot (nombre del bot / dueño del bot).
 * -----------------------------------------------------------------------
 */

import messages from '../../config/messages.js';
import { clearStickerMeta } from '../../database/index.js';

export default {
    name: 'delmeta',
    aliases: ['deletemeta', 'resetmeta'],
    category: 'stickers',
    description: 'Elimina el pack/autor guardado para tus stickers',
    usage: '.delmeta',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const had = clearStickerMeta(ctx.sender);
        return ctx.reply(had ? messages.delMetaSuccess : messages.delMetaEmpty);
    }
};
