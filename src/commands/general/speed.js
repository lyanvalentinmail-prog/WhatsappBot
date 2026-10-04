/**
 * .speed — prueba de velocidad de procesamiento/respuesta del bot.
 */
export default {
    name: 'speed',
    aliases: ['velocidad'],
    category: 'general',
    description: 'Prueba la velocidad de respuesta del servidor del bot',
    usage: '.speed',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const t0 = process.hrtime.bigint();
        await ctx.reply('🚀 Calculando velocidad...');
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1_000_000;
        await ctx.reply(`⚡ Velocidad de respuesta: *${ms.toFixed(2)}ms*`);
    }
};
