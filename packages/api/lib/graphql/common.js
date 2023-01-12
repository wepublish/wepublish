"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLDateFilter = exports.GraphQLDateFilterComparison = exports.GraphQLMetadataPropertyPublicInput = exports.GraphQLMetadataPropertyInput = exports.GraphQLMetadataPropertyPublic = exports.GraphQLMetadataProperty = exports.GraphQLUnidirectionalPageInfo = exports.GraphQLPageInfo = exports.GraphQLSortOrder = void 0;
const graphql_1 = require("graphql");
const common_1 = require("../db/common");
const graphql_iso_date_1 = require("graphql-iso-date");
exports.GraphQLSortOrder = new graphql_1.GraphQLEnumType({
    name: 'SortOrder',
    values: {
        ASCENDING: { value: common_1.SortOrder.Ascending },
        DESCENDING: { value: common_1.SortOrder.Descending }
    }
});
exports.GraphQLPageInfo = new graphql_1.GraphQLObjectType({
    name: 'PageInfo',
    fields: {
        startCursor: { type: graphql_1.GraphQLString },
        endCursor: { type: graphql_1.GraphQLString },
        hasNextPage: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        hasPreviousPage: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLUnidirectionalPageInfo = new graphql_1.GraphQLObjectType({
    name: 'UnidirectionalPageInfo',
    fields: {
        endCursor: { type: graphql_1.GraphQLString },
        hasNextPage: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLMetadataProperty = new graphql_1.GraphQLObjectType({
    name: 'Properties',
    fields: {
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        value: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        public: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLMetadataPropertyPublic = new graphql_1.GraphQLObjectType({
    name: 'PublicProperties',
    fields: {
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        value: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLMetadataPropertyInput = new graphql_1.GraphQLInputObjectType({
    name: 'PropertiesInput',
    fields: {
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        value: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        public: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLMetadataPropertyPublicInput = new graphql_1.GraphQLInputObjectType({
    name: 'PublicPropertiesInput',
    fields: {
        key: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        value: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLDateFilterComparison = new graphql_1.GraphQLEnumType({
    name: 'DateFilterComparison',
    values: {
        GREATER: { value: common_1.DateFilterComparison.GreaterThan },
        GREATER_OR_EQUAL: { value: common_1.DateFilterComparison.GreaterThanOrEqual },
        EQUAL: { value: common_1.DateFilterComparison.Equal },
        LOWER: { value: common_1.DateFilterComparison.LowerThan },
        LOWER_OR_EQUAL: { value: common_1.DateFilterComparison.LowerThanOrEqual }
    }
});
exports.GraphQLDateFilter = new graphql_1.GraphQLInputObjectType({
    name: 'DateFilter',
    fields: {
        date: { type: graphql_iso_date_1.GraphQLDateTime, defaultValue: null },
        comparison: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLDateFilterComparison) }
    }
});
//# sourceMappingURL=common.js.map