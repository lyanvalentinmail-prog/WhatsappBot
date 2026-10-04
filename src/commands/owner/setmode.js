import config from '../../../config.js';

export default {
    name: 'setmode',
    aliases: ['modo'],
    category: 'owner',
    description: 'Cambia el modo del bot (public/private) en caliente',
    usage: '.setmode public|private',
    args: 'opcion',
    ownerOnly: true,
    async execute(ctx) {
        const mode = ctx.args[0]?.toLowerCase();
        if (!['public', 'private'].includes(mode)) {
            return ctx.reply('❌️ Uso correcto: .setmode public  |  .setmode private');
        }

        config.mode = mode;
        await ctx.reply(
            `✅️ Modo cambiado a *${mode}* (solo para esta sesión).\n` +
                `Para que el cambio sea permanente, edita BOT_MODE en tu archivo .env`
        );
    }
};
