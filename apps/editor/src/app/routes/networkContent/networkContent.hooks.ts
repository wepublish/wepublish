import { usePeerListQuery } from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';

import type {
  DirectusResponse,
  PeerArticle,
  PeerMatch,
} from './networkContent.types';
import { normalizeUrl } from './networkContent.utils';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://0.0.0.0:8055';

const PEER_ARTICLES_PARAMS = new URLSearchParams({
  'filter[status][_eq]': 'published',
  sort: '-source_publishedAt',
  limit: '20',
  'fields[]': [
    'id',
    'status',
    'source_id',
    'source_publishedAt',
    'source_url',
    'source_title',
    'source_slug',
    'source_imageUrl',
    'source_lead',
    'client.apiUrl',
  ].join(','),
});

export function usePeerArticles() {
  const [articles, setArticles] = useState<PeerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(
          `${DIRECTUS_URL}/items/PeerArticles?${PEER_ARTICLES_PARAMS}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: DirectusResponse = await response.json();

        if (!cancelled) {
          setArticles(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { articles, loading, error };
}

export function usePeerMatching() {
  const { data: peerData, loading } = usePeerListQuery({
    errorPolicy: 'ignore',
  });

  const peers = peerData?.peers ?? [];

  const peerByApiUrl = useMemo<Map<string, PeerMatch>>(() => {
    const map = new Map<string, PeerMatch>();

    for (const peer of peers) {
      if (!peer.isDisabled && peer.hostURL) {
        map.set(normalizeUrl(peer.hostURL), {
          peerId: peer.id,
          peerName: peer.name,
        });
      }
    }

    return map;
  }, [peers]);

  const findPeerMatch = (clientApiUrl: string | null): PeerMatch | null => {
    if (!clientApiUrl) return null;
    return peerByApiUrl.get(normalizeUrl(clientApiUrl)) ?? null;
  };

  return { findPeerMatch, loading };
}
