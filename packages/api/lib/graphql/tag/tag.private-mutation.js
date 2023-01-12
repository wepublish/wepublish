"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTag = exports.deleteTag = exports.createTag = void 0;
const permissions_1 = require("../permissions");
const createTag = (tag, type, authenticate, tagClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateTag, roles);
    return tagClient.create({
        data: {
            tag,
            type
        }
    });
};
exports.createTag = createTag;
const deleteTag = (tagId, authenticate, tagClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteTag, roles);
    return tagClient.delete({
        where: {
            id: tagId
        }
    });
};
exports.deleteTag = deleteTag;
const updateTag = (tagId, tag, authenticate, tagClient) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanUpdateTag, roles);
    return tagClient.update({
        where: {
            id: tagId
        },
        data: {
            tag
        }
    });
};
exports.updateTag = updateTag;
//# sourceMappingURL=tag.private-mutation.js.map