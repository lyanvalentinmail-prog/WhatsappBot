/**
 * src/commands/ia/image.js
 * -----------------------------------------------------------------------
 * .image <descripción> | <estilo>
 *
 * Genera una imagen con el generador de IA de Perchance
 * (https://perchance.org/ai-text-to-image-generator), eligiendo
 * opcionalmente un "Art style" (ej: "No style", "Painted anime").
 *
 * Es una integración NO OFICIAL (Perchance no tiene API pública): la
 * lógica real vive en src/utils/perchance.js, sin usar ningún navegador
 * automatizado (solo pedidos HTTP comunes vía axios).
 * -----------------------------------------------------------------------
 */

import messages from '../../config/messages.js';
import { menuConfig } from '../../config/menu.js';
import { generatePerchanceImage } from '../../utils/perchance.js';
import { findStyle, listStylesText, defaultStyleKey, perchanceStyles } from '../../config/perchanceStyles.js';

export default {
    name: 'image',
    aliases: ['perchance', 'imgia'],
    category: 'ia',
    description: 'Genera una imagen con IA (Perchance) eligiendo un Art style',
    usage: '.image un gato astronauta | painted-anime',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const raw = ctx.args.join(' ').trim();

        if (!raw) {
            return ctx.reply(messages.imageUsage(ctx.prefix, listStylesText()));
        }

        // ".image estilos" / ".image styles" -> solo lista los estilos disponibles
        if (/^(estilos|styles)$/i.test(raw)) {
            return ctx.reply(`🎨 *Art styles disponibles:*\n\n${listStylesText()}`);
        }

        const [promptPart, stylePart] = raw.split('|').map((part) => part?.trim());

        if (!promptPart) {
            return ctx.reply(messages.imageUsage(ctx.prefix, listStylesText()));
        }

        let styleKey = defaultStyleKey;
        let style = { key: defaultStyleKey, ...perchanceStyles[defaultStyleKey] };

        if (stylePart) {
            const found = findStyle(stylePart);
            if (!found) {
                return ctx.reply(messages.imageUnknownStyle(ctx.prefix, stylePart, listStylesText()));
            }
            style = found;
            styleKey = found.key;
        }

        await ctx.react('⏳️');
        try {
            const { buffer } = await generatePerchanceImage({ prompt: promptPart, style });

            const caption =
                `•  ${menuConfig.aiFace} \`Image (Perchance)\`  ᰨᰍ\n\n` +
                `${promptPart}\n` +
                `> ── ˚. ᵎᵎ ۠ Art style: *${style.label}* (\`${styleKey}\`)`;

            await ctx.sock.sendMessage(ctx.from, { image: buffer, caption }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.imageError(err.message || err));
        }
    }
};
