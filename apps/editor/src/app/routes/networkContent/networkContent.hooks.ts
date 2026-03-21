import { usePeerListQuery } from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';

import type {
  ArticleFilterParams,
  DirectusClient,
  DirectusResponse,
  PeerArticle,
  PeerMatch,
} from './networkContent.types';
import { normalizeUrl } from './networkContent.utils';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://0.0.0.0:8055';

const PEER_ARTICLE_FIELDS = [
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
  'client.name',
].join(',');

function buildArticleParams(filters?: ArticleFilterParams): URLSearchParams {
  const params = new URLSearchParams({
    'filter[status][_eq]': 'published',
    sort: '-source_publishedAt',
    limit: '50',
    'fields[]': PEER_ARTICLE_FIELDS,
  });

  if (filters?.search) {
    params.set('search', filters.search);
  }

  if (filters?.clientName) {
    params.set('filter[client][name][_eq]', filters.clientName);
  }

  if (filters?.dateFrom) {
    params.set('filter[source_publishedAt][_gte]', filters.dateFrom);
  }

  if (filters?.dateTo) {
    params.set('filter[source_publishedAt][_lte]', filters.dateTo);
  }

  return params;
}

export function usePeerArticles(filters?: ArticleFilterParams) {
  const [articles, setArticles] = useState<PeerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serializedFilters = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        const params = buildArticleParams(filters);
        const response = await fetch(
          `${DIRECTUS_URL}/items/PeerArticles?${params}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: DirectusResponse<PeerArticle> = await response.json();

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
  }, [serializedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  return { articles, loading, error };
}

export function useNetworkClients() {
  const [clients, setClients] = useState<DirectusClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          'fields[]': '*,allowedUsers.*',
          limit: '100',
        });

        const response = await fetch(`${DIRECTUS_URL}/items/Clients?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: DirectusResponse<DirectusClient> = await response.json();

        if (!cancelled) {
          setClients(json.data);
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

  return { clients, loading, error };
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
