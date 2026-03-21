export interface PeerArticle {
  id: string;
  status: string;
  source_id: string;
  source_publishedAt: string;
  source_url: string;
  source_title: string;
  source_slug: string;
  source_imageUrl: string | null;
  source_lead: string;
  client: {
    apiUrl: string | null;
    name: string | null;
  };
}

export interface DirectusResponse<T> {
  data: T[];
  meta?: {
    filter_count?: number;
    total_count?: number;
  };
}

export interface PeerMatch {
  peerId: string;
  peerName: string;
}

export interface ImportOptions {
  importAuthors: boolean;
  importTags: boolean;
  importContentImages: boolean;
}

export interface ArticleToImport {
  peerId: string;
  articleId: string;
}

export interface DirectusUser {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface DirectusClient {
  apiUrl: string | null;
  name: string;
  allowedUsers: Array<{
    directus_users_id: DirectusUser;
  }>;
}

export interface ArticleFilterParams {
  search: string;
  clientName: string;
  dateFrom: string;
  dateTo: string;
}
