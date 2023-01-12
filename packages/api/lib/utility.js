"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSettingRestrictions = exports.isBoolean = exports.isString = exports.isArray = exports.isObject = exports.countRichtextChars = exports.capitalizeFirstLetter = exports.delegateToPeerSchema = exports.mapEnumsBack = exports.createProxyingIsTypeOf = exports.createProxyingResolver = exports.isSourceProxied = exports.markResultAsProxied = exports.IsProxiedSymbol = exports.base64Decode = exports.base64Encode = exports.slugify = exports.mapSubscriptionsAsCsv = exports.USER_PROPERTY_LAST_LOGIN_LINK_SEND = exports.ONE_MONTH_IN_MILLISECONDS = exports.FIFTEEN_MINUTES_IN_MILLISECONDS = exports.ONE_DAY_IN_MILLISECONDS = exports.ONE_HOUR_IN_MILLISECONDS = exports.MAX_PAYLOAD_SIZE = exports.MAX_COMMENT_LENGTH = void 0;
const formatISO_1 = __importDefault(require("date-fns/formatISO"));
const graphql_tools_1 = require("graphql-tools");
const block_1 = require("./db/block");
const error_1 = require("./error");
exports.MAX_COMMENT_LENGTH = 1000;
exports.MAX_PAYLOAD_SIZE = '1MB';
exports.ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
exports.ONE_DAY_IN_MILLISECONDS = 24 * exports.ONE_HOUR_IN_MILLISECONDS;
exports.FIFTEEN_MINUTES_IN_MILLISECONDS = 900000;
exports.ONE_MONTH_IN_MILLISECONDS = 31 * exports.ONE_DAY_IN_MILLISECONDS;
exports.USER_PROPERTY_LAST_LOGIN_LINK_SEND = '_wepLastLoginLinkSentTimestamp';
function mapSubscriptionsAsCsv(subscriptions) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    let csvStr = [
        'id',
        'firstName',
        'name',
        'preferredName',
        'email',
        'active',
        'createdAt',
        'modifiedAt',
        'company',
        'streetAddress',
        'streetAddress2',
        'zipCode',
        'city',
        'country',
        'memberPlan',
        'memberPlanID',
        'paymentPeriodicity',
        'monthlyAmount',
        'autoRenew',
        'startsAt',
        'paidUntil',
        'paymentMethod',
        'paymentMethodID',
        'deactivationDate',
        'deactivationReason'
    ].join(',') + '\n';
    for (const subscription of subscriptions) {
        const user = subscription === null || subscription === void 0 ? void 0 : subscription.user;
        const memberPlan = subscription === null || subscription === void 0 ? void 0 : subscription.memberPlan;
        const paymentMethod = subscription === null || subscription === void 0 ? void 0 : subscription.paymentMethod;
        // if (!user) continue
        csvStr +=
            [
                user === null || user === void 0 ? void 0 : user.id,
                `${sanitizeCsvContent(user === null || user === void 0 ? void 0 : user.firstName)}`,
                `${sanitizeCsvContent(user === null || user === void 0 ? void 0 : user.name)}`,
                `${sanitizeCsvContent(user === null || user === void 0 ? void 0 : user.preferredName)}`,
                `${(_a = user === null || user === void 0 ? void 0 : user.email) !== null && _a !== void 0 ? _a : ''}`,
                user === null || user === void 0 ? void 0 : user.active,
                (user === null || user === void 0 ? void 0 : user.createdAt) ? (0, formatISO_1.default)(user.createdAt, { representation: 'date' }) : '',
                (user === null || user === void 0 ? void 0 : user.modifiedAt) ? (0, formatISO_1.default)(user.modifiedAt, { representation: 'date' }) : '',
                `${sanitizeCsvContent((_b = user === null || user === void 0 ? void 0 : user.address) === null || _b === void 0 ? void 0 : _b.company)}`,
                `${sanitizeCsvContent((_c = user === null || user === void 0 ? void 0 : user.address) === null || _c === void 0 ? void 0 : _c.streetAddress)}`,
                `${sanitizeCsvContent((_d = user === null || user === void 0 ? void 0 : user.address) === null || _d === void 0 ? void 0 : _d.streetAddress2)}`,
                `${sanitizeCsvContent((_e = user === null || user === void 0 ? void 0 : user.address) === null || _e === void 0 ? void 0 : _e.zipCode)}`,
                `${sanitizeCsvContent((_f = user === null || user === void 0 ? void 0 : user.address) === null || _f === void 0 ? void 0 : _f.city)}`,
                `${sanitizeCsvContent((_g = user === null || user === void 0 ? void 0 : user.address) === null || _g === void 0 ? void 0 : _g.country)}`,
                sanitizeCsvContent(memberPlan === null || memberPlan === void 0 ? void 0 : memberPlan.name),
                (_h = subscription === null || subscription === void 0 ? void 0 : subscription.memberPlanID) !== null && _h !== void 0 ? _h : '',
                (_j = subscription === null || subscription === void 0 ? void 0 : subscription.paymentPeriodicity) !== null && _j !== void 0 ? _j : '',
                (_k = subscription === null || subscription === void 0 ? void 0 : subscription.monthlyAmount) !== null && _k !== void 0 ? _k : '',
                (_l = subscription === null || subscription === void 0 ? void 0 : subscription.autoRenew) !== null && _l !== void 0 ? _l : '',
                (subscription === null || subscription === void 0 ? void 0 : subscription.startsAt) ? (0, formatISO_1.default)(subscription.startsAt, { representation: 'date' }) : '',
                (subscription === null || subscription === void 0 ? void 0 : subscription.paidUntil)
                    ? (0, formatISO_1.default)(subscription.paidUntil, { representation: 'date' })
                    : 'no pay',
                sanitizeCsvContent(paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.name),
                (_m = subscription === null || subscription === void 0 ? void 0 : subscription.paymentMethodID) !== null && _m !== void 0 ? _m : '',
                (subscription === null || subscription === void 0 ? void 0 : subscription.deactivation)
                    ? (0, formatISO_1.default)(subscription.deactivation.date, { representation: 'date' })
                    : '',
                (_p = (_o = subscription === null || subscription === void 0 ? void 0 : subscription.deactivation) === null || _o === void 0 ? void 0 : _o.reason) !== null && _p !== void 0 ? _p : ''
            ].join(',') + '\r\n';
    }
    return csvStr;
}
exports.mapSubscriptionsAsCsv = mapSubscriptionsAsCsv;
/**
 * according to rfc 4180
 * https://www.ietf.org/rfc/rfc4180.txt
 * @param input
 */
function sanitizeCsvContent(input) {
    // according rfc 4180 2.7.
    const escapeDoubleQuotes = (input || '').toString().replace(/[#"]/g, '""');
    // according rfc 4180 2.5. / 2.6.
    return `"${escapeDoubleQuotes}"`;
}
// https://gist.github.com/mathewbyrne/1280286#gistcomment-2588056
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
        .replace(/[^\w\-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
exports.slugify = slugify;
function base64Encode(str) {
    return Buffer.from(str).toString('base64');
}
exports.base64Encode = base64Encode;
function base64Decode(str) {
    return Buffer.from(str, 'base64').toString();
}
exports.base64Decode = base64Decode;
exports.IsProxiedSymbol = Symbol('isProxied');
function markResultAsProxied(result) {
    if (!result)
        return null;
    for (const key in result) {
        const value = result[key];
        if (typeof value === 'object' && value != null) {
            markResultAsProxied(value);
        }
    }
    return Object.assign(result, { [exports.IsProxiedSymbol]: true });
}
exports.markResultAsProxied = markResultAsProxied;
function isSourceProxied(source) {
    return source[exports.IsProxiedSymbol] == true;
}
exports.isSourceProxied = isSourceProxied;
function createProxyingResolver(resolver) {
    return (source, args, context, info) => {
        if (isSourceProxied(source)) {
            return source[info.path.key];
        }
        return resolver(source, args, context, info);
    };
}
exports.createProxyingResolver = createProxyingResolver;
function createProxyingIsTypeOf(isTypeOf) {
    return function (source, context, info) {
        return isSourceProxied(source)
            ? source.__typename === this.name
            : isTypeOf(source, context, info);
    };
}
exports.createProxyingIsTypeOf = createProxyingIsTypeOf;
function mapEnumsBack(result) {
    if (!result)
        return null;
    for (const key in result) {
        const value = result[key];
        if (typeof value === 'object' && value !== null) {
            mapEnumsBack(value);
        }
    }
    if (result.__typename === 'ArticleTeaser' ||
        result.__typename === 'PeerArticleTeaser' ||
        result.__typename === 'PageTeaser' ||
        result.__typename === 'CustomTeaser') {
        switch (result.style) {
            case 'DEFAULT':
                return Object.assign(result, { style: block_1.TeaserStyle.Default });
            case 'LIGHT':
                return Object.assign(result, { style: block_1.TeaserStyle.Light });
            case 'TEXT':
                return Object.assign(result, { style: block_1.TeaserStyle.Text });
        }
    }
    return result;
}
exports.mapEnumsBack = mapEnumsBack;
class ResetGraphQLEnums {
    transformResult(result) {
        // FIXME: WPC-415 created
        return mapEnumsBack(result);
    }
}
async function delegateToPeerSchema(peerID, fetchAdminEndpoint, context, opts) {
    var _a;
    const schema = fetchAdminEndpoint
        ? await context.loaders.peerAdminSchema.load(peerID)
        : await context.loaders.peerSchema.load(peerID);
    if (!schema)
        return null;
    return markResultAsProxied(await (0, graphql_tools_1.delegateToSchema)(Object.assign(Object.assign({}, opts), { schema, transforms: [new ResetGraphQLEnums(), ...((_a = opts.transforms) !== null && _a !== void 0 ? _a : [])] })));
}
exports.delegateToPeerSchema = delegateToPeerSchema;
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
function countRichtextChars(blocksCharLength, nodes) {
    return nodes.reduce((charLength, node) => {
        if (!node.text && !node.children)
            return charLength;
        if (node.text) {
            return charLength + node.text.length;
        }
        return countRichtextChars(charLength, node.children);
    }, blocksCharLength);
}
exports.countRichtextChars = countRichtextChars;
function isObject(unknown) {
    return typeof unknown === 'object' && unknown != null && !Array.isArray(unknown);
}
exports.isObject = isObject;
function isArray(unknown) {
    return Array.isArray(unknown);
}
exports.isArray = isArray;
function isString(unknown) {
    return typeof unknown === 'string';
}
exports.isString = isString;
function isBoolean(unknown) {
    return typeof unknown === 'boolean';
}
exports.isBoolean = isBoolean;
function checkSettingRestrictions(val, currentVal, restriction) {
    var _a, _b;
    if (!restriction) {
        return;
    }
    if (typeof val !== typeof currentVal) {
        throw new error_1.InvalidSettingValueError();
    }
    if (((_a = restriction.allowedValues) === null || _a === void 0 ? void 0 : _a.boolChoice) && typeof val !== 'boolean') {
        throw new error_1.InvalidSettingValueError();
    }
    if (typeof val === 'number') {
        if (restriction.maxValue && val > restriction.maxValue) {
            throw new error_1.InvalidSettingValueError();
        }
        if (restriction.minValue && val < restriction.minValue) {
            throw new error_1.InvalidSettingValueError();
        }
    }
    if (typeof val === 'string') {
        if (restriction.inputLength && val.length > restriction.inputLength) {
            throw new error_1.InvalidSettingValueError();
        }
        if (((_b = restriction.allowedValues) === null || _b === void 0 ? void 0 : _b.stringChoice) &&
            !restriction.allowedValues.stringChoice.includes(val)) {
            throw new error_1.InvalidSettingValueError();
        }
    }
}
exports.checkSettingRestrictions = checkSettingRestrictions;
//# sourceMappingURL=utility.js.map