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
exports.updateArticle = exports.publishArticle = exports.unpublishArticle = exports.duplicateArticle = exports.createArticle = exports.deleteArticleById = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const deleteArticleById = async (id, authenticate, prisma) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteArticle, roles);
    const article = await prisma.article.findUnique({
        where: {
            id
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
    if (!article) {
        throw new error_1.NotFound('article', id);
    }
    await prisma.$transaction([
        prisma.article.delete({
            where: {
                id
            }
        }),
        prisma.articleRevision.deleteMany({
            where: {
                id: {
                    in: [article.draftId, article.pendingId, article.publishedId].filter(Boolean)
                }
            }
        })
    ]);
    return article;
};
exports.deleteArticleById = deleteArticleById;
const createArticle = async (input, authenticate, article) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateArticle, roles);
    const { shared, properties, authorIDs, socialMediaAuthorIDs } = input, data = __rest(input, ["shared", "properties", "authorIDs", "socialMediaAuthorIDs"]);
    return article.create({
        data: {
            shared,
            draft: {
                create: Object.assign(Object.assign({}, data), { properties: {
                        createMany: {
                            data: properties
                        }
                    }, authors: {
                        createMany: {
                            data: authorIDs.map(authorId => ({ authorId }))
                        }
                    }, socialMediaAuthors: {
                        createMany: {
                            data: socialMediaAuthorIDs.map(authorId => ({ authorId }))
                        }
                    }, revision: 0 })
            }
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
};
exports.createArticle = createArticle;
const duplicateArticle = async (id, authenticate, articles, articleClient) => {
    var _a, _b;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateArticle, roles);
    const article = await articles.load(id);
    if (!article) {
        throw new error_1.NotFound('article', id);
    }
    const _c = ((_b = (_a = article.draft) !== null && _a !== void 0 ? _a : article.pending) !== null && _b !== void 0 ? _b : article.published), { id: _id, updatedAt: _updatedAt, createdAt: _createdAt, publishedAt: _publishedAt, slug: _slug, properties, authors, socialMediaAuthors } = _c, articleRevision = __rest(_c, ["id", "updatedAt", "createdAt", "publishedAt", "slug", "properties", "authors", "socialMediaAuthors"]);
    const duplicatedProperties = properties.map(property => ({
        key: property.key,
        value: property.value,
        public: property.public
    }));
    const input = Object.assign(Object.assign({}, articleRevision), { properties: {
            createMany: {
                data: duplicatedProperties
            }
        }, authors: {
            createMany: {
                data: authors.map(({ authorId }) => ({ authorId }))
            }
        }, socialMediaAuthors: {
            createMany: {
                data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
            }
        } });
    return articleClient.create({
        data: {
            shared: article.shared,
            draft: {
                create: input
            }
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
};
exports.duplicateArticle = duplicateArticle;
const unpublishArticle = async (id, authenticate, articleClient) => {
    var _a, _b;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanPublishArticle, roles);
    const article = await articleClient.findUnique({
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
                    },
                    authors: true,
                    socialMediaAuthors: true
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
                    },
                    authors: true,
                    socialMediaAuthors: true
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
                    },
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
    if (!article) {
        throw new error_1.NotFound('article', id);
    }
    const _c = ((_b = (_a = article.draft) !== null && _a !== void 0 ? _a : article.pending) !== null && _b !== void 0 ? _b : article.published), { id: revisionId, properties, authors, socialMediaAuthors } = _c, revision = __rest(_c, ["id", "properties", "authors", "socialMediaAuthors"]);
    return articleClient.update({
        where: { id },
        data: {
            draft: {
                upsert: {
                    create: Object.assign(Object.assign({}, revision), { publishAt: null, publishedAt: null, updatedAt: null, properties: {
                            createMany: {
                                data: properties
                            }
                        }, authors: {
                            createMany: {
                                data: authors.map(({ authorId }) => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            createMany: {
                                data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
                            }
                        } }),
                    update: Object.assign(Object.assign({}, revision), { publishAt: null, publishedAt: null, updatedAt: null, properties: {
                            deleteMany: {
                                articleRevisionId: revisionId
                            },
                            createMany: {
                                data: properties
                            }
                        }, authors: {
                            deleteMany: {
                                revisionId
                            },
                            createMany: {
                                data: authors.map(({ authorId }) => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            deleteMany: {
                                revisionId
                            },
                            createMany: {
                                data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
                            }
                        } })
                }
            },
            pending: {
                delete: Boolean(article.pendingId)
            },
            published: {
                delete: Boolean(article.publishedId)
            }
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
};
exports.unpublishArticle = unpublishArticle;
const publishArticle = async (id, input, authenticate, articleClient) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanPublishArticle, roles);
    const publishAt = (_a = input.publishAt) !== null && _a !== void 0 ? _a : new Date();
    const publishedAt = input.publishedAt;
    const updatedAt = input.updatedAt;
    const article = await articleClient.findUnique({
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
                    },
                    authors: true,
                    socialMediaAuthors: true
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
                    },
                    authors: true,
                    socialMediaAuthors: true
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
                    },
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
    if (!article)
        throw new error_1.NotFound('article', id);
    if (!article.draft)
        return null;
    const _k = article.draft, { id: revisionId, properties, authors, socialMediaAuthors } = _k, revision = __rest(_k, ["id", "properties", "authors", "socialMediaAuthors"]);
    const publishedArticle = await articleClient.findFirst({
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
            pending: true,
            published: true
        }
    });
    if (publishedArticle && publishedArticle.id !== id) {
        throw new error_1.DuplicateArticleSlugError(publishedArticle.id, 
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (publishedArticle.published || publishedArticle.pending).slug);
    }
    if (publishAt > new Date()) {
        return articleClient.update({
            where: { id },
            data: {
                pending: {
                    upsert: {
                        create: Object.assign(Object.assign({}, revision), { publishAt, publishedAt: (_c = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_b = article === null || article === void 0 ? void 0 : article.published) === null || _b === void 0 ? void 0 : _b.publishedAt) !== null && _c !== void 0 ? _c : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, properties: {
                                createMany: {
                                    data: properties
                                }
                            }, authors: {
                                createMany: {
                                    data: authors.map(({ authorId }) => ({ authorId }))
                                }
                            }, socialMediaAuthors: {
                                createMany: {
                                    data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
                                }
                            } }),
                        update: Object.assign(Object.assign({}, revision), { publishAt, publishedAt: (_e = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_d = article === null || article === void 0 ? void 0 : article.published) === null || _d === void 0 ? void 0 : _d.publishedAt) !== null && _e !== void 0 ? _e : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, properties: {
                                deleteMany: {
                                    articleRevisionId: revisionId
                                },
                                createMany: {
                                    data: properties
                                }
                            }, authors: {
                                deleteMany: {
                                    revisionId
                                },
                                createMany: {
                                    data: authors.map(({ authorId }) => ({ authorId }))
                                }
                            }, socialMediaAuthors: {
                                deleteMany: {
                                    revisionId
                                },
                                createMany: {
                                    data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
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
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                pending: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                published: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                }
            }
        });
    }
    return articleClient.update({
        where: { id },
        data: {
            published: {
                upsert: {
                    create: Object.assign(Object.assign({}, revision), { publishedAt: (_g = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_f = article.published) === null || _f === void 0 ? void 0 : _f.publishAt) !== null && _g !== void 0 ? _g : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, publishAt: null, properties: {
                            createMany: {
                                data: properties
                            }
                        }, authors: {
                            createMany: {
                                data: authors.map(({ authorId }) => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            createMany: {
                                data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
                            }
                        } }),
                    update: Object.assign(Object.assign({}, revision), { publishedAt: (_j = publishedAt !== null && publishedAt !== void 0 ? publishedAt : (_h = article.published) === null || _h === void 0 ? void 0 : _h.publishAt) !== null && _j !== void 0 ? _j : publishAt, updatedAt: updatedAt !== null && updatedAt !== void 0 ? updatedAt : publishAt, publishAt: null, properties: {
                            deleteMany: {
                                articleRevisionId: revisionId
                            },
                            createMany: {
                                data: properties
                            }
                        }, authors: {
                            deleteMany: {
                                revisionId
                            },
                            createMany: {
                                data: authors.map(({ authorId }) => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            deleteMany: {
                                revisionId
                            },
                            createMany: {
                                data: socialMediaAuthors.map(({ authorId }) => ({ authorId }))
                            }
                        } })
                }
            },
            pending: {
                delete: Boolean(article.pendingId)
            },
            draft: {
                delete: true
            }
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
};
exports.publishArticle = publishArticle;
const updateArticle = async (id, _a, authenticate, articleClient) => {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var { properties, authorIDs, socialMediaAuthorIDs, shared } = _a, input = __rest(_a, ["properties", "authorIDs", "socialMediaAuthorIDs", "shared"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateArticle, roles);
    const article = await articleClient.findUnique({
        where: { id },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
    if (!article) {
        throw new error_1.NotFound('article', id);
    }
    return articleClient.update({
        where: { id },
        data: {
            shared,
            draft: {
                upsert: {
                    update: Object.assign(Object.assign({}, input), { revision: article.pending
                            ? article.pending.revision + 1
                            : article.published
                                ? article.published.revision + 1
                                : 0, updatedAt: null, createdAt: (_c = (_b = article.draft) === null || _b === void 0 ? void 0 : _b.createdAt) !== null && _c !== void 0 ? _c : new Date(), properties: {
                            deleteMany: {
                                articleRevisionId: (_e = (_d = article.draft) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : ''
                            },
                            createMany: {
                                data: properties.map(property => ({
                                    key: property.key,
                                    value: property.value,
                                    public: property.public
                                }))
                            }
                        }, authors: {
                            deleteMany: {
                                revisionId: (_g = (_f = article.draft) === null || _f === void 0 ? void 0 : _f.id) !== null && _g !== void 0 ? _g : ''
                            },
                            createMany: {
                                data: authorIDs.map(authorId => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            deleteMany: {
                                revisionId: (_j = (_h = article.draft) === null || _h === void 0 ? void 0 : _h.id) !== null && _j !== void 0 ? _j : ''
                            },
                            createMany: {
                                data: socialMediaAuthorIDs.map(authorId => ({ authorId }))
                            }
                        } }),
                    create: Object.assign(Object.assign({}, input), { revision: article.pending
                            ? article.pending.revision + 1
                            : article.published
                                ? article.published.revision + 1
                                : 0, updatedAt: null, createdAt: (_l = (_k = article.draft) === null || _k === void 0 ? void 0 : _k.createdAt) !== null && _l !== void 0 ? _l : new Date(), properties: {
                            createMany: {
                                data: properties.map(property => ({
                                    key: property.key,
                                    value: property.value,
                                    public: property.public
                                }))
                            }
                        }, authors: {
                            createMany: {
                                data: authorIDs.map(authorId => ({ authorId }))
                            }
                        }, socialMediaAuthors: {
                            createMany: {
                                data: socialMediaAuthorIDs.map(authorId => ({ authorId }))
                            }
                        } })
                }
            }
        },
        include: {
            draft: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            pending: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            },
            published: {
                include: {
                    properties: true,
                    authors: true,
                    socialMediaAuthors: true
                }
            }
        }
    });
};
exports.updateArticle = updateArticle;
//# sourceMappingURL=article.private-mutation.js.map