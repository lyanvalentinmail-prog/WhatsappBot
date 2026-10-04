/**
 * src/commands/general/menu.js
 * -----------------------------------------------------------------------
 * Comando .menu — genera el menú automáticamente a partir de TODOS los
 * comandos cargados (src/commands/ y src/plugins/), siguiendo EXACTAMENTE
 * la plantilla de diseño pedida (cabecera, categorías decoradas, listado
 * de comandos con carita + argumento, separadores, etc).
 *
 * No hay que editar este archivo para que un comando nuevo aparezca:
 * basta con crear el archivo del comando, asignarle una categoría y,
 * opcionalmente, un tipo de argumento ("args").
 *
 * Uso:
 *   .menu              -> menú completo
 *   .menu ia           -> solo la categoría "ia"
 *   .menu anime        -> solo la categoría "anime"
 * -----------------------------------------------------------------------
 */

import config from '../../../config.js';
import { categories, menuConfig, toSmallCaps, toStyledTitle, argLabels } from '../../config/menu.js';
import { commandHandler } from '../../handlers/commands.js';

/** Construye el bloque de encabezado del menú (nombre, enlaces, repositorio) */
const buildHeader = () => {
    return (
        `─ ׁ ׅ  𝐇ᴏʟᴀ!, sᴏʏ *${config.botName}* ${config.botType ? `(${toStyledTitle(config.botType)})` : ''} . 𐔌՞ ܸ.ˬ.ܸ՞𐦯\n` +
        `✎ ${toSmallCaps('aqui tienes la lista de los comandos')}\n\n\n` +
        `${menuConfig.divider}\n\n\n` +
        `༉‧₊˚. │ ${toStyledTitle('Enlace')} ❚❙ ⋆˚꩜｡\n` +
        `── ${config.groupLink || toSmallCaps('(grupo de whatsapp sin configurar)')}\n\n\n` +
        `༉‧₊˚. │ ${toStyledTitle('Developer')} ❚❙ ⋆˚꩜｡\n` +
        `── ${config.developerName}\n\n\n` +
        `${menuConfig.footerDivider}\n\n\n` +
        `> ${toSmallCaps('conectate como sub-bot siguiendo el paso a paso el repositorio de github')} ✎\n` +
        `${config.githubRepo || toSmallCaps('(repositorio sin configurar)')}\n`
    );
};

/** Da formato a un comando individual: carita + nombre + argumento, y su descripción */
const buildCommandEntry = (cmd) => {
    const argPart = cmd.args && argLabels[cmd.args] ? ` + ${argLabels[cmd.args]}` : '';
    const line1 = `  ❀ ${menuConfig.commandFace}   ݁  ${config.prefix}${cmd.name}${argPart}`;
    const line2 = `> ── ˚. ᵎᵎ ۠ ${toSmallCaps(cmd.description || 'sin descripcion')}.`;
    return `${line1}\n${line2}`;
};

/** Construye la sección completa de una categoría (encabezado + comandos) */
const buildCategorySection = (key, meta) => {
    const commands = commandHandler.getByCategory(key);
    if (!commands.length) return '';

    const header =
        `- ≽ ^⎚ ˕ ⎚^ ≼ *\`${toStyledTitle(meta.label)}\`* ᰨᰍ    *;*\n` +
        `> ✐ ${toSmallCaps(meta.description || meta.label)}\n\n\n`;

    const body = commands.map(buildCommandEntry).join('\n\n\n');

    return `${header}${body}\n\n\n${menuConfig.sectionDivider}\n\n\n`;
};

const buildFullMenu = () => {
    let menu = buildHeader() + '\n\n\n';

    const orderedCategories = Object.entries(categories).sort((a, b) => a[1].order - b[1].order);
    for (const [key, meta] of orderedCategories) {
        menu += buildCategorySection(key, meta);
    }

    menu += `✎ ${toSmallCaps('usa')} *${config.prefix}menu <categoria>* ${toSmallCaps('para ver una categoria especifica')}.\n`;
    menu += `${toSmallCaps('categorias')}: ${Object.keys(categories).join(', ')}`;

    return menu.trim();
};

const buildCategoryMenu = (categoryKey) => {
    const meta = categories[categoryKey];
    if (!meta) {
        return `❌️ La categoría *${categoryKey}* no existe.\nCategorías disponibles: ${Object.keys(categories).join(', ')}`;
    }

    const commands = commandHandler.getByCategory(categoryKey);
    if (!commands.length) {
        return `⚠️ Aún no hay comandos registrados en la categoría *${meta.label}*.`;
    }

    return buildCategorySection(categoryKey, meta).trim();
};

export default {
    name: 'menu',
    aliases: ['help', 'ayuda'],
    category: 'general',
    description: 'Muestra el menú de comandos, completo o por categoría',
    usage: '.menu [categoria]',
    args: 'opcion',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const categoryArg = ctx.args[0]?.toLowerCase();
        const text = categoryArg ? buildCategoryMenu(categoryArg) : buildFullMenu();
        await ctx.reply(text);
    }
};
