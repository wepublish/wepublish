"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImage = exports.createImage = exports.deleteImageById = void 0;
const permissions_1 = require("../permissions");
const deleteImageById = async (id, authenticate, image, mediaAdapter) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteImage, roles);
    const [deletedImage] = await Promise.all([
        image.delete({
            where: {
                id
            },
            include: {
                focalPoint: true
            }
        }),
        mediaAdapter.deleteImage(id)
    ]);
    return deletedImage;
};
exports.deleteImageById = deleteImageById;
const createImage = async (input, authenticate, mediaAdapter, imageClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateImage, roles);
    const { file, filename, title, description, tags, source, link, license, focalPoint } = input;
    const _a = await mediaAdapter.uploadImage(file), { id } = _a, image = __rest(_a, ["id"]);
    return imageClient.create({
        data: Object.assign(Object.assign({ id }, image), { filename: filename !== null && filename !== void 0 ? filename : image.filename, title,
            description,
            tags,
            source,
            link,
            license, focalPoint: {
                create: focalPoint
            } }),
        include: {
            focalPoint: true
        }
    });
};
exports.createImage = createImage;
const updateImage = (id, _a, authenticate, image) => {
    var { focalPoint } = _a, input = __rest(_a, ["focalPoint"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateImage, roles);
    return image.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { focalPoint: {
                upsert: {
                    create: focalPoint,
                    update: focalPoint
                }
            } }),
        include: {
            focalPoint: true
        }
    });
};
exports.updateImage = updateImage;
//# sourceMappingURL=image.private-mutation.js.map