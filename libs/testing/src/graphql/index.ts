// Schema types and operations are generated into sibling files; see the
// testing entries in codegen.yml for why they cannot share one file.
//
// A few operations carry the same name as the schema type they return
// (`Author`, `Challenge`, `Peer`, `PeerProfile`). Re-export the schema types
// under the bare name and the operation documents with a `Document` suffix.
export * from './schema-public';
export * from './graphql-public';

export type { Author, Challenge, Peer, PeerProfile } from './schema-public';

export {
  Author as AuthorDocument,
  Challenge as ChallengeDocument,
  Peer as PeerDocument,
  PeerProfile as PeerProfileDocument,
} from './graphql-public';
