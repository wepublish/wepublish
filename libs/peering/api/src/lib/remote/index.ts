// Schema types and operations are generated into sibling files; see the
// peering entries in codegen.yml for why they cannot share one file.
//
// A few operations carry the same name as the schema type they return
// (`Article`, `PeerProfile`, `RemotePeerProfile`). Re-export the schema types
// under the bare name and the operation documents with a `Document` suffix, so
// the ambiguity is resolved the same way the rest of the repo names documents.
export * from './schema';
export * from './graphql';

export type { Article, PeerProfile, RemotePeerProfile } from './schema';

export {
  Article as ArticleDocument,
  PeerProfile as PeerProfileDocument,
  RemotePeerProfile as RemotePeerProfileDocument,
} from './graphql';
