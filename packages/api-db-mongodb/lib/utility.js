"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.escapeRegExp = exports.MongoErrorCode = exports.isNonNull = exports.base64Decode = exports.base64Encode = exports.generateToken = exports.generateID = exports.IDAlphabet = void 0;
const generate_1 = __importDefault(require("nanoid/generate"));
exports.IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function generateID() {
    return (0, generate_1.default)(exports.IDAlphabet, 16);
}
exports.generateID = generateID;
function generateToken() {
    return (0, generate_1.default)(exports.IDAlphabet, 32);
}
exports.generateToken = generateToken;
function base64Encode(str) {
    return Buffer.from(str).toString('base64');
}
exports.base64Encode = base64Encode;
function base64Decode(str) {
    return Buffer.from(str, 'base64').toString();
}
exports.base64Decode = base64Decode;
function isNonNull(value) {
    return value != null;
}
exports.isNonNull = isNonNull;
var MongoErrorCode;
(function (MongoErrorCode) {
    MongoErrorCode[MongoErrorCode["DuplicateKey"] = 11000] = "DuplicateKey";
})(MongoErrorCode = exports.MongoErrorCode || (exports.MongoErrorCode = {}));
/**
 * this method gets a string with special characters like:
 *  - , [ , ] , / , { , } , ( , ) , * , + , ? , . , \ , ^ , $ , |
 * and it adds \ the slash to let regex works properly as intended
 * @param string string with special characters
 */
function escapeRegExp(string) {
    return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;
// copied from packages/editor
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
        .replace(/[ÇĆĈČ]/gi, 'c')
        .replace(/[ÐĎĐÞ]/gi, 'd')
        .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
        .replace(/[ĜĞĢǴ]/gi, 'g')
        .replace(/[ĤḦ]/gi, 'h')
        .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
        .replace(/[Ĵ]/gi, 'j')
        .replace(/[Ĳ]/gi, 'ij')
        .replace(/[Ķ]/gi, 'k')
        .replace(/[ĹĻĽŁ]/gi, 'l')
        .replace(/[Ḿ]/gi, 'm')
        .replace(/[ÑŃŅŇ]/gi, 'n')
        .replace(/[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
        .replace(/[Œ]/gi, 'oe')
        .replace(/[ṕ]/gi, 'p')
        .replace(/[ŔŖŘ]/gi, 'r')
        .replace(/[ßŚŜŞŠ]/gi, 's')
        .replace(/[ŢŤ]/gi, 't')
        .replace(/[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
        .replace(/[ẂŴẀẄ]/gi, 'w')
        .replace(/[ẍ]/gi, 'x')
        .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
        .replace(/[ŹŻŽ]/gi, 'z')
        .replace(/[·/_,:;\\']/gi, '-')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '') //eslint-disable-line
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
exports.slugify = slugify;
//# sourceMappingURL=utility.js.map