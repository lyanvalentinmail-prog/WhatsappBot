export default {
    name: 'groupinfo',
    aliases: ['infogrupo'],
    category: 'grupo',
    description: 'Muestra información del grupo actual',
    usage: '.groupinfo',
    groupOnly: true,
    async execute(ctx) {
        const meta = ctx.groupMetadata;
        if (!meta) return ctx.reply('❌️ No se pudo obtener la información del grupo.');

        const admins = meta.participants.filter((p) => p.admin).length;
        const creation = meta.creation
            ? new Date(meta.creation * 1000).toLocaleDateString()
            : 'Desconocida';

        const text =
            `╭─〔 ${meta.subject} 〕\n` +
            `│\n` +
            `│ ID: ${meta.id}\n` +
            `│ Miembros: ${meta.participants.length}\n` +
            `│ Administradores: ${admins}\n` +
            `│ Creado: ${creation}\n` +
            `│ Descripción: ${meta.desc || 'Sin descripción'}\n` +
            `│\n` +
            `╰──────────────`;

        await ctx.reply(text);
    }
};
