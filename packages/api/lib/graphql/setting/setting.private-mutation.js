"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = void 0;
const error_1 = require("../../error");
const utility_1 = require("../../utility");
const permissions_1 = require("../permissions");
const updateSettings = async (value, authenticate, prisma) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateSettings, roles);
    for (const { name, value: newVal } of value) {
        const fullSetting = await prisma.setting.findUnique({
            where: { name }
        });
        if (!fullSetting) {
            throw new error_1.NotFound('setting', name);
        }
        const currentVal = fullSetting.value;
        const restriction = fullSetting.settingRestriction;
        (0, utility_1.checkSettingRestrictions)(newVal, currentVal, restriction);
    }
    return prisma.$transaction(value.map(({ name, value: val }) => prisma.setting.update({
        where: {
            name
        },
        data: {
            value: val
        }
    })));
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=setting.private-mutation.js.map