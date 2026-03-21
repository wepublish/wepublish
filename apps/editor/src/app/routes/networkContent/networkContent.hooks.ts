import { usePeerListQuery } from '@wepublish/editor/api';
import { useEffect, useMemo, useState } from 'react';

import type {
  ArticleFilterParams,
  WepOneClient,
  WepOneResponse,
  PeerArticle,
  PeerMatch,
} from './networkContent.types';
import { normalizeUrl } from './networkContent.utils';

const WEP_ONE_URL =
  process.env.WEP_ONE_URL || 'https://one-admin.wepublish.cloud';

export const ARTICLES_PER_PAGE = 20;
export const CLIENTS_PER_PAGE = 20;

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

function buildArticleParams(
  filters?: ArticleFilterParams,
  page = 0
): URLSearchParams {
  const params = new URLSearchParams({
    'filter[status][_eq]': 'published',
    sort: '-source_publishedAt',
    limit: String(ARTICLES_PER_PAGE),
    offset: String(page * ARTICLES_PER_PAGE),
    'fields[]': PEER_ARTICLE_FIELDS,
    meta: 'filter_count',
  });

  if (filters?.search) {
    params.set('search', filters.search);
  }

  if (filters?.clientName) {
    params.set('filter[client][name][_eq]', filters.clientName);
  }

  if (filters?.dateFrom) {
    params.set(
      'filter[source_publishedAt][_gte]',
      `${filters.dateFrom}T00:00:00`
    );
  }

  if (filters?.dateTo) {
    params.set(
      'filter[source_publishedAt][_lte]',
      `${filters.dateTo}T23:59:59`
    );
  }

  return params;
}

export function usePeerArticles(filters?: ArticleFilterParams, page = 0) {
  const [articles, setArticles] = useState<PeerArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serializedFilters = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        const params = buildArticleParams(filters, page);
        const response = await fetch(
          `${WEP_ONE_URL}/items/PeerArticles?${params}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: WepOneResponse<PeerArticle> = await response.json();

        if (!cancelled) {
          setArticles(json.data);
          setTotalCount(json.meta?.filter_count ?? json.data.length);
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
  }, [serializedFilters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  return { articles, totalCount, loading, error };
}

export function useNetworkClients(page = 0) {
  const [clients, setClients] = useState<WepOneClient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          'fields[]':
            '*,allowedUsers.directus_users_id.first_name,allowedUsers.directus_users_id.last_name,allowedUsers.directus_users_id.email',
          limit: String(CLIENTS_PER_PAGE),
          offset: String(page * CLIENTS_PER_PAGE),
          meta: 'filter_count',
        });

        const response = await fetch(`${WEP_ONE_URL}/items/Clients?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: WepOneResponse<WepOneClient> = await response.json();

        if (!cancelled) {
          setClients(json.data);
          setTotalCount(json.meta?.filter_count ?? json.data.length);
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
  }, [page]);

  return { clients, totalCount, loading, error };
}

export function useAllNetworkClients() {
  const [clients, setClients] = useState<WepOneClient[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          'fields[]': 'name',
          limit: '200',
        });
        const response = await fetch(`${WEP_ONE_URL}/items/Clients?${params}`);
        if (!response.ok) return;
        const json: WepOneResponse<WepOneClient> = await response.json();
        if (!cancelled) setClients(json.data);
      } catch {
        // silently ignore – dropdown falls back to empty
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return clients;
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
