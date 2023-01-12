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
exports.resetUserPassword = exports.updateAdminUser = exports.createAdminUser = exports.deleteUserById = void 0;
const user_1 = require("../../db/user");
const error_1 = require("../../error");
const mailContext_1 = require("../../mails/mailContext");
const validator_1 = require("../../validator");
const permissions_1 = require("../permissions");
const user_mutation_1 = require("./user.mutation");
const deleteUserById = (id, authenticate, user) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteUser, roles);
    return user.delete({
        where: {
            id
        },
        select: user_1.unselectPassword
    });
};
exports.deleteUserById = deleteUserById;
const createAdminUser = async (input, authenticate, hashCostFactor, user) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateUser, roles);
    input.email = input.email ? input.email.toLowerCase() : input.email;
    await validator_1.Validator.createUser().validateAsync(input, { allowUnknown: true });
    const userExists = await user.findUnique({
        where: { email: input.email }
    });
    if (userExists)
        throw new error_1.EmailAlreadyInUseError();
    return (0, user_mutation_1.createUser)(input, hashCostFactor, user);
};
exports.createAdminUser = createAdminUser;
const updateAdminUser = async (id, _a, authenticate, user) => {
    var { properties, address } = _a, input = __rest(_a, ["properties", "address"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateUser, roles);
    input.email = input.email ? input.email.toLowerCase() : input.email;
    await validator_1.Validator.createUser().validateAsync(input, { allowUnknown: true });
    return user.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { address: address
                ? {
                    upsert: {
                        create: address,
                        update: address
                    }
                }
                : undefined, properties: {
                deleteMany: {
                    userId: id
                },
                createMany: {
                    data: properties
                }
            } }),
        select: user_1.unselectPassword
    });
};
exports.updateAdminUser = updateAdminUser;
const resetUserPassword = async (id, password, sendMail, hashCostFactor, authenticate, mailContext, userClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanResetUserPassword, roles);
    const user = await userClient.update({
        where: { id },
        data: {
            password: await (0, user_1.hashPassword)(password, hashCostFactor)
        },
        select: user_1.unselectPassword
    });
    if (sendMail && user) {
        await mailContext.sendMail({
            type: mailContext_1.SendMailType.PasswordReset,
            recipient: user.email,
            data: {
                user
            }
        });
    }
    return user;
};
exports.resetUserPassword = resetUserPassword;
//# sourceMappingURL=user.private-mutation.js.map