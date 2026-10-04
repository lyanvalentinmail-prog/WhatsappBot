export default {
    name: 'tagall',
    aliases: ['mencionartodos'],
    category: 'grupo',
    description: 'Menciona a todos los miembros del grupo',
    usage: '.tagall [mensaje]',
    groupOnly: true,
    adminOnly: true,
    async execute(ctx) {
        const participants = ctx.groupMetadata?.participants || [];
        const extra = ctx.args.join(' ');
        let text = `📢 *${extra || 'Mención general'}*\n\n`;
        for (const p of participants) {
            text += `• @${p.id.split('@')[0]}\n`;
        }
        await ctx.reply({ text, mentions: participants.map((p) => p.id) });
    }
};
