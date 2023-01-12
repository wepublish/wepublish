"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLImageConnection = exports.GraphQLImage = exports.GraphQLImageSort = exports.GraphQLImageFilter = exports.GraphQLUpdateImageInput = exports.GraphQLUploadImageInput = exports.GraphQLImageTransformation = exports.GraphQLImageOutput = exports.GraphQLImageRotation = exports.GraphQLPoint = exports.GraphQLInputPoint = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const apollo_server_express_1 = require("apollo-server-express");
const image_1 = require("../db/image");
const common_1 = require("./common");
const utility_1 = require("../utility");
exports.GraphQLInputPoint = new graphql_1.GraphQLInputObjectType({
    name: 'InputPoint',
    fields: {
        x: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLFloat) },
        y: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLFloat) }
    }
});
exports.GraphQLPoint = new graphql_1.GraphQLObjectType({
    name: 'Point',
    fields: {
        x: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLFloat) },
        y: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLFloat) }
    }
});
exports.GraphQLImageRotation = new graphql_1.GraphQLEnumType({
    name: 'ImageRotation',
    values: {
        AUTO: { value: image_1.ImageRotation.Auto },
        ROTATE_0: { value: image_1.ImageRotation.Rotate0 },
        ROTATE_90: { value: image_1.ImageRotation.Rotate90 },
        ROTATE_180: { value: image_1.ImageRotation.Rotate180 },
        ROTATE_270: { value: image_1.ImageRotation.Rotate270 }
    }
});
exports.GraphQLImageOutput = new graphql_1.GraphQLEnumType({
    name: 'ImageOutput',
    values: {
        PNG: { value: image_1.ImageOutput.PNG },
        JPEG: { value: image_1.ImageOutput.JPEG },
        WEBP: { value: image_1.ImageOutput.WEBP }
    }
});
exports.GraphQLImageTransformation = new graphql_1.GraphQLInputObjectType({
    name: 'ImageTransformation',
    fields: {
        width: { type: graphql_1.GraphQLInt },
        height: { type: graphql_1.GraphQLInt },
        rotation: { type: exports.GraphQLImageRotation },
        quality: { type: graphql_1.GraphQLFloat },
        output: { type: exports.GraphQLImageOutput }
    }
});
exports.GraphQLUploadImageInput = new graphql_1.GraphQLInputObjectType({
    name: 'UploadImageInput',
    fields: {
        file: { type: (0, graphql_1.GraphQLNonNull)(apollo_server_express_1.GraphQLUpload) },
        filename: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) },
        link: { type: graphql_1.GraphQLString },
        source: { type: graphql_1.GraphQLString },
        license: { type: graphql_1.GraphQLString },
        focalPoint: { type: exports.GraphQLInputPoint }
    }
});
exports.GraphQLUpdateImageInput = new graphql_1.GraphQLInputObjectType({
    name: 'UpdateImageInput',
    fields: {
        filename: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) },
        link: { type: graphql_1.GraphQLString },
        source: { type: graphql_1.GraphQLString },
        license: { type: graphql_1.GraphQLString },
        focalPoint: { type: exports.GraphQLInputPoint }
    }
});
exports.GraphQLImageFilter = new graphql_1.GraphQLInputObjectType({
    name: 'ImageFilter',
    fields: {
        title: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLImageSort = new graphql_1.GraphQLEnumType({
    name: 'ImageSort',
    values: {
        CREATED_AT: { value: image_1.ImageSort.CreatedAt },
        MODIFIED_AT: { value: image_1.ImageSort.ModifiedAt }
    }
});
exports.GraphQLImage = new graphql_1.GraphQLObjectType({
    name: 'Image',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        filename: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        link: { type: graphql_1.GraphQLString },
        source: { type: graphql_1.GraphQLString },
        license: { type: graphql_1.GraphQLString },
        fileSize: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        extension: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        mimeType: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        format: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        width: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        height: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        focalPoint: { type: exports.GraphQLPoint },
        url: {
            type: graphql_1.GraphQLString,
            resolve: (0, utility_1.createProxyingResolver)((image, {}, { mediaAdapter }) => {
                return mediaAdapter.getImageURL(image);
            })
        },
        transformURL: {
            type: graphql_1.GraphQLString,
            args: { input: { type: exports.GraphQLImageTransformation } },
            resolve: (0, utility_1.createProxyingResolver)((image, { input }, { mediaAdapter }) => {
                return image.transformURL ? image.transformURL : mediaAdapter.getImageURL(image, input);
            })
        }
    }
});
exports.GraphQLImageConnection = new graphql_1.GraphQLObjectType({
    name: 'ImageConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLImage))) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) }
    }
});
//# sourceMappingURL=image.js.map