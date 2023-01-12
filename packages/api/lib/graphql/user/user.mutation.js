"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const user_1 = require("../../db/user");
const validator_1 = require("../../validator");
const createUser = async (_a, hashCostFactor, user) => {
    var { properties, address, password } = _a, input = __rest(_a, ["properties", "address", "password"]);
    const hashedPassword = await (0, user_1.hashPassword)(password, hashCostFactor);
    input.email = input.email.toLowerCase();
    await validator_1.Validator.createUser().validateAsync(input, { allowUnknown: true });
    return user.create({
        data: Object.assign(Object.assign({}, input), { password: hashedPassword, properties: {
                createMany: {
                    data: properties !== null && properties !== void 0 ? properties : []
                }
            }, address: {
                create: address !== null && address !== void 0 ? address : {}
            } }),
        select: user_1.unselectPassword
    });
};
exports.createUser = createUser;
//# sourceMappingURL=user.mutation.js.map