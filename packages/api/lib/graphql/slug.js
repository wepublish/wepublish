"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSlug = void 0;
const graphql_1 = require("graphql");
const utility_1 = require("../utility");
exports.GraphQLSlug = new graphql_1.GraphQLScalarType({
    name: 'Slug',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        if (typeof value != 'string')
            throw new Error();
        return (0, utility_1.slugify)(value);
    },
    parseLiteral(literal) {
        const value = (0, graphql_1.valueFromAST)(literal, graphql_1.GraphQLString);
        if (value == undefined)
            throw new Error();
        return (0, utility_1.slugify)(value);
    }
});
//# sourceMappingURL=slug.js.map