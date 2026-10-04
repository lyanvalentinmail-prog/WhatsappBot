/**
 * src/commands/general/menu.js
 * -----------------------------------------------------------------------
 * Comando .menu — genera el menú automáticamente a partir de TODOS los
 * comandos cargados (src/commands/ y src/plugins/). No hay que editar
 * este archivo para que un comando nuevo aparezca: basta con crear el
 * archivo del comando y asignarle una categoría.
 *
 * Uso:
 *   .menu              -> menú completo
 *   .menu ia           -> solo la categoría "ia"
 *   .menu anime        -> solo la categoría "anime"
 * -----------------------------------------------------------------------
 */

import config from '../../../config.js';
import { categories, menuConfig, toSmallCaps } from '../../config/menu.js';
import { commandHandler } from '../../handlers/commands.js';

const buildHeader = () => {
    const bot = toSmallCaps(config.botName);
    return (
        `─ ׁ ׅ  𝐇ᴏʟᴀ!, sᴏʏ *${config.botName}* . 𐔌՞ ܸ.ˬ.ܸ՞𐦯\n` +
        `✎ ${toSmallCaps('aqui tienes la lista de los comandos')}\n\n` +
        `${menuConfig.divider}\n\n` +
        `༉‧₊˚. │ 𝐄ɴʟᴀᴄᴇ ❚❙  ⋆˚꩜｡\n` +
        `── ${config.groupLink || toSmallCaps('(sin configurar)')}\n\n` +
        `༉‧₊˚. │𝐃ᴇᴠᴇʟᴏᴘᴇʀ ❚❙  ⋆˚꩜｡\n` +
        `── ${config.developerName}\n\n` +
        `${menuConfig.footerDivider}\n\n` +
        `> ${toSmallCaps('conectate como sub-bot siguiendo el paso a paso el repositorio de github')} ✎ ${
            config.githubRepo || toSmallCaps('(sin configurar)')
        }\n`
    );
};

const buildCategorySection = (key, meta) => {
    const commands = commandHandler.getByCategory(key);
    if (!commands.length) return '';

    let section = `\n- ≽ ^⎚ ˕ ⎚^ ≼ \`${meta.label}\`  ${meta.emoji}    ;\n`;

    for (const cmd of commands) {
        const aliasText = cmd.aliases?.length ? ` (${cmd.aliases.map((a) => config.prefix + a).join(', ')})` : '';
        section += `\n❀ ${config.prefix}${cmd.name}${aliasText}\n> ${toSmallCaps(cmd.description || 'sin descripcion')}.\n`;
    }

    return section + `\n${menuConfig.sectionDivider}\n`;
};

const buildFullMenu = () => {
    let menu = buildHeader();

    const orderedCategories = Object.entries(categories).sort((a, b) => a[1].order - b[1].order);
    for (const [key, meta] of orderedCategories) {
        menu += buildCategorySection(key, meta);
    }

    menu += `\n✎ ${toSmallCaps('usa')} *${config.prefix}menu <categoria>* ${toSmallCaps('para ver una categoria especifica')}.\n`;
    menu += `${toSmallCaps('categorias')}: ${Object.keys(categories).join(', ')}`;

    return menu;
};

const buildCategoryMenu = (categoryKey) => {
    const meta = categories[categoryKey];
    if (!meta) {
        return `❌ La categoría *${categoryKey}* no existe.\nCategorías disponibles: ${Object.keys(categories).join(', ')}`;
    }

    const commands = commandHandler.getByCategory(categoryKey);
    if (!commands.length) {
        return `⚠️ Aún no hay comandos registrados en la categoría *${meta.label}*.`;
    }

    let menu = `╭─〔 ${meta.emoji} ${meta.label.toUpperCase()} 〕\n│\n`;
    for (const cmd of commands) {
        const aliasText = cmd.aliases?.length ? ` | alias: ${cmd.aliases.join(', ')}` : '';
        menu += `│ ${config.prefix}${cmd.name}${aliasText}\n│  ↳ ${cmd.description || 'Sin descripción'}\n│\n`;
    }
    menu += '╰──────────────';
    return menu;
};

export default {
    name: 'menu',
    aliases: ['help', 'ayuda'],
    category: 'general',
    description: 'Muestra el menú de comandos, completo o por categoría',
    usage: '.menu [categoria]',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const categoryArg = ctx.args[0]?.toLowerCase();
        const text = categoryArg ? buildCategoryMenu(categoryArg) : buildFullMenu();
        await ctx.reply(text);
    }
};
