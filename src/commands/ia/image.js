/**
 * src/commands/ia/image.js
 * -----------------------------------------------------------------------
 * .image <descripción> | <estilo>
 *
 * Genera una imagen con IA (modelos de Hugging Face, vía
 * src/utils/api.js -> generateImageHuggingFace), eligiendo opcionalmente
 * un "Art style" (ej: "No style", "Painted anime").
 *
 * Requiere una cuenta gratuita (sin tarjeta) en https://huggingface.co y
 * un token en HUGGINGFACE_API_KEY (.env).
 * -----------------------------------------------------------------------
 */

import messages from '../../config/messages.js';
import { menuConfig } from '../../config/menu.js';
import { generateImageHuggingFace } from '../../utils/api.js';
import { findStyle, listStylesText, defaultStyleKey, imageStyles } from '../../config/imageStyles.js';

export default {
    name: 'image',
    aliases: ['imgia', 'sdimage'],
    category: 'ia',
    description: 'Genera una imagen con IA (Hugging Face) eligiendo un Art style',
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
        let style = { key: defaultStyleKey, ...imageStyles[defaultStyleKey] };

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
            const fullPrompt = style.promptSuffix ? `${promptPart}, ${style.promptSuffix}` : promptPart;
            const buffer = await generateImageHuggingFace(fullPrompt, style.negativeSuffix);

            const caption =
                `•  ${menuConfig.aiFace} \`Image\`  ᰨᰍ\n\n` +
                `${promptPart}\n` +
                `> ── ˚. ᵎᵎ ۠ Art style: *${style.label}* (\`${styleKey}\`)`;

            await ctx.sock.sendMessage(ctx.from, { image: buffer, caption }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            if (String(err.message).includes('HUGGINGFACE_API_KEY')) {
                return ctx.reply(messages.aiNotConfigured('HUGGINGFACE_API_KEY'));
            }
            await ctx.reply(messages.imageError(err.message || err));
        }
    }
};
