export default {
    name: 'hidetag',
    aliases: ['ht'],
    category: 'grupo',
    description: 'Envía un mensaje notificando a todos sin mostrar la lista',
    usage: '.hidetag <mensaje>',
    groupOnly: true,
    adminOnly: true,
    async execute(ctx) {
        const participants = ctx.groupMetadata?.participants || [];
        const text = ctx.args.join(' ') || '📢 Atención';
        await ctx.reply({ text, mentions: participants.map((p) => p.id) });
    }
};
