"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLMailLogConnection = exports.GraphQLMailLogSort = exports.GraphQLMailLogFilter = exports.GraphQLMailLog = exports.GraphQLMailLogState = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const mailLog_1 = require("../db/mailLog");
const common_1 = require("./common");
exports.GraphQLMailLogState = new graphql_1.GraphQLEnumType({
    name: 'MailLogState',
    values: {
        SUBMITTED: { value: client_1.MailLogState.submitted },
        ACCEPTED: { value: client_1.MailLogState.accepted },
        DELIVERED: { value: client_1.MailLogState.delivered },
        DEFERRED: { value: client_1.MailLogState.deferred },
        BOUNCED: { value: client_1.MailLogState.bounced },
        REJECTED: { value: client_1.MailLogState.rejected }
    }
});
exports.GraphQLMailLog = new graphql_1.GraphQLObjectType({
    name: 'MailLog',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        recipient: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        subject: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        state: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLMailLogState) },
        mailProviderID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        mailData: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLMailLogFilter = new graphql_1.GraphQLInputObjectType({
    name: 'MailLogFilter',
    fields: {
        subject: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLMailLogSort = new graphql_1.GraphQLEnumType({
    name: 'MailLogSort',
    values: {
        CREATED_AT: { value: mailLog_1.MailLogSort.CreatedAt },
        MODIFIED_AT: { value: mailLog_1.MailLogSort.ModifiedAt }
    }
});
exports.GraphQLMailLogConnection = new graphql_1.GraphQLObjectType({
    name: 'MailLogConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLMailLog))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
//# sourceMappingURL=mailLog.js.map