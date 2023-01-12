"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminImages = exports.getImageById = void 0;
const permissions_1 = require("../permissions");
const image_queries_1 = require("./image.queries");
const getImageById = (id, authenticate, imageLoader) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetImage, roles);
    return imageLoader.load(id);
};
exports.getImageById = getImageById;
const getAdminImages = async (filter, sortedField, order, cursorId, skip, take, authenticate, image) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetImages, roles);
    return (0, image_queries_1.getImages)(filter, sortedField, order, cursorId, skip, take, image);
};
exports.getAdminImages = getAdminImages;
//# sourceMappingURL=image.private-queries.js.map