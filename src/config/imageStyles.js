/**
 * src/config/imageStyles.js
 * -----------------------------------------------------------------------
 * Catálogo de "Art styles" para el comando .image (No style, Painted
 * Anime, Cinematic, etc.), cada uno traducido a texto adicional que se le
 * suma al prompt (y al prompt negativo) para lograr ese look. Funciona
 * con cualquier backend de generación de imágenes (actualmente Hugging
 * Face, ver src/utils/api.js -> generateImageHuggingFace).
 *
 * Para agregar un estilo nuevo: sumar una entrada acá, no hace falta
 * tocar el comando ni el generador.
 * -----------------------------------------------------------------------
 */

export const imageStyles = {
    none: {
        label: 'No style',
        aliases: ['none', 'no-style', 'sin-estilo', 'sinestilo', 'normal', 'ninguno'],
        promptSuffix: '',
        negativeSuffix: ''
    },
    cinematic: {
        label: 'Cinematic',
        aliases: ['cinematic', 'cine', 'cinematico', 'cinematográfico'],
        promptSuffix:
            'cinematic shot, dynamic lighting, 75mm, Technicolor, Panavision, cinemascope, sharp focus, fine details, 8k, HDR, realism, realistic, key visual, film still, superb cinematic color grading, depth of field',
        negativeSuffix:
            'bad lighting, low-quality, deformed, text, poorly drawn, holding camera, bad art, bad angle, boring, low-resolution, worst quality, bad composition, disfigured'
    },
    'traditional-japanese': {
        label: 'Traditional Japanese',
        aliases: ['traditional-japanese', 'japones', 'japonés', 'ukiyo-e', 'ukiyoe'],
        promptSuffix: 'in ukiyo-e art style, traditional japanese masterpiece',
        negativeSuffix: 'blurry, low resolution, worst quality, fuzzy'
    },
    'painted-anime': {
        label: 'Painted Anime',
        aliases: ['painted-anime', 'anime-pintado', 'animepintado', 'anime'],
        promptSuffix:
            'painterly anime artwork, masterpiece, fine details, breathtaking artwork, painterly art style, high quality, 8k, very detailed, high resolution, exquisite composition and lighting',
        negativeSuffix: 'worst quality, low quality, blurry, low-quality, deformed, text, poorly drawn'
    },
    'casual-photo': {
        label: 'Casual Photo',
        aliases: ['casual-photo', 'foto-casual', 'fotocasual', 'foto'],
        promptSuffix: 'casual photo',
        negativeSuffix:
            'bad photo, bad lighting, high production value, unnatural studio lighting, commercial photoshoot, photoshopped, terrible photo, disfigured'
    },
    'digital-painting': {
        label: 'Digital Painting',
        aliases: ['digital-painting', 'pintura-digital', 'pinturadigital', 'digital'],
        promptSuffix:
            'breathtaking digital art, trending on artstation, by atey ghailan, by greg rutkowski, by greg tocchini, by james gilleard, 8k, high resolution, best quality',
        negativeSuffix: 'low-quality, deformed, signature watermark text, poorly drawn'
    },
    'concept-art': {
        label: 'Concept Art',
        aliases: ['concept-art', 'arte-conceptual', 'conceptart', 'concepto'],
        promptSuffix:
            'concept art, digital art, illustration, inspired by wlop style, 8k, fine details, sharp, very detailed, high resolution, masterpiece',
        negativeSuffix: 'low-quality, deformed, text, poorly drawn, worst quality, blurry'
    }
};

/** Estilo usado cuando el usuario no especifica ninguno */
export const defaultStyleKey = 'none';

/** Lista ordenada de claves (el orden define cómo se muestran en el listado) */
export const styleOrder = [
    'none',
    'painted-anime',
    'cinematic',
    'traditional-japanese',
    'casual-photo',
    'digital-painting',
    'concept-art'
];

/**
 * Busca un estilo por su clave, alias o label (sin importar mayúsculas,
 * tildes ni espacios/guiones). Devuelve { key, ...style } o null.
 */
export const findStyle = (input) => {
    if (!input) return null;

    const normalize = (str) =>
        str
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quita tildes
            .replace(/[\s_]+/g, '-');

    const needle = normalize(input);

    for (const key of styleOrder) {
        const style = imageStyles[key];
        if (normalize(key) === needle) return { key, ...style };
        if (normalize(style.label) === needle) return { key, ...style };
        if ((style.aliases || []).some((alias) => normalize(alias) === needle)) {
            return { key, ...style };
        }
    }

    return null;
};

/** Texto formateado con el listado de estilos disponibles (para el .menu o errores) */
export const listStylesText = () =>
    styleOrder.map((key) => `• *${imageStyles[key].label}* → \`${key}\``).join('\n');

export default imageStyles;
