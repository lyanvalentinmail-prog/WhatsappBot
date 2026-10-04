/**
 * src/config/messages.js
 * -----------------------------------------------------------------------
 * Todos los textos que el bot envía viven aquí. Si quieres cambiar el
 * idioma, el tono o el diseño de los mensajes, este es el único archivo
 * que necesitas tocar (no deberían escribirse strings sueltos dentro
 * de los comandos).
 *
 * Símbolos estándar de estado (según la plantilla de diseño):
 *   Espera -> ⏳️      Listo -> ✅️      Error -> ❌️
 * -----------------------------------------------------------------------
 */

export const symbols = {
    wait: '⏳️',
    success: '✅️',
    error: '❌️'
};

export const messages = {
    // Permisos
    noPermission: `${symbols.error} No tienes permiso para utilizar este comando.`,
    ownerOnly:
        '╭─〔 PERMISO DENEGADO 〕\n' +
        '│\n' +
        '│ Este comando solo puede ser\n' +
        '│ utilizado por el propietario del bot.\n' +
        '│\n' +
        '╰──────────────',
    adminOnly:
        '╭─〔 PERMISO DENEGADO 〕\n' +
        '│\n' +
        '│ Este comando solo puede ser\n' +
        '│ utilizado por administradores.\n' +
        '│\n' +
        '╰──────────────',
    botAdminRequired:
        '╭─〔 FALTAN PERMISOS 〕\n' +
        '│\n' +
        '│ Necesito ser administrador del\n' +
        '│ grupo para ejecutar esta acción.\n' +
        '│\n' +
        '╰──────────────',
    groupOnly: `${symbols.error} Este comando solo funciona dentro de un grupo.`,
    privateOnly: `${symbols.error} Este comando solo funciona en chat privado.`,
    botDisabledPrivate: `🚫 El bot está en modo privado, solo el propietario puede usarlo.`,

    // Estado / utilidades
    wait: `${symbols.wait} Procesando...`,
    success: `${symbols.success} Listo.`,
    error: `${symbols.error} Ocurrió un error ejecutando el comando.`,
    commandError: (err) => `${symbols.error} Error ejecutando el comando:\n\`\`\`${err}\`\`\``,
    commandNotFound: (cmd, prefix) =>
        `${symbols.error} El comando *${cmd}* no existe. Usa *${prefix}menu* para ver la lista de comandos.`,
    needQuotedOrMedia: `${symbols.error} Responde a una imagen o video, o envíalo junto con el comando.`,
    needMention: `${symbols.error} Debes mencionar o responder al usuario objetivo.`,
    invalidNumber: `${symbols.error} El número ingresado no es válido.`,

    // Conexión
    waitingConnection: '→ Esperando conexión...',
    connected: '✓ BOT CONECTADO',
    disconnected: '✗ Conexión cerrada',
    reconnecting: '↻ Reconectando...',
    sessionInvalid: '⚠️ La sesión ya no es válida, se requiere un nuevo inicio de sesión.',

    // Genéricos de comandos
    pong: (ms) => `🏓 *Pong!*\n> Latencia: ${ms}ms`,
    processingSticker: `${symbols.wait} Creando sticker...`,
    stickerError: `${symbols.error} No se pudo crear el sticker. Asegúrate de responder a una imagen o video corto.`,
    downloadNotConfigured: `⚠️ Esta función necesita que configures DOWNLOAD_API_URL en tu archivo .env.`,
    aiNotConfigured: (service) =>
        `⚠️ Configura la variable ${service} en tu archivo .env para usar este comando.`,

    // .image (Perchance)
    imageUsage: (prefix, stylesList) =>
        `${symbols.error} Describe la imagen a generar.\n` +
        `Uso: \`${prefix}image <descripción> | <estilo>\`\n` +
        `Ej: \`${prefix}image un gato astronauta | painted-anime\`\n\n` +
        `*Estilos disponibles (Art style):*\n${stylesList}\n\n` +
        `Si no indicas estilo, se usa *No style*.`,
    imageUnknownStyle: (prefix, style, stylesList) =>
        `${symbols.error} No reconozco el estilo *"${style}"*.\n\n` +
        `*Estilos disponibles (Art style):*\n${stylesList}\n\n` +
        `Ej: \`${prefix}image un gato astronauta | painted-anime\``,
    imageError: (err) =>
        `${symbols.error} No se pudo generar la imagen con Perchance.\n` +
        `> ${err}\n\n` +
        `_Es una integración no oficial: si Perchance cambió su sitio, puede dejar de funcionar hasta actualizarla._`
};

export default messages;
