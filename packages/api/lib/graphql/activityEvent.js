"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLActivityEvent = exports.GraphQLActivityEventType = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const activityEvent_1 = require("../db/activityEvent");
exports.GraphQLActivityEventType = new graphql_1.GraphQLEnumType({
    name: 'ActivityEventType',
    values: {
        ARTICLE: { value: activityEvent_1.EventType.Article },
        PAGE: { value: activityEvent_1.EventType.Page },
        COMMENT: { value: activityEvent_1.EventType.Comment },
        SUBSCRIPTION: { value: activityEvent_1.EventType.Subscription },
        AUTHOR: { value: activityEvent_1.EventType.Author },
        POLL: { value: activityEvent_1.EventType.Poll },
        USER: { value: activityEvent_1.EventType.User },
    }
});
exports.GraphQLActivityEvent = new graphql_1.GraphQLObjectType({
    name: 'ActivityEvent',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        date: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        eventType: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLActivityEventType) },
        creator: { type: graphql_1.GraphQLString },
        summary: { type: graphql_1.GraphQLString }
    }
});
//# sourceMappingURL=activityEvent.js.map