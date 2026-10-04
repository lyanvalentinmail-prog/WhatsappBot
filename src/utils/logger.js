/**
 * src/utils/logger.js
 * -----------------------------------------------------------------------
 * Sistema de logs simple y seguro:
 *  - Imprime mensajes bonitos y coloreados en la consola de Termux.
 *  - Guarda un historial completo (incluyendo errores con stack trace)
 *    dentro de la carpeta logs/, SIN exponer nunca API keys ni tokens.
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import pino from 'pino';

const LOG_DIR = path.resolve('logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);

/** Oculta posibles API keys / tokens antes de guardar en disco */
const sanitize = (text = '') =>
    String(text)
        .replace(/(sk-[a-zA-Z0-9]{10,})/g, 'sk-***REDACTED***')
        .replace(/(AIza[a-zA-Z0-9_-]{10,})/g, 'AIza***REDACTED***')
        .replace(/(gsk_[a-zA-Z0-9]{10,})/g, 'gsk_***REDACTED***')
        .replace(/(Bearer\s+)[^\s]+/gi, '$1***REDACTED***');

const writeToFile = (level, message) => {
    try {
        const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${sanitize(message)}\n`;
        fs.appendFileSync(logFile, line);
    } catch {
        // Si falla el log a disco, no debe romper el bot.
    }
};

const timestamp = () => new Date().toLocaleTimeString();

export const logger = {
    info: (msg) => {
        console.log(chalk.cyan(`[${timestamp()}] ℹ `) + msg);
        writeToFile('info', msg);
    },
    success: (msg) => {
        console.log(chalk.green(`[${timestamp()}] ✓ `) + msg);
        writeToFile('success', msg);
    },
    warn: (msg) => {
        console.log(chalk.yellow(`[${timestamp()}] ⚠ `) + msg);
        writeToFile('warn', msg);
    },
    error: (msg, err) => {
        const extra = err instanceof Error ? `\n${err.stack}` : err ? `\n${JSON.stringify(err)}` : '';
        console.log(chalk.red(`[${timestamp()}] ✗ `) + msg);
        writeToFile('error', `${msg}${extra}`);
    },
    debug: (msg) => {
        if (process.env.DEBUG === 'true') {
            console.log(chalk.gray(`[${timestamp()}] • `) + msg);
        }
        writeToFile('debug', msg);
    }
};

/**
 * Logger "silencioso" exigido internamente por Baileys.
 * Se mantiene separado del logger bonito de arriba para no ensuciar
 * la consola con el detalle interno de la librería.
 */
export const baileysLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'silent' });

export default logger;
