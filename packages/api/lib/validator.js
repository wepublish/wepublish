"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const Joi = require("joi");
class Validator {
    static createUser() {
        return Joi.object({
            email: Joi.string().email().required(),
            name: Joi.string().max(50).required(),
            firstName: Joi.string().max(50),
            preferredName: Joi.string().max(50).allow('')
        });
    }
    static login() {
        return Joi.object({
            email: Joi.string().email().required()
        });
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map