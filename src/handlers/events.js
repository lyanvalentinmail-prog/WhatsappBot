/**
 * src/handlers/events.js
 * -----------------------------------------------------------------------
 * Eventos de WhatsApp que no son mensajes directos: entradas/salidas de
 * participantes en grupos (bienvenida / despedida), cambios de metadata,
 * etc. Se mantiene separado de messages.js para que cada archivo tenga
 * una única responsabilidad.
 * -----------------------------------------------------------------------
 */

import { getGroup } from '../database/index.js';
import { jidToNumber } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const defaultWelcome = (user, group) =>
    `╭─〔 BIENVENID@ 〕\n│\n│ @${user} se unió a *${group}*\n│ ¡Esperamos que la pases bien!\n│\n╰──────────────`;

const defaultBye = (user, group) =>
    `╭─〔 HASTA PRONTO 〕\n│\n│ @${user} salió de *${group}*\n│\n╰──────────────`;

export const registerEvents = (sock) => {
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            const group = getGroup(id);
            if (!group.settings.welcome) return;

            const metadata = await sock.groupMetadata(id).catch(() => null);
            const groupName = metadata?.subject || 'el grupo';

            for (const participant of participants) {
                const number = jidToNumber(participant);

                if (action === 'add') {
                    const text = group.settings.welcomeMessage
                        ? group.settings.welcomeMessage
                              .replace('{user}', `@${number}`)
                              .replace('{group}', groupName)
                        : defaultWelcome(number, groupName);

                    await sock.sendMessage(id, { text, mentions: [participant] });
                } else if (action === 'remove') {
                    const text = group.settings.byeMessage
                        ? group.settings.byeMessage
                              .replace('{user}', `@${number}`)
                              .replace('{group}', groupName)
                        : defaultBye(number, groupName);

                    await sock.sendMessage(id, { text, mentions: [participant] });
                }
            }
        } catch (err) {
            logger.error('Error manejando group-participants.update', err);
        }
    });
};

export default registerEvents;
