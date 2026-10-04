/**
 * src/plugins/downloader.js
 * -----------------------------------------------------------------------
 * Plugin de descargas: .youtube, .ytmp3, .ytmp4, .tiktok, .instagram,
 * .mediafire
 *
 * El bot NO trae "hardcodeada" ninguna API de terceros. Toda descarga se
 * resuelve contra la API que tú configures en DOWNLOAD_API_URL (.env),
 * mediante el contrato definido en src/utils/api.js (fetchDownload).
 *
 * Se espera que esa API responda JSON con, al menos:
 *   { "url": "https://enlace-directo-al-archivo", "title": "opcional" }
 *
 * Si no configuras DOWNLOAD_API_URL, los comandos avisan claramente en
 * vez de fallar en silencio.
 * -----------------------------------------------------------------------
 */

import messages from '../config/messages.js';
import config from '../../config.js';
import { fetchDownload } from '../utils/api.js';
import { getBuffer, isUrl } from '../utils/helpers.js';

const createDownloadCommand = ({ name, aliases, endpoint, label, sendAs }) => ({
    name,
    aliases,
    category: 'descargas',
    description: `Descarga contenido de ${label}`,
    usage: `.${name} <enlace>`,
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        if (!config.downloads.apiUrl) return ctx.reply(messages.downloadNotConfigured);

        const url = ctx.args[0];
        if (!url || !isUrl(url)) return ctx.reply(`❌ Envía un enlace válido. Ej: .${name} https://...`);

        await ctx.reply(messages.wait);
        try {
            const result = await fetchDownload(endpoint, url);
            const fileUrl = result?.url || result?.data?.url;
            if (!fileUrl) throw new Error('La API de descargas no devolvió un enlace válido.');

            const buffer = await getBuffer(fileUrl);
            const caption = `✅ ${result.title || label}`;

            if (sendAs === 'audio') {
                await ctx.sock.sendMessage(ctx.from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
            } else if (sendAs === 'video') {
                await ctx.sock.sendMessage(ctx.from, { video: buffer, caption }, { quoted: ctx.msg });
            } else {
                await ctx.sock.sendMessage(ctx.from, { document: buffer, fileName: `${name}.bin`, caption }, { quoted: ctx.msg });
            }
        } catch (err) {
            await ctx.reply(messages.commandError(err.message || err));
        }
    }
});

export default [
    createDownloadCommand({ name: 'youtube', aliases: ['yt'], endpoint: 'youtube', label: 'YouTube', sendAs: 'video' }),
    createDownloadCommand({ name: 'ytmp3', aliases: ['ytaudio'], endpoint: 'ytmp3', label: 'YouTube (audio)', sendAs: 'audio' }),
    createDownloadCommand({ name: 'ytmp4', aliases: ['ytvideo'], endpoint: 'ytmp4', label: 'YouTube (video)', sendAs: 'video' }),
    createDownloadCommand({ name: 'tiktok', aliases: ['tt'], endpoint: 'tiktok', label: 'TikTok', sendAs: 'video' }),
    createDownloadCommand({ name: 'instagram', aliases: ['ig'], endpoint: 'instagram', label: 'Instagram', sendAs: 'video' }),
    createDownloadCommand({ name: 'mediafire', aliases: ['mf'], endpoint: 'mediafire', label: 'Mediafire', sendAs: 'document' })
];
