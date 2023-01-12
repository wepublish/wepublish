import { DBCommentAdapter, AddPublicCommentArgs, UpdatePublicCommentArgs, TakeActionOnCommentArgs, OptionalComment, Comment, GetCommentsArgs, GetPublicCommentsArgs, ConnectionResult, PublicComment, OptionalPublicComment } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBCommentAdapter implements DBCommentAdapter {
    private comments;
    private locale;
    constructor(db: Db, locale: string);
    addPublicComment({ input }: AddPublicCommentArgs): Promise<PublicComment>;
    updatePublicComment({ id, text, state }: UpdatePublicCommentArgs): Promise<OptionalPublicComment>;
    getComments({ filter, sort, order, cursor, limit }: GetCommentsArgs): Promise<ConnectionResult<Comment>>;
    getPublicCommentsForItemByID(args: GetPublicCommentsArgs): Promise<PublicComment[]>;
    getCommentById(id: string): Promise<OptionalComment>;
    getPublicChildrenCommentsByParentId(id: string, userID: string): Promise<PublicComment[]>;
    takeActionOnComment({ id, state, rejectionReason }: TakeActionOnCommentArgs): Promise<OptionalComment>;
}
//# sourceMappingURL=comment.d.ts.map