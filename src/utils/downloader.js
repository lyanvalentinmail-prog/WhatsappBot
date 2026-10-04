/**
 * src/utils/downloader.js
 * -----------------------------------------------------------------------
 * Utilidades para guardar archivos temporales en media/ y convertir
 * imágenes/videos a stickers (.webp) usando FFmpeg (debe estar instalado
 * en el sistema: "pkg install ffmpeg" en Termux).
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import webpmux from 'node-webpmux';
import { randomId } from './helpers.js';

const MEDIA_DIR = path.resolve('media');

/** Asegura que exista la subcarpeta de media indicada y devuelve su ruta */
const ensureDir = (sub) => {
    const dir = path.join(MEDIA_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
};

/** Guarda un buffer en media/<sub>/ con un nombre único y devuelve la ruta */
export const saveTempFile = (buffer, sub = 'images', extension = 'bin') => {
    const dir = ensureDir(sub);
    const filePath = path.join(dir, `${Date.now()}-${randomId()}.${extension}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
};

/** Elimina un archivo si existe, sin lanzar error si falla */
export const safeUnlink = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        /* noop */
    }
};

/** Ejecuta un comando de sistema (usado para invocar ffmpeg directamente) */
const runCommand = (cmd, args) =>
    new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let stderr = '';
        proc.stderr.on('data', (d) => (stderr += d.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} terminó con código ${code}: ${stderr.slice(-500)}`));
        });
    });

/**
 * Convierte una imagen o video (buffer) a un sticker .webp usando FFmpeg.
 * @param {Buffer} buffer Imagen o video de entrada
 * @param {boolean} isVideo true si el medio de entrada es un video/gif
 * @returns {Promise<Buffer>} Buffer del sticker .webp resultante
 */
export const bufferToSticker = async (buffer, isVideo = false) => {
    const inputExt = isVideo ? 'mp4' : 'png';
    const inputPath = saveTempFile(buffer, 'stickers', inputExt);
    const outputPath = inputPath.replace(`.${inputExt}`, '.webp');

    try {
        const args = isVideo
            ? [
                  '-y',
                  '-i', inputPath,
                  '-vcodec', 'libwebp',
                  '-vf',
                  "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=12,pad=512:512:-1:-1:color=white@0.0,format=rgba",
                  '-loop', '0',
                  '-ss', '00:00:00',
                  '-t', '00:00:06',
                  '-preset', 'default',
                  '-an',
                  '-vsync', '0',
                  outputPath
              ]
            : [
                  '-y',
                  '-i', inputPath,
                  '-vf',
                  "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000",
                  outputPath
              ];

        await runCommand('ffmpeg', args);
        const webpBuffer = fs.readFileSync(outputPath);
        return webpBuffer;
    } finally {
        safeUnlink(inputPath);
        safeUnlink(outputPath);
    }
};

/**
 * Agrega metadatos EXIF (nombre del pack / autor) a un sticker .webp.
 * @param {Buffer} webpBuffer
 * @param {{packname: string, author: string}} options
 */
export const addStickerMetadata = async (webpBuffer, { packname = '', author = '' } = {}) => {
    const img = new webpmux.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': `bot-whatsapp-${Date.now()}`,
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        emojis: ['🤖']
    };

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;
    return img.save(null);
};

export default { saveTempFile, safeUnlink, bufferToSticker, addStickerMetadata };
