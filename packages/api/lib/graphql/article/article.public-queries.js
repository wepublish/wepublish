"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedArticleByIdOrSlug = exports.getPublishedArticles = void 0;
const session_1 = require("../../db/session");
const server_1 = require("../../server");
const article_queries_1 = require("./article.queries");
const getPublishedArticles = async (filter, sortedField, order, cursorId, skip, take, article) => {
    const data = await (0, article_queries_1.getArticles)(Object.assign(Object.assign({}, filter), { published: true }), sortedField, order, cursorId, skip, take, article);
    return Object.assign(Object.assign({}, data), { nodes: data.nodes.map(({ id, shared, published }) => (Object.assign(Object.assign({ shared }, published), { id }))) });
};
exports.getPublishedArticles = getPublishedArticles;
const getPublishedArticleByIdOrSlug = async (id, slug, token, session, verifyJWT, publicArticles, articles, articleClient) => {
    var _a;
    let article = id ? await publicArticles.load(id) : null;
    if (!article && slug) {
        const fullArticle = await articleClient.findFirst({
            where: {
                OR: [
                    {
                        published: {
                            is: {
                                slug
                            }
                        }
                    },
                    {
                        pending: {
                            is: {
                                slug
                            }
                        }
                    }
                ]
            },
            include: {
                draft: {
                    include: {
                        properties: true,
                        authors: true
                    }
                },
                pending: {
                    include: {
                        properties: true,
                        authors: true
                    }
                },
                published: {
                    include: {
                        properties: true,
                        authors: true
                    }
                }
            }
        });
        article = fullArticle
            ? Object.assign(Object.assign({}, ((_a = fullArticle === null || fullArticle === void 0 ? void 0 : fullArticle.published) !== null && _a !== void 0 ? _a : fullArticle.pending)), { id: fullArticle.id, shared: fullArticle === null || fullArticle === void 0 ? void 0 : fullArticle.shared })
            : null;
    }
    if (!article && token) {
        try {
            const articleId = verifyJWT(token);
            const privateArticle = await articles.load(articleId);
            article = (privateArticle === null || privateArticle === void 0 ? void 0 : privateArticle.draft)
                ? Object.assign(Object.assign({}, privateArticle.draft), { id: privateArticle.id, shared: privateArticle.shared, updatedAt: new Date(), publishedAt: new Date() })
                : null;
        }
        catch (error) {
            (0, server_1.logger)('graphql-query').warn(error, 'Error while verifying token with article id.');
        }
    }
    if ((session === null || session === void 0 ? void 0 : session.type) === session_1.SessionType.Token) {
        return (article === null || article === void 0 ? void 0 : article.shared) ? article : null;
    }
    return article;
};
exports.getPublishedArticleByIdOrSlug = getPublishedArticleByIdOrSlug;
//# sourceMappingURL=article.public-queries.js.map