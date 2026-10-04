/**
 * src/utils/banner.js
 * -----------------------------------------------------------------------
 * Pequeñas cajas ASCII bonitas para la terminal de Termux, mostrando el
 * estado del bot al iniciar y al conectarse.
 * -----------------------------------------------------------------------
 */

import chalk from 'chalk';
import config from '../../config.js';

const pad = (text, width) => {
    const str = String(text);
    const visibleLength = str.length;
    if (visibleLength >= width) return str.slice(0, width);
    return str + ' '.repeat(width - visibleLength);
};

const box = (lines, color = chalk.cyan) => {
    const width = Math.max(...lines.map((l) => l.length), 28);
    const top = `╭${'─'.repeat(width + 2)}╮`;
    const bottom = `╰${'─'.repeat(width + 2)}╯`;
    const body = lines.map((line) => `│ ${pad(line, width)} │`).join('\n');
    console.log(color(`${top}\n${body}\n${bottom}`));
};

export const printStartupBanner = () => {
    box(
        [
            '       BOT WHATSAPP',
            '',
            `  Nombre: ${config.botName}`,
            `  Versión: ${config.version}`,
            '  Estado: Iniciando...'
        ],
        chalk.cyanBright
    );
};

export const printConnectedBanner = ({ commands = 0, plugins = 0 } = {}) => {
    box(
        [
            '✓ BOT CONECTADO',
            '',
            'WhatsApp: conectado',
            `Comandos: ${commands}`,
            `Plugins: ${plugins}`
        ],
        chalk.greenBright
    );
};

export const printConnectionMenu = () => {
    console.log(
        chalk.yellow(
            '╭─〔 CONEXIÓN 〕\n' +
                '│\n' +
                '│ 1. Conectar mediante QR\n' +
                '│ 2. Conectar mediante Pairing Code\n' +
                '│\n' +
                '╰──────────────'
        )
    );
};

export default { printStartupBanner, printConnectedBanner, printConnectionMenu };
