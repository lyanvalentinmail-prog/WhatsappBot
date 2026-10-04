/**
 * index.js
 * -----------------------------------------------------------------------
 * Punto de entrada del bot. Este archivo es intencionalmente pequeño:
 * toda la lógica real vive en src/. Aquí solo se orquesta el arranque:
 *   1. Mostrar el banner de inicio.
 *   2. Cargar comandos y plugins.
 *   3. Abrir la conexión con WhatsApp (QR o Pairing Code).
 * -----------------------------------------------------------------------
 */

import config from './config.js';
import { logger } from './src/utils/logger.js';
import { printStartupBanner } from './src/utils/banner.js';
import { commandHandler } from './src/handlers/commands.js';
import { startConnection } from './src/connection/connect.js';

const main = async () => {
    printStartupBanner();

    logger.success('Configuración cargada');

    const { commands, plugins } = await commandHandler.loadAll();
    logger.success(`Comandos cargados (${commands})`);
    logger.success(`Plugins cargados (${plugins})`);

    logger.success('Sistema iniciado');
    logger.info('→ Esperando conexión...');

    await startConnection();
};

// ---- Manejo global de errores: el bot nunca debe cerrarse por sorpresa ----
process.on('uncaughtException', (err) => {
    logger.error('Excepción no capturada', err);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Promesa rechazada sin manejar', reason);
});

main().catch((err) => {
    logger.error('Error fatal al iniciar el bot', err);
    process.exit(1);
});
