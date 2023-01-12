"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = exports.getSetting = void 0;
const permissions_1 = require("../permissions");
const error_1 = require("../../error");
const getSetting = (name, authenticate, setting) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSettings, roles);
    if (!name) {
        throw new error_1.UserInputError('You must provide setting `name`.');
    }
    return setting.findUnique({
        where: { name }
    });
};
exports.getSetting = getSetting;
const getSettings = (authenticate, setting) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetSettings, roles);
    return setting.findMany({});
};
exports.getSettings = getSettings;
//# sourceMappingURL=setting.private-queries.js.map