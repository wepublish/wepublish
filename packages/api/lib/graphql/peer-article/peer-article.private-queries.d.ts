import { GraphQLResolveInfo } from 'graphql';
import { Context } from '../../context';
import { ArticleFilter, ArticleSort, PeerArticle } from '../../db/article';
import { ConnectionResult, SortOrder } from '../../db/common';
export declare const getAdminPeerArticles: (filter: Partial<ArticleFilter>, sort: ArticleSort, order: SortOrder, peerNameFilter: string, stringifiedCursors: string, context: Context, info: GraphQLResolveInfo) => Promise<ConnectionResult<PeerArticle>>;
//# sourceMappingURL=peer-article.private-queries.d.ts.map