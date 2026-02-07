/**
 * Command Registry
 * Aggregates all commands from submodules and provides a unified handler.
 */

const moderation = require('./moderation');
const vip = require('./vip');
const group = require('./group');
const warning = require('./warning');
const automation = require('./automation');
const fun = require('./fun');
const ai = require('./ai');
const special = require('./special');
const info = require('./info');
const filesModule = require('./files');
const featureControl = require('./feature_control');

// Combine all commands into a single map
const commands = {
    ...moderation,
    ...vip,
    ...group,
    ...warning,
    ...automation,
    ...fun,
    ...ai,
    ...special,
    ...info,
    ...filesModule.commands,
    ...featureControl
};

module.exports = commands;
