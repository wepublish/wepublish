"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImages = exports.createImageFilter = exports.createImageOrder = void 0;
const common_1 = require("../../db/common");
const image_1 = require("../../db/image");
const sort_1 = require("../queries/sort");
const createImageOrder = (field, sortOrder) => {
    switch (field) {
        case image_1.ImageSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case image_1.ImageSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createImageOrder = createImageOrder;
const createTitleFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.title) {
        return {
            OR: [
                {
                    title: {
                        contains: filter.title,
                        mode: 'insensitive'
                    }
                },
                {
                    filename: {
                        contains: filter.title,
                        mode: 'insensitive'
                    }
                }
            ]
        };
    }
    return {};
};
const createTagsFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.tags) {
        return {
            tags: {
                hasSome: filter.tags
            }
        };
    }
    return {};
};
const createImageFilter = (filter) => ({
    AND: [createTitleFilter(filter), createTagsFilter(filter)]
});
exports.createImageFilter = createImageFilter;
const getImages = async (filter, sortedField, order, cursorId, skip, take, image) => {
    const orderBy = (0, exports.createImageOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createImageFilter)(filter);
    const [totalCount, images] = await Promise.all([
        image.count({
            where,
            orderBy
        }),
        image.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                focalPoint: true
            }
        })
    ]);
    const nodes = images.slice(0, take);
    const firstImage = nodes[0];
    const lastImage = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = images.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstImage === null || firstImage === void 0 ? void 0 : firstImage.id,
            endCursor: lastImage === null || lastImage === void 0 ? void 0 : lastImage.id
        }
    };
};
exports.getImages = getImages;
//# sourceMappingURL=image.queries.js.map