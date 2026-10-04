/**
 * src/database/index.js
 * -----------------------------------------------------------------------
 * Capa de base de datos desacoplada del resto del bot. Expone funciones
 * de alto nivel (getUser, getGroup, addWarning...) para que los comandos
 * nunca tengan que preocuparse del almacenamiento real por debajo.
 * -----------------------------------------------------------------------
 */

import { load, save } from './jsonAdapter.js';

// Estado en memoria, se sincroniza a disco en cada mutación.
let data = load();

const persist = () => save(data);

/* ------------------------------- USUARIOS ------------------------------- */

export const getUser = (jid) => {
    if (!data.users[jid]) {
        data.users[jid] = {
            jid,
            name: '',
            messages: 0,
            registeredAt: Date.now()
        };
        persist();
    }
    return data.users[jid];
};

export const updateUser = (jid, patch = {}) => {
    const user = getUser(jid);
    data.users[jid] = { ...user, ...patch };
    persist();
    return data.users[jid];
};

export const incrementUserMessages = (jid) => {
    const user = getUser(jid);
    user.messages += 1;
    persist();
    return user.messages;
};

/* -------------------------------- GRUPOS -------------------------------- */

const defaultGroupSettings = () => ({
    welcome: true,
    welcomeMessage: '',
    byeMessage: '',
    antilink: false,
    muted: false
});

export const getGroup = (jid) => {
    if (!data.groups[jid]) {
        data.groups[jid] = { jid, settings: defaultGroupSettings() };
        persist();
    }
    return data.groups[jid];
};

export const updateGroupSettings = (jid, patch = {}) => {
    const group = getGroup(jid);
    group.settings = { ...group.settings, ...patch };
    persist();
    return group.settings;
};

/* ------------------------------ ADVERTENCIAS ----------------------------- */

export const getWarnings = (groupJid, userJid) => {
    data.warnings[groupJid] ||= {};
    return data.warnings[groupJid][userJid] || 0;
};

export const addWarning = (groupJid, userJid) => {
    data.warnings[groupJid] ||= {};
    data.warnings[groupJid][userJid] = (data.warnings[groupJid][userJid] || 0) + 1;
    persist();
    return data.warnings[groupJid][userJid];
};

export const removeWarning = (groupJid, userJid) => {
    data.warnings[groupJid] ||= {};
    data.warnings[groupJid][userJid] = Math.max(0, (data.warnings[groupJid][userJid] || 0) - 1);
    persist();
    return data.warnings[groupJid][userJid];
};

export const resetWarnings = (groupJid, userJid) => {
    data.warnings[groupJid] ||= {};
    data.warnings[groupJid][userJid] = 0;
    persist();
};

/* ------------------------------- BLOQUEADOS ------------------------------ */

export const isBlocked = (jid) => Boolean(data.blocked[jid]);

export const blockUser = (jid) => {
    data.blocked[jid] = true;
    persist();
};

export const unblockUser = (jid) => {
    delete data.blocked[jid];
    persist();
};

/* ------------------------------ CONFIGURACIÓN ----------------------------- */

export const getSetting = (key, fallback = null) =>
    key in data.settings ? data.settings[key] : fallback;

export const setSetting = (key, value) => {
    data.settings[key] = value;
    persist();
};

/** Acceso de solo-lectura a todo el estado (útil para comandos de debug) */
export const getRawData = () => data;

export default {
    getUser,
    updateUser,
    incrementUserMessages,
    getGroup,
    updateGroupSettings,
    getWarnings,
    addWarning,
    removeWarning,
    resetWarnings,
    isBlocked,
    blockUser,
    unblockUser,
    getSetting,
    setSetting,
    getRawData
};
