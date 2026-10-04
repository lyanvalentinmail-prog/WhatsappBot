/**
 * Mini-juegos simples: .coinflip, .dice, .8ball
 */
import { randomItem } from '../../utils/helpers.js';

const coinflip = {
    name: 'coinflip',
    aliases: ['moneda'],
    category: 'juegos',
    description: 'Lanza una moneda: cara o cruz',
    usage: '.coinflip',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        await ctx.reply(`🪙 Salió: *${randomItem(['Cara', 'Cruz'])}*`);
    }
};

const dice = {
    name: 'dice',
    aliases: ['dado'],
    category: 'juegos',
    description: 'Lanza un dado de 6 caras',
    usage: '.dice',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        await ctx.reply(`🎲 Salió: *${Math.floor(Math.random() * 6) + 1}*`);
    }
};

const eightBall = {
    name: '8ball',
    aliases: ['bola8'],
    category: 'juegos',
    description: 'Hazle una pregunta a la bola 8 mágica',
    usage: '.8ball <pregunta>',
    args: 'texto',
    groupOnly: false,
    ownerOnly: false,
    async execute(ctx) {
        if (!ctx.args.length) return ctx.reply('❌️ Hazme una pregunta: .8ball ¿Me amara?');
        const answers = [
            'Sí, definitivamente.',
            'No cuentes con ello.',
            'Es muy probable.',
            'Pregunta de nuevo más tarde.',
            'Mis fuentes dicen que no.',
            'Sin duda alguna.',
            'Muy dudoso.'
        ];
        await ctx.reply(`🎱 ${randomItem(answers)}`);
    }
};

export default [coinflip, dice, eightBall];
