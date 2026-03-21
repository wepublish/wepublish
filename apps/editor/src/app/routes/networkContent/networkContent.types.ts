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

export interface DirectusClient {
  apiUrl: string | null;
  name: string;
  allowedUsers: Array<{
    Clients_id: string;
    directus_users_id: string;
  }>;
}

export interface ArticleFilterParams {
  search: string;
  clientName: string;
  dateFrom: string;
  dateTo: string;
}
