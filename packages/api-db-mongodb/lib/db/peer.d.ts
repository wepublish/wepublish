import { DBPeerAdapter, PeerProfile, OptionalPeer, Peer, PeerProfileInput, UpdatePeerInput, CreatePeerInput } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBPeerAdapter implements DBPeerAdapter {
    private peerProfiles;
    private peers;
    constructor(db: Db);
    getPeerProfile(): Promise<PeerProfile>;
    updatePeerProfile(input: PeerProfileInput): Promise<PeerProfile>;
    createPeer({ name, slug, hostURL, token }: CreatePeerInput): Promise<Peer>;
    updatePeer(id: string, { hostURL, name, slug, token, isDisabled }: UpdatePeerInput): Promise<OptionalPeer>;
    deletePeer(id: string): Promise<string | null>;
    getPeersByID(ids: readonly string[]): Promise<OptionalPeer[]>;
    getPeersBySlug(slugs: readonly string[]): Promise<OptionalPeer[]>;
    getPeers(): Promise<Peer[]>;
}
//# sourceMappingURL=peer.d.ts.map