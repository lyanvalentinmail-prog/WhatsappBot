export default {
    name: 'restart',
    aliases: ['reiniciar'],
    category: 'owner',
    description: 'Reinicia el proceso del bot',
    usage: '.restart',
    ownerOnly: true,
    async execute(ctx) {
        await ctx.reply('♻️ Reiniciando el bot...');
        setTimeout(() => process.exit(0), 500);
    }
};
