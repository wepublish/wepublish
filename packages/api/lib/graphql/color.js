"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLColor = void 0;
const graphql_1 = require("graphql");
const ColorRegexp = /^#[A-Fa-f0-9]{6}$/g;
exports.GraphQLColor = new graphql_1.GraphQLScalarType({
    name: 'Color',
    description: 'A hexidecimal color value.',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        if (typeof value !== 'string')
            throw new Error();
        if (!value.match(ColorRegexp))
            throw new Error('Invalid hex color string.');
        return value;
    },
    parseLiteral(literal) {
        const value = (0, graphql_1.valueFromAST)(literal, (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString));
        if (!value.match(ColorRegexp))
            throw new Error('Invalid hex color string.');
        return value;
    }
});
//# sourceMappingURL=color.js.map