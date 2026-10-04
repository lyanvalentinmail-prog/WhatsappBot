/**
 * src/utils/bratImage.js
 * -----------------------------------------------------------------------
 * Genera imágenes estilo "BRAT" (fondo liso + texto en minúsculas,
 * inspirado en el álbum de Charli XCX) 100% LOCAL, usando FFmpeg (que ya
 * es un requisito del proyecto para los stickers) y una fuente incluida
 * en el repo (assets/fonts/DejaVuSans-Bold.ttf).
 *
 * IMPORTANTE: a diferencia de la primera versión de .brat, esto NO
 * depende de ninguna API externa de terceros. Esas APIs "gratuitas" de
 * la comunidad (delirius.online y similares) se caen o desaparecen sin
 * aviso -ya nos pasó-, así que esto se genera siempre localmente y por
 * lo tanto nunca puede quedar "caído".
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { saveTempFile, safeUnlink } from './downloader.js';

const FONT_PATH = path.resolve('assets/fonts/DejaVuSans-Bold.ttf');

const THEMES = {
    green: { bg: '0x8ACE00', fg: '0x000000' },
    white: { bg: '0xFFFFFF', fg: '0x000000' },
    black: { bg: '0x000000', fg: '0xFFFFFF' }
};

// Ancho promedio de un carácter en DejaVu Sans Bold, como fracción del
// tamaño de fuente. Se usa para estimar el ancho del texto sin necesidad
// de un motor de render (no tenemos <canvas> disponible en Termux).
const AVG_CHAR_WIDTH_RATIO = 0.58;

const runFfmpeg = (args) =>
    new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args);
        let stderr = '';
        proc.stderr.on('data', (d) => (stderr += d.toString()));
        proc.on('error', reject);
        proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-500)))));
    });

/** Parte el texto en líneas que no superen `maxChars` caracteres */
const wrapLines = (text, maxChars) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [text];
};

/**
 * Busca el tamaño de fuente más grande que permita que todo el texto
 * entre dentro del lienzo (ajuste automático, similar al de los
 * generadores "brat" web).
 */
const fitText = (text, size) => {
    const padding = size * 0.09;
    const usableW = size - padding * 2;
    const usableH = size - padding * 2;
    const minFontSize = Math.floor(size * 0.045);

    let fontSize = Math.floor(size * 0.17);

    while (fontSize > minFontSize) {
        const maxChars = Math.max(1, Math.floor(usableW / (fontSize * AVG_CHAR_WIDTH_RATIO)));
        const lines = wrapLines(text, maxChars);
        const lineHeight = fontSize * 1.18;
        const totalHeight = lineHeight * lines.length;
        const longestLine = Math.max(...lines.map((l) => l.length));
        const estimatedWidth = longestLine * fontSize * AVG_CHAR_WIDTH_RATIO;

        if (totalHeight <= usableH && estimatedWidth <= usableW) {
            return { fontSize, lines, lineHeight };
        }
        fontSize -= 2;
    }

    const maxChars = Math.max(1, Math.floor(usableW / (minFontSize * AVG_CHAR_WIDTH_RATIO)));
    const lines = wrapLines(text, maxChars);
    return { fontSize: minFontSize, lines, lineHeight: minFontSize * 1.18 };
};

/**
 * Genera una imagen PNG estilo BRAT a partir de un texto.
 * @param {string} text
 * @param {{theme?: 'green'|'white'|'black', size?: number}} [options]
 * @returns {Promise<Buffer>}
 */
export const generateBratImage = async (text, { theme = 'green', size = 512 } = {}) => {
    const clean = String(text || '').trim().toLowerCase();
    if (!clean) throw new Error('Falta el texto para generar la imagen.');

    if (!fs.existsSync(FONT_PATH)) {
        throw new Error('No se encontró la fuente incluida para generar la imagen BRAT.');
    }

    const { bg, fg } = THEMES[theme] || THEMES.green;
    const { fontSize, lines, lineHeight } = fitText(clean, size);

    const outputPath = saveTempFile(Buffer.alloc(0), 'stickers', 'png');
    const lineFiles = [];

    try {
        const totalHeight = lineHeight * lines.length;
        const startY = (size - totalHeight) / 2;

        const filters = lines
            .map((line, i) => {
                const lineFile = outputPath.replace(/\.png$/, `-line${i}.txt`);
                fs.writeFileSync(lineFile, line, 'utf8');
                lineFiles.push(lineFile);

                const y = Math.round(startY + i * lineHeight);
                return (
                    `drawtext=fontfile='${FONT_PATH}':textfile='${lineFile}':` +
                    `fontcolor=${fg}:fontsize=${Math.round(fontSize)}:x=(w-text_w)/2:y=${y}`
                );
            })
            .join(',');

        await runFfmpeg([
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=${bg}:s=${size}x${size}`,
            '-vf', filters,
            '-frames:v', '1',
            outputPath
        ]);

        return fs.readFileSync(outputPath);
    } finally {
        safeUnlink(outputPath);
        lineFiles.forEach(safeUnlink);
    }
};

export default { generateBratImage };
