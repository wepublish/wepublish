import { DBArticleAdapter, CreateArticleArgs, Article, UpdateArticleArgs, OptionalArticle, DeleteArticleArgs, PublishArticleArgs, UnpublishArticleArgs, ConnectionResult, GetArticlesArgs, OptionalPublicArticle, GetPublishedArticlesArgs, PublicArticle } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBArticleAdapter implements DBArticleAdapter {
    private articles;
    private locale;
    constructor(db: Db, locale: string);
    createArticle({ input }: CreateArticleArgs): Promise<Article>;
    updateArticle({ id, input }: UpdateArticleArgs): Promise<OptionalArticle>;
    deleteArticle({ id }: DeleteArticleArgs): Promise<boolean | null>;
    publishArticle({ id, publishAt, publishedAt, updatedAt }: PublishArticleArgs): Promise<OptionalArticle>;
    unpublishArticle({ id }: UnpublishArticleArgs): Promise<OptionalArticle>;
    getArticlesByID(ids: readonly string[]): Promise<OptionalArticle[]>;
    getArticles({ filter, sort, order, cursor, limit }: GetArticlesArgs): Promise<ConnectionResult<Article>>;
    getPublishedArticlesByID(ids: readonly string[]): Promise<OptionalPublicArticle[]>;
    getPublishedArticleBySlug(slug: string): Promise<OptionalPublicArticle>;
    getPublishedArticles({ filter, sort, order, cursor, limit }: GetPublishedArticlesArgs): Promise<ConnectionResult<PublicArticle>>;
    updatePendingArticles(): Promise<void>;
}
//# sourceMappingURL=article.d.ts.map