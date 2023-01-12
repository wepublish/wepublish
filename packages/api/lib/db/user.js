"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unselectPassword = exports.UserSort = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const common_1 = require("./common");
const hashPassword = async (password, bcryptHashCostFactor = common_1.DefaultBcryptHashCostFactor) => bcrypt_1.default.hash(password, bcryptHashCostFactor);
exports.hashPassword = hashPassword;
var UserSort;
(function (UserSort) {
    UserSort["CreatedAt"] = "createdAt";
    UserSort["ModifiedAt"] = "modifiedAt";
    UserSort["Name"] = "name";
    UserSort["FirstName"] = "firstName";
})(UserSort = exports.UserSort || (exports.UserSort = {}));
exports.unselectPassword = {
    address: true,
    oauth2Accounts: true,
    properties: true,
    paymentProviderCustomers: true,
    id: true,
    createdAt: true,
    modifiedAt: true,
    email: true,
    emailVerifiedAt: true,
    name: true,
    firstName: true,
    preferredName: true,
    userImageID: true,
    password: false,
    active: true,
    lastLogin: true,
    roleIDs: true
};
//# sourceMappingURL=user.js.map