import axios, { AxiosRequestConfig, AxiosResponseHeaders } from 'axios';
import { cache } from './cache';

export type WordpressTag = {
  name: string;
  slug: string;
};

export type WordpressCategory = {
  id: number;
  name: string;
  slug: string;
  parent?: number;
};

export type WordpressAuthor = {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    96: string;
  };
};

export type WordpressPost = {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date_gmt: string;
  modified_gmt: string;
  slug: string;
  link: string;
  wps_subtitle: string;
  tags: number[];
  categories: number[];
  _embedded?: {
    'wp:featuredmedia'?: [
      {
        source_url: string;
        alt_text: string;
        title: {
          rendered: string;
        };
        caption: {
          rendered: string;
        };
      }
    ];
    author: WordpressAuthor[];
  };
};

const WORDPRESS_URL =
  (process.env['WORDPRESS_URL'] || 'https://mannschaft.com') + '/wp-json/wp/v2';

const categoriesCache = cache('categories');
const tagsCache = cache('tags');

const request = async ({
  path,
  ...request
}: Omit<AxiosRequestConfig, 'url'> & { path: string }) => {
  const requestConfig: AxiosRequestConfig = {
    url: WORDPRESS_URL + path,
    ...request,
  };
  try {
    return await axios.request(requestConfig);
  } catch (e) {
    console.error('Request to wordpress API failed');
    console.error(requestConfig);
    throw e;
  }
};

const fetchAuth = () => {
  if (process.env['WORDPRESS_USERNAME'] && process.env['WORDPRESS_PASSWORD']) {
    return {
      username: process.env['WORDPRESS_USERNAME'],
      password: process.env['WORDPRESS_PASSWORD'],
    };
  }
  return undefined;
};

type FetchPostsProps = {
  page: number;
  perPage: number;
  categoryId?: number;
  orderby?: string;
  order?: string;
};

export type WordpressPostsResponse = {
  items: WordpressPost[];
  total: number;
};

export const fetchPosts = async ({
  perPage,
  page,
  ...query
}: FetchPostsProps): Promise<WordpressPostsResponse> => {
  const params = { page, per_page: perPage, _embed: true, ...query } as any;

  const response = await request({
    method: 'get',
    path: '/posts',
    auth: fetchAuth(),
    params,
  });
  const headers = response.headers as AxiosResponseHeaders;
  return {
    items: response.data,
    total: +headers.get('X-WP-Total')!,
  };
};

export const fetchPost = async (id: number): Promise<WordpressPost> => {
  const response = await request({
    method: 'get',
    path: '/posts/' + id,
    auth: fetchAuth(),
    params: { _embed: true },
  });
  return response.data;
};

export const fetchTagsForPost = async (
  postId: string
): Promise<WordpressTag[]> => {
  const response = await request({
    method: 'get',
    path: '/tags?post=' + postId,
    auth: fetchAuth(),
  });
  return response.data;
};

export const fetchTag = async (tagId: number): Promise<WordpressTag> => {
  return tagsCache.get(tagId.toString(), async tagId => {
    const response = await request({
      method: 'get',
      path: `/tags/${tagId}`,
      auth: fetchAuth(),
    });
    return response.data;
  });
};

export const fetchLeafCategoriesForPost = async (
  postId: number
): Promise<WordpressCategory[]> => {
  const response = await request({
    method: 'get',
    path: '/categories?post=' + postId,
    auth: fetchAuth(),
  });
  return response.data;
};

export const fetchCategoryById = async (
  categoryId: number
): Promise<WordpressCategory> => {
  return categoriesCache.get(categoryId.toString(), async categoryId => {
    const response = await request({
      method: 'get',
      path: '/categories/' + categoryId.toString(),
      auth: fetchAuth(),
    });
    return response.data;
  });
};

export const fetchCategoryBranch = async (categoryId: number) => {
  const category = await fetchCategoryById(categoryId);
  const categories = [category];
  if (category.parent) {
    categories.push(...(await fetchCategoryBranch(category.parent)));
  }
  return categories;
};

export const fetchCategoriesForPost = async (
  postId: number
): Promise<WordpressCategory[]> => {
  const leafCategories = await fetchLeafCategoriesForPost(postId);
  const categories = [];

  for (const category of leafCategories) {
    categories.push(...(await fetchCategoryBranch(category.id)));
  }
  return categories;
};
