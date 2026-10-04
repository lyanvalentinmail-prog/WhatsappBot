/**
 * .calc — calculadora simple y segura (sin usar eval de forma insegura).
 */
export default {
    name: 'calc',
    aliases: ['calcular', 'math'],
    category: 'herramientas',
    description: 'Realiza una operación matemática simple',
    usage: '.calc 2 + 2 * 10',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        const expression = ctx.args.join(' ');
        if (!expression) return ctx.reply('❌️ Escribe una operación. Ej: .calc (4 + 2) * 3');

        // Solo se permiten números, espacios y operadores matemáticos básicos.
        if (!/^[0-9+\-*/().\s%]+$/.test(expression)) {
            return ctx.reply('❌️ Esa expresión contiene caracteres no permitidos.');
        }

        try {
            // eslint-disable-next-line no-new-func
            const result = Function(`"use strict"; return (${expression})`)();
            await ctx.reply(`🧮 Resultado: *${result}*`);
        } catch {
            await ctx.reply('❌️ No se pudo calcular esa expresión.');
        }
    }
};
