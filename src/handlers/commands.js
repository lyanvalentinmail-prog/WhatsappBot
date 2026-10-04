/**
 * src/handlers/commands.js
 * -----------------------------------------------------------------------
 * Carga automática de comandos y plugins.
 *
 * Cualquier archivo ".js" dentro de "src/commands/**" o "src/plugins/**"
 * que exporte (por defecto) un objeto con al menos { name, execute } se
 * registra automáticamente, junto con sus alias y su categoría. No hace
 * falta tocar ningún archivo central para agregar un comando nuevo.
 * -----------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

const COMMANDS_DIR = path.resolve('src/commands');
const PLUGINS_DIR = path.resolve('src/plugins');

/** Recorre recursivamente un directorio y devuelve todos los archivos .js */
const walk = (dir) => {
    if (!fs.existsSync(dir)) return [];
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(walk(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
};

/** Infiere la categoría de un comando a partir de su carpeta contenedora */
const inferCategory = (filePath, baseDir) => {
    const relative = path.relative(baseDir, filePath);
    const parts = relative.split(path.sep);
    return parts.length > 1 ? parts[0] : 'general';
};

class CommandHandler {
    constructor() {
        /** @type {Map<string, object>} nombre -> comando */
        this.commands = new Map();
        /** @type {Map<string, string>} alias -> nombre real */
        this.aliases = new Map();
    }

    /** Registra un comando validando su forma mínima */
    register(command, filePath) {
        if (!command || typeof command !== 'object') return;
        if (!command.name || typeof command.execute !== 'function') {
            logger.warn(`Comando inválido ignorado: ${filePath}`);
            return;
        }

        const name = command.name.toLowerCase();
        if (this.commands.has(name)) {
            logger.warn(`Comando duplicado "${name}" en ${filePath}, se sobreescribe.`);
        }

        this.commands.set(name, command);

        (command.aliases || []).forEach((alias) => {
            this.aliases.set(alias.toLowerCase(), name);
        });
    }

    /** Carga todos los comandos (src/commands) y plugins (src/plugins) */
    async loadAll() {
        this.commands.clear();
        this.aliases.clear();

        const commandFiles = walk(COMMANDS_DIR);
        const pluginFiles = walk(PLUGINS_DIR);

        for (const file of commandFiles) {
            await this.loadFile(file, COMMANDS_DIR);
        }
        for (const file of pluginFiles) {
            await this.loadFile(file, PLUGINS_DIR);
        }

        return { commands: this.commands.size, plugins: pluginFiles.length };
    }

    async loadFile(file, baseDir) {
        try {
            const url = `${pathToFileURL(file).href}?update=${Date.now()}`;
            const mod = await import(url);
            const command = mod.default || mod.command;

            if (Array.isArray(command)) {
                command.forEach((cmd) => {
                    cmd.category = cmd.category || inferCategory(file, baseDir);
                    this.register(cmd, file);
                });
            } else if (command) {
                command.category = command.category || inferCategory(file, baseDir);
                this.register(command, file);
            }
        } catch (err) {
            logger.error(`No se pudo cargar el comando/plugin: ${file}`, err);
        }
    }

    /** Busca un comando por nombre o alias */
    find(name) {
        const key = name.toLowerCase();
        if (this.commands.has(key)) return this.commands.get(key);
        if (this.aliases.has(key)) return this.commands.get(this.aliases.get(key));
        return null;
    }

    getAll() {
        return [...this.commands.values()];
    }

    getByCategory(category) {
        return this.getAll().filter((c) => (c.category || 'general') === category);
    }

    get size() {
        return this.commands.size;
    }
}

export const commandHandler = new CommandHandler();
export default commandHandler;
