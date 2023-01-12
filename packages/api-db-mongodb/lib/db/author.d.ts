import { DBAuthorAdapter, CreateAuthorArgs, Author, UpdateAuthorArgs, OptionalAuthor, DeleteAuthorArgs, ConnectionResult, GetAuthorsArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBAuthorAdapter implements DBAuthorAdapter {
    private authors;
    private locale;
    constructor(db: Db, locale: string);
    createAuthor({ input }: CreateAuthorArgs): Promise<Author>;
    updateAuthor({ id, input }: UpdateAuthorArgs): Promise<OptionalAuthor>;
    deleteAuthor({ id }: DeleteAuthorArgs): Promise<string | null>;
    getAuthorsByID(ids: readonly string[]): Promise<OptionalAuthor[]>;
    getAuthorsBySlug(slugs: readonly string[]): Promise<OptionalAuthor[]>;
    getAuthors({ filter, sort, order, cursor, limit }: GetAuthorsArgs): Promise<ConnectionResult<Author>>;
}
//# sourceMappingURL=author.d.ts.map