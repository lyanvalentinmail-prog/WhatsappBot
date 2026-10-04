/**
 * src/database/jsonAdapter.js
 * -----------------------------------------------------------------------
 * Adaptador de almacenamiento basado en un simple archivo JSON.
 * Es el driver por defecto (DATABASE_DRIVER=json) porque no requiere
 * compilar módulos nativos, lo cual es ideal para Termux.
 *
 * Si en el futuro quieres usar SQLite, Mongo, etc., solo debes crear un
 * adaptador con la misma interfaz (load/save) e intercambiarlo en
 * src/database/index.js, el resto del bot no se entera del cambio.
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import { logger } from '../utils/logger.js';

const DB_PATH = path.resolve(config.database.url);

const DEFAULT_DATA = {
    users: {},
    groups: {},
    warnings: {},
    blocked: {},
    settings: {}
};

const ensureFile = () => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    }
};

export const load = () => {
    ensureFile();
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    } catch (err) {
        logger.error('No se pudo leer la base de datos, se usará una nueva en blanco.', err);
        return { ...DEFAULT_DATA };
    }
};

let saveTimeout = null;

/** Guarda en disco con un pequeño "debounce" para no saturar el I/O */
export const save = (data) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        } catch (err) {
            logger.error('No se pudo guardar la base de datos.', err);
        }
    }, 300);
};

export default { load, save };
