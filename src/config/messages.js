/**
 * src/config/messages.js
 * -----------------------------------------------------------------------
 * Todos los textos que el bot envía viven aquí. Si quieres cambiar el
 * idioma, el tono o el diseño de los mensajes, este es el único archivo
 * que necesitas tocar (no deberían escribirse strings sueltos dentro
 * de los comandos).
 * -----------------------------------------------------------------------
 */

export const messages = {
    // Permisos
    noPermission: '❌ No tienes permiso para utilizar este comando.',
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
    groupOnly: '❌ Este comando solo funciona dentro de un grupo.',
    privateOnly: '❌ Este comando solo funciona en chat privado.',
    botDisabledPrivate: '🚫 El bot está en modo privado, solo el propietario puede usarlo.',

    // Estado / utilidades
    wait: '⏳ Procesando...',
    error: '❌ Ocurrió un error ejecutando el comando.',
    commandError: (err) => `❌ Error ejecutando el comando:\n\`\`\`${err}\`\`\``,
    commandNotFound: (cmd, prefix) =>
        `❌ El comando *${cmd}* no existe. Usa *${prefix}menu* para ver la lista de comandos.`,
    needQuotedOrMedia: '❌ Responde a una imagen o video, o envíalo junto con el comando.',
    needMention: '❌ Debes mencionar o responder al usuario objetivo.',
    invalidNumber: '❌ El número ingresado no es válido.',

    // Conexión
    waitingConnection: '→ Esperando conexión...',
    connected: '✓ BOT CONECTADO',
    disconnected: '✗ Conexión cerrada',
    reconnecting: '↻ Reconectando...',
    sessionInvalid: '⚠️ La sesión ya no es válida, se requiere un nuevo inicio de sesión.',

    // Genéricos de comandos
    pong: (ms) => `🏓 *Pong!*\n> Latencia: ${ms}ms`,
    processingSticker: '⏳ Creando sticker...',
    stickerError: '❌ No se pudo crear el sticker. Asegúrate de responder a una imagen o video corto.',
    downloadNotConfigured:
        '⚠️ Esta función necesita que configures DOWNLOAD_API_URL en tu archivo .env.',
    aiNotConfigured: (service) =>
        `⚠️ Configura la variable ${service} en tu archivo .env para usar este comando.`
};

export default messages;
