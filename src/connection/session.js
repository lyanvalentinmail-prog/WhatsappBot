/**
 * src/connection/session.js
 * -----------------------------------------------------------------------
 * Manejo del almacenamiento de la sesión de WhatsApp (credenciales).
 * Usa el sistema de archivos múltiples de Baileys ("useMultiFileAuthState")
 * guardando todo dentro de la carpeta sessions/, para que al reiniciar el
 * bot no sea necesario volver a escanear el QR ni pedir el pairing code.
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';

export const SESSION_DIR = path.resolve('sessions');

/** Devuelve true si ya existe una sesión guardada localmente */
export const hasSession = () => {
    if (!fs.existsSync(SESSION_DIR)) return false;
    const files = fs.readdirSync(SESSION_DIR);
    return files.some((f) => f.startsWith('creds.json'));
};

/** Carga (o crea) el estado de autenticación persistido en sessions/ */
export const loadSession = async () => {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
    return useMultiFileAuthState(SESSION_DIR);
};

/** Elimina completamente la sesión guardada (fuerza un nuevo login) */
export const clearSession = () => {
    try {
        if (fs.existsSync(SESSION_DIR)) {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            fs.mkdirSync(SESSION_DIR, { recursive: true });
            logger.warn('Sesión eliminada. Se requerirá un nuevo QR o Pairing Code.');
        }
    } catch (err) {
        logger.error('No se pudo eliminar la sesión.', err);
    }
};

export default { SESSION_DIR, hasSession, loadSession, clearSession };
