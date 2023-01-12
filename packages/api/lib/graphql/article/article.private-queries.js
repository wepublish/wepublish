"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminArticles = exports.getArticlePreviewLink = exports.getArticleById = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const article_queries_1 = require("./article.queries");
const getArticleById = async (id, authenticate, articleLoader) => {
    const { roles } = authenticate();
    const canGetArticle = (0, permissions_1.isAuthorised)(permissions_1.CanGetArticle, roles);
    const canGetSharedArticle = (0, permissions_1.isAuthorised)(permissions_1.CanGetSharedArticle, roles);
    if (canGetArticle || canGetSharedArticle) {
        const article = await articleLoader.load(id);
        if (canGetArticle) {
            return article;
        }
        else {
            return (article === null || article === void 0 ? void 0 : article.shared) ? article : null;
        }
    }
    else {
        throw new error_1.NotAuthorisedError();
    }
};
exports.getArticleById = getArticleById;
const getArticlePreviewLink = async (id, hours, authenticate, generateJWT, urlAdapter, articles) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetArticlePreviewLink, roles);
    const article = await articles.load(id);
    if (!article)
        throw new error_1.NotFound('article', id);
    if (!article.draft)
        throw new error_1.UserInputError('Article needs to have a draft');
    const token = generateJWT({
        id: article.id,
        expiresInMinutes: hours * 60
    });
    return urlAdapter.getArticlePreviewURL(token);
};
exports.getArticlePreviewLink = getArticlePreviewLink;
const getAdminArticles = async (filter, sortedField, order, cursorId, skip, take, authenticate, article) => {
    const { roles } = authenticate();
    const canGetArticles = (0, permissions_1.isAuthorised)(permissions_1.CanGetArticles, roles);
    const canGetSharedArticles = (0, permissions_1.isAuthorised)(permissions_1.CanGetSharedArticles, roles);
    if (canGetArticles || canGetSharedArticles) {
        return (0, article_queries_1.getArticles)(Object.assign(Object.assign({}, filter), { shared: !canGetArticles ? true : undefined }), sortedField, order, cursorId, skip, take, article);
    }
    else {
        throw new error_1.NotAuthorisedError();
    }
};
exports.getAdminArticles = getAdminArticles;
//# sourceMappingURL=article.private-queries.js.map