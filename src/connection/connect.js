/**
 * src/connection/connect.js
 * -----------------------------------------------------------------------
 * Módulo responsable de abrir y mantener la conexión con WhatsApp usando
 * Baileys. Soporta conexión por QR y por Pairing Code, maneja
 * reconexiones automáticas y delega cada mensaje entrante al handler
 * correspondiente (src/handlers/messages.js).
 * -----------------------------------------------------------------------
 */

import { Boom } from '@hapi/boom';
import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    Browsers
} from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import config from '../../config.js';
import { loadSession, hasSession, clearSession } from './session.js';
import { baileysLogger, logger } from '../utils/logger.js';
import { printConnectedBanner, printConnectionMenu } from '../utils/banner.js';
import { handleMessage } from '../handlers/messages.js';
import { registerEvents } from '../handlers/events.js';
import { commandHandler } from '../handlers/commands.js';

const ask = async (question) => {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
};

/** Decide el método de conexión a usar cuando no hay sesión guardada */
const resolveConnectionMethod = async () => {
    // Si el .env ya define explícitamente el método, se respeta sin preguntar.
    if (config.usePairingCode) return 'pairing';

    // Si no hay terminal interactiva (ej: proceso en background), usar QR por defecto.
    if (!process.stdin.isTTY) return 'qr';

    printConnectionMenu();
    const choice = await ask('Selecciona una opción (1/2): ');
    return choice.trim() === '2' ? 'pairing' : 'qr';
};

const resolvePairingNumber = async () => {
    if (config.pairingNumber) return config.pairingNumber;
    const number = await ask('Introduce tu número de WhatsApp (con código de país):\n> ');
    return number.replace(/[^0-9]/g, '');
};

let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30_000;

/**
 * Inicia (o reinicia) la conexión con WhatsApp.
 * @param {() => void} onReady callback ejecutado una vez conectado
 */
export const startConnection = async (onReady = () => {}) => {
    const { state, saveCreds } = await loadSession();
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: baileysLogger,
        auth: state,
        browser: Browsers.macOS('Chrome'),
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    const needsNewLogin = !hasSession();

    // ---- Pairing Code: debe solicitarse ANTES de que llegue el QR ----
    if (needsNewLogin) {
        const method = await resolveConnectionMethod();
        if (method === 'pairing') {
            try {
                const number = await resolvePairingNumber();
                if (!number) {
                    logger.error('No se proporcionó un número válido para el pairing code.');
                } else {
                    // Pequeña espera para asegurar que el socket esté listo
                    await new Promise((r) => setTimeout(r, 1500));
                    const code = await sock.requestPairingCode(number);
                    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log('\n┌───────────────────────────────┐');
                    console.log('│   Tu código de vinculación es: │');
                    console.log('└───────────────────────────────┘');
                    console.log(`\n   ${formatted}\n`);
                    console.log('Ingresa este código en: WhatsApp > Dispositivos vinculados > Vincular con número\n');
                }
            } catch (err) {
                logger.error('No se pudo generar el pairing code.', err);
            }
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && needsNewLogin && !config.usePairingCode) {
            console.log('\nEscanea este código QR desde WhatsApp (Dispositivos vinculados):\n');
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;

            if (loggedOut) {
                logger.warn('Sesión cerrada desde el teléfono. Elimina sessions/ para volver a vincular.');
                clearSession();
                process.exit(1);
            }

            reconnectAttempts += 1;
            const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY);
            logger.warn(`Conexión cerrada (código ${statusCode || 'desconocido'}). Reintentando en ${delay / 1000}s...`);

            setTimeout(() => startConnection(onReady), delay);
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            logger.success(`Conectado correctamente como ${sock.user?.id?.split(':')[0]}`);
            printConnectedBanner({
                commands: commandHandler.size,
                plugins: commandHandler.size
            });
            onReady(sock);
        }
    });

    registerEvents(sock);

    sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
        if (type !== 'notify') return;
        for (const msg of msgs) {
            handleMessage(sock, msg).catch((err) =>
                logger.error('Error no controlado en handleMessage', err)
            );
        }
    });

    return sock;
};

export default startConnection;
