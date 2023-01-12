"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSetting = exports.GraphQLSettingsInput = exports.GraphQLUpdateSettingArgs = exports.GraphQLSettingInput = exports.GraphQLSettingRestrictionInput = exports.GraphQLSettingRestriction = exports.GraphQLAllowedSettingVals = exports.GraphQLSettingName = exports.GraphQLSettingValueType = void 0;
const graphql_1 = require("graphql");
const setting_1 = require("../db/setting");
exports.GraphQLSettingValueType = new graphql_1.GraphQLScalarType({
    name: 'Value',
    serialize(Value) {
        return Value;
    }
});
exports.GraphQLSettingName = new graphql_1.GraphQLEnumType({
    name: 'SettingName',
    values: {
        ALLOW_GUEST_COMMENTING: { value: setting_1.SettingName.ALLOW_GUEST_COMMENTING },
        ALLOW_GUEST_COMMENT_RATING: { value: setting_1.SettingName.ALLOW_GUEST_COMMENT_RATING },
        ALLOW_GUEST_POLL_VOTING: { value: setting_1.SettingName.ALLOW_GUEST_POLL_VOTING },
        SEND_LOGIN_JWT_EXPIRES_MIN: { value: setting_1.SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        RESET_PASSWORD_JWT_EXPIRES_MIN: { value: setting_1.SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN },
        PEERING_TIMEOUT_MS: { value: setting_1.SettingName.PEERING_TIMEOUT_MS },
        INVOICE_REMINDER_FREQ: { value: setting_1.SettingName.INVOICE_REMINDER_FREQ },
        INVOICE_REMINDER_MAX_TRIES: { value: setting_1.SettingName.INVOICE_REMINDER_MAX_TRIES }
    }
});
exports.GraphQLAllowedSettingVals = new graphql_1.GraphQLObjectType({
    name: 'AllowedSettingVals',
    fields: {
        stringChoice: { type: (0, graphql_1.GraphQLList)(graphql_1.GraphQLString) },
        boolChoice: { type: graphql_1.GraphQLBoolean }
    }
});
exports.GraphQLSettingRestriction = new graphql_1.GraphQLObjectType({
    name: 'SettingRestriction',
    fields: {
        maxValue: { type: graphql_1.GraphQLInt },
        minValue: { type: graphql_1.GraphQLInt },
        inputLength: { type: graphql_1.GraphQLInt },
        allowedValues: { type: exports.GraphQLAllowedSettingVals }
    }
});
exports.GraphQLSettingRestrictionInput = new graphql_1.GraphQLInputObjectType({
    name: 'SettingRestrictionInput',
    fields: {
        maxValue: { type: graphql_1.GraphQLInt },
        minValue: { type: graphql_1.GraphQLInt },
        inputLength: { type: graphql_1.GraphQLInt },
        allowedValues: { type: (0, graphql_1.GraphQLList)(exports.GraphQLAllowedSettingVals) }
    }
});
exports.GraphQLSettingInput = new graphql_1.GraphQLInputObjectType({
    name: 'SettingInput',
    fields: {
        value: { type: exports.GraphQLSettingValueType }
    }
});
exports.GraphQLUpdateSettingArgs = new graphql_1.GraphQLInputObjectType({
    name: 'UpdateSettingArgs',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLSettingName) },
        value: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLSettingValueType) }
    }
});
exports.GraphQLSettingsInput = new graphql_1.GraphQLInputObjectType({
    name: 'SettingsInput',
    fields: {
        value: { type: (0, graphql_1.GraphQLList)(exports.GraphQLUpdateSettingArgs) }
    }
});
exports.GraphQLSetting = new graphql_1.GraphQLObjectType({
    name: 'Setting',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLSettingName) },
        value: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLSettingValueType) },
        settingRestriction: { type: exports.GraphQLSettingRestriction }
    }
});
//# sourceMappingURL=setting.js.map