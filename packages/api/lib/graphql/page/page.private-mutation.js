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
exports.updatePage = exports.publishPage = exports.unpublishPage = exports.duplicatePage = exports.createPage = exports.deletePageById = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const deletePageById = async (id, authenticate, prisma) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeletePage, roles);
    const page = await prisma.page.findUnique({
        where: {
            id
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
    if (!page) {
        throw new error_1.NotFound('page', id);
    }
    await prisma.$transaction([
        prisma.page.delete({
            where: {
                id
            }
        }),
        prisma.pageRevision.deleteMany({
            where: {
                id: {
                    in: [page.draftId, page.pendingId, page.publishedId].filter(Boolean)
                }
            }
        })
    ]);
    return page;
};
exports.deletePageById = deletePageById;
const createPage = async (input, authenticate, page) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePage, roles);
    const { properties } = input, data = __rest(input, ["properties"]);
    return page.create({
        data: {
            draft: {
                create: Object.assign(Object.assign({}, data), { properties: {
                        createMany: {
                            data: properties
                        }
                    }, revision: 0 })
            }
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
};
exports.createPage = createPage;
const duplicatePage = async (id, authenticate, pages, pageClient) => {
    var _a, _b;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePage, roles);
    const page = await pages.load(id);
    if (!page) {
        throw new error_1.NotFound('page', id);
    }
    const _c = ((_b = (_a = page.draft) !== null && _a !== void 0 ? _a : page.pending) !== null && _b !== void 0 ? _b : page.published), { id: _id, updatedAt: _updatedAt, createdAt: _createdAt, publishedAt: _publishedAt, slug: _slug, properties } = _c, pageRevision = __rest(_c, ["id", "updatedAt", "createdAt", "publishedAt", "slug", "properties"]);
    const duplicatedProperties = properties.map(property => ({
        key: property.key,
        value: property.value,
        public: property.public
    }));
    const input = Object.assign(Object.assign({}, pageRevision), { properties: {
            createMany: {
                data: duplicatedProperties
            }
        } });
    return pageClient.create({
        data: {
            draft: {
                create: input
            }
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
};
exports.duplicatePage = duplicatePage;
const unpublishPage = async (id, authenticate, pageClient) => {
    var _a, _b;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanPublishPage, roles);
    const page = await pageClient.findUnique({
        where: { id },
        include: {
            draft: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            },
            pending: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            },
            published: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            }
        }
    });
    if (!page || !(page.pending || page.published)) {
        throw new error_1.NotFound('page', id);
    }
    const _c = ((_b = (_a = page.draft) !== null && _a !== void 0 ? _a : page.pending) !== null && _b !== void 0 ? _b : page.published), { id: revisionId, properties } = _c, revision = __rest(_c, ["id", "properties"]);
    return pageClient.update({
        where: { id },
        data: {
            draft: {
                upsert: {
                    create: Object.assign(Object.assign({}, revision), { publishAt: null, publishedAt: null, updatedAt: null, properties: {
                            createMany: {
                                data: properties
                            }
                        } }),
                    update: Object.assign(Object.assign({}, revision), { publishAt: null, publishedAt: null, updatedAt: null, properties: {
                            deleteMany: {
                                pageRevisionId: revisionId
                            },
                            createMany: {
                                data: properties
                            }
                        } })
                }
            },
            pending: {
                delete: Boolean(page.pendingId)
            },
            published: {
                delete: Boolean(page.publishedId)
            }
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
};
exports.unpublishPage = unpublishPage;
const publishPage = async (id, input, authenticate, pageClient) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanPublishPage, roles);
    const publishAt = (_a = input.publishAt) !== null && _a !== void 0 ? _a : new Date();
    const publishedAt = input.publishedAt;
    const updatedAt = input.updatedAt;
    const page = await pageClient.findUnique({
        where: { id },
        include: {
            draft: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            },
            pending: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            },
            published: {
                include: {
                    properties: {
                        select: {
                            key: true,
                            value: true,
                            public: true
                        }
                    }
                }
            }
        }
    });
    if (!page)
        throw new error_1.NotFound('page', id);
    if (!page.draft)
        return null;
    const _k = page.draft, { id: revisionId, properties } = _k, revision = __rest(_k, ["id", "properties"]);
    const publishedPage = await pageClient.findFirst({
        where: {
            OR: [
                {
                    published: {
                        is: {
                            slug: revision.slug
                        }
                    }
                },
                {
                    pending: {
                        is: {
                            slug: revision.slug
                        }
                    }
                }
            ]
        },
        include: {
            draft: true,
            pending: true,
            published: true
        }
    });
    if (publishedPage && publishedPage.id !== id) {
        throw new error_1.DuplicatePageSlugError(publishedPage.id, 
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (publishedPage.published || publishedPage.pending).slug);
    }
    if (publishAt > new Date()) {
        return pageClient.update({
            where: { id },
            data: {
                pending: {
                    upsert: {
                        create: Object.assign(Object.assign({}, revision), { publishAt, publishedAt: (_c = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_b = page === null || page === void 0 ? void 0 : page.published) === null || _b === void 0 ? void 0 : _b.publishedAt) !== null && _c !== void 0 ? _c : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, properties: {
                                createMany: {
                                    data: properties
                                }
                            } }),
                        update: Object.assign(Object.assign({}, revision), { publishAt, publishedAt: (_e = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_d = page === null || page === void 0 ? void 0 : page.published) === null || _d === void 0 ? void 0 : _d.publishedAt) !== null && _e !== void 0 ? _e : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, properties: {
                                deleteMany: {
                                    pageRevisionId: revisionId
                                },
                                createMany: {
                                    data: properties
                                }
                            } })
                    }
                },
                draft: {
                    delete: true
                }
            },
            include: {
                draft: {
                    include: {
                        properties: true
                    }
                },
                pending: {
                    include: {
                        properties: true
                    }
                },
                published: {
                    include: {
                        properties: true
                    }
                }
            }
        });
    }
    return pageClient.update({
        where: { id },
        data: {
            published: {
                upsert: {
                    create: Object.assign(Object.assign({}, revision), { publishedAt: (_g = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_f = page.published) === null || _f === void 0 ? void 0 : _f.publishAt) !== null && _g !== void 0 ? _g : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, publishAt: null, properties: {
                            createMany: {
                                data: properties
                            }
                        } }),
                    update: Object.assign(Object.assign({}, revision), { publishedAt: (_j = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_h = page.published) === null || _h === void 0 ? void 0 : _h.publishAt) !== null && _j !== void 0 ? _j : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, publishAt: null, properties: {
                            createMany: {
                                data: properties
                            }
                        } })
                }
            },
            pending: {
                delete: Boolean(page.pendingId)
            },
            draft: {
                delete: true
            }
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
};
exports.publishPage = publishPage;
const updatePage = async (id, _a, authenticate, pageClient) => {
    var _b, _c, _d, _e, _f, _g;
    var { properties } = _a, input = __rest(_a, ["properties"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreatePage, roles);
    const page = await pageClient.findUnique({
        where: { id },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
    if (!page) {
        throw new error_1.NotFound('page', id);
    }
    return pageClient.update({
        where: { id },
        data: {
            draft: {
                upsert: {
                    update: Object.assign(Object.assign({}, input), { revision: page.pending
                            ? page.pending.revision + 1
                            : page.published
                                ? page.published.revision + 1
                                : 0, updatedAt: null, createdAt: (_c = (_b = page.draft) === null || _b === void 0 ? void 0 : _b.createdAt) !== null && _c !== void 0 ? _c : new Date(), properties: {
                            deleteMany: {
                                pageRevisionId: (_e = (_d = page.draft) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : ''
                            },
                            createMany: {
                                data: properties.map(property => ({
                                    key: property.key,
                                    value: property.value,
                                    public: property.public
                                }))
                            }
                        } }),
                    create: Object.assign(Object.assign({}, input), { revision: page.pending
                            ? page.pending.revision + 1
                            : page.published
                                ? page.published.revision + 1
                                : 0, updatedAt: null, createdAt: (_g = (_f = page.draft) === null || _f === void 0 ? void 0 : _f.createdAt) !== null && _g !== void 0 ? _g : new Date(), properties: {
                            createMany: {
                                data: properties.map(property => ({
                                    key: property.key,
                                    value: property.value,
                                    public: property.public
                                }))
                            }
                        } })
                }
            }
        },
        include: {
            draft: {
                include: {
                    properties: true
                }
            },
            pending: {
                include: {
                    properties: true
                }
            },
            published: {
                include: {
                    properties: true
                }
            }
        }
    });
};
exports.updatePage = updatePage;
//# sourceMappingURL=page.private-mutation.js.map