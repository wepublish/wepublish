import { CreatePageArgs, Page, UpdatePageArgs, OptionalPage, DeletePageArgs, PublishPageArgs, UnpublishPageArgs, ConnectionResult, GetPagesArgs, PublicPage, GetPublishedPagesArgs, OptionalPublicPage, DBPageAdapter } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBPageAdapter implements DBPageAdapter {
    private pages;
    private locale;
    constructor(db: Db, locale: string);
    createPage({ input }: CreatePageArgs): Promise<Page>;
    updatePage({ id, input }: UpdatePageArgs): Promise<OptionalPage>;
    deletePage({ id }: DeletePageArgs): Promise<boolean | null>;
    publishPage({ id, publishAt, publishedAt, updatedAt }: PublishPageArgs): Promise<OptionalPage>;
    unpublishPage({ id }: UnpublishPageArgs): Promise<OptionalPage>;
    getPagesByID(ids: readonly string[]): Promise<OptionalPage[]>;
    getPages({ filter, sort, order, cursor, limit }: GetPagesArgs): Promise<ConnectionResult<Page>>;
    getPublishedPagesByID(ids: readonly string[]): Promise<OptionalPublicPage[]>;
    getPublishedPagesBySlug(slugs: readonly string[]): Promise<OptionalPublicPage[]>;
    getPublishedPages({ filter, sort, order, cursor, limit }: GetPublishedPagesArgs): Promise<ConnectionResult<PublicPage>>;
    updatePendingPages(): Promise<void>;
}
//# sourceMappingURL=page.d.ts.map