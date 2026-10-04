/**
 * src/config/bot.js
 * -----------------------------------------------------------------------
 * Configuración general del comportamiento del bot.
 * Modifica estos valores (o mejor aún, las variables en ".env") para
 * personalizar el bot sin tocar el resto del código fuente.
 * -----------------------------------------------------------------------
 */

import config from '../../config.js';

/**
 * Números que se consideran "propietarios" del bot.
 * Se arma a partir de DEVELOPER_NUMBER y PAIRING_NUMBER del .env.
 * Puedes agregar más números manualmente en el arreglo "extraOwners".
 */
const extraOwners = [
    // Ejemplo: '598999999999'
];

export const ownerNumbers = [
    ...new Set(
        [config.developerNumber, config.pairingNumber, ...extraOwners]
            .filter(Boolean)
            .map((n) => n.replace(/[^0-9]/g, ''))
    )
];

export const botConfig = {
    name: config.botName,
    owner: config.botOwner,
    prefix: config.prefix,
    allowNoPrefix: config.allowNoPrefix,
    mode: config.mode, // 'public' | 'private'
    language: config.language,
    menuStyle: config.menuStyle,
    version: config.version,

    // Emojis/símbolos usados en respuestas (fácil de cambiar)
    symbols: {
        success: '✅️',
        error: '❌️',
        wait: '⏳️',
        warn: '⚠️',
        info: 'ℹ️',
        bullet: '•',
        arrow: '➥'
    }
};

export default botConfig;
