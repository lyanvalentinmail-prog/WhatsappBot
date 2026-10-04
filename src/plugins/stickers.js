/**
 * src/plugins/stickers.js
 * -----------------------------------------------------------------------
 * Plugin de stickers:
 *   .sticker / .s   -> convierte una imagen o video corto en sticker
 *   .toimg          -> convierte un sticker de vuelta a imagen
 * Usa FFmpeg (debe estar instalado: "pkg install ffmpeg" en Termux).
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import { spawn } from 'child_process';
import messages from '../config/messages.js';
import config from '../../config.js';
import { getMessageType, getQuotedMessage, downloadMedia } from '../utils/formatter.js';
import { bufferToSticker, addStickerMetadata, saveTempFile, safeUnlink } from '../utils/downloader.js';
import { getStickerMeta } from '../database/index.js';

const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args);
        let stderr = '';
        proc.stderr.on('data', (d) => (stderr += d.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-400)))));
    });

/**
 * Permite personalizar el nombre del pack y el autor del sticker
 * escribiendo ".sticker Mi Pack|Mi Autor" (separador "|", "/" o "•").
 * Si no se indica nada, se usan los valores por defecto del bot.
 */
const parsePackAuthor = (argsText) => {
    if (!argsText) return {};
    const [pack, author] = argsText.split(/[|/\\•]/).map((s) => s?.trim());
    return { pack: pack || '', author: author || '' };
};

const stickerCommand = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    category: 'stickers',
    description: 'Convierte una imagen o video corto en un sticker',
    usage: '.sticker (respondiendo a una imagen/video, opcionalmente: Pack|Autor)',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const quoted = getQuotedMessage(ctx.msg);
        const target = quoted || ctx.msg;
        const type = getMessageType(target);

        if (!['imageMessage', 'videoMessage', 'stickerMessage'].includes(type)) {
            return ctx.reply(messages.needQuotedOrMedia);
        }

        // En vez de mandar un mensaje de texto "Creando sticker...", se
        // reacciona al mensaje original con un emoji (menos intrusivo).
        await ctx.react('⏳️');

        try {
            const buffer = await downloadMedia(ctx.msg);
            if (!buffer) {
                await ctx.react('❌️');
                return ctx.reply(messages.stickerError);
            }

            let { pack, author } = parsePackAuthor(ctx.args.join(' '));

            // Si no se indicó pack/autor en el comando, usamos el que el
            // usuario haya guardado con .setmeta (si tiene uno guardado).
            if (!pack && !author) {
                const saved = getStickerMeta(ctx.sender);
                pack = saved.pack || '';
                author = saved.author || '';
            }

            const isVideo = type === 'videoMessage';
            const webp = await bufferToSticker(buffer, isVideo);
            const final = await addStickerMetadata(webp, {
                packname: pack || config.botName,
                author: author || config.botOwner
            });

            await ctx.sock.sendMessage(ctx.from, { sticker: final }, { quoted: ctx.msg });
            await ctx.react('✅️');
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.stickerError);
        }
    }
};

const toImgCommand = {
    name: 'toimg',
    aliases: ['toimage', 'tomedia'],
    category: 'stickers',
    description: 'Convierte un sticker en imagen',
    usage: '.toimg (respondiendo a un sticker)',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const quoted = getQuotedMessage(ctx.msg);
        const target = quoted || ctx.msg;
        const type = getMessageType(target);

        if (type !== 'stickerMessage') {
            return ctx.reply('❌️ Responde a un sticker para convertirlo en imagen.');
        }

        await ctx.react('⏳️');

        try {
            const buffer = await downloadMedia(ctx.msg);
            if (!buffer) {
                await ctx.react('❌️');
                return ctx.reply(messages.error);
            }

            const inputPath = saveTempFile(buffer, 'stickers', 'webp');
            const outputPath = inputPath.replace('.webp', '.png');

            await runFfmpeg(['-y', '-i', inputPath, outputPath]);
            const imageBuffer = fs.readFileSync(outputPath);

            await ctx.sock.sendMessage(ctx.from, { image: imageBuffer }, { quoted: ctx.msg });
            await ctx.react('✅️');

            safeUnlink(inputPath);
            safeUnlink(outputPath);
        } catch (err) {
            await ctx.react('❌️');
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
};

export default [stickerCommand, toImgCommand];
