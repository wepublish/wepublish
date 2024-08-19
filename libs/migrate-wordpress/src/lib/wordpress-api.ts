import axios, {AxiosRequestConfig} from 'axios'

export type WordpressTag = {
  name: string
  slug: string
}

export type WordpressCategory = {
  id: number
  name: string
  slug: string
  parent?: number
}

export type WordpressAuthor = {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: {
    96: string
  }
}

export type WordpressPost = {
  id: number
  title: {rendered: string}
  content: {rendered: string}
  excerpt: {rendered: string}
  date_gmt: string
  modified_gmt: string
  slug: string
  link: string
  wps_subtitle: string
  tags: number[]
  categories: number[]
  _embedded?: {
    'wp:featuredmedia'?: [
      {
        source_url: string
        alt_text: string
        title: {
          rendered: string
        }
        caption: {
          rendered: string
        }
      }
    ]
    author: WordpressAuthor[]
  }
}

const WORDPRESS_URL = process.env['WORDPRESS_URL'] + '/wp-json/wp/v2'

const request = ({path, ...request}: Omit<AxiosRequestConfig, 'url'> & {path: string}) => {
  // console.log(`${request.method ?? 'get'} ${path}`)
  return axios.request({
    url: WORDPRESS_URL + path,
    ...request
  })
}

const fetchAuth = () => {
  if (process.env['WORDPRESS_USERNAME'] && process.env['WORDPRESS_PASSWORD']) {
    return {
      username: process.env['WORDPRESS_USERNAME'],
      password: process.env['WORDPRESS_PASSWORD']
    }
  }
  return undefined
}

type FetchPostsProps = {
  page: number
  perPage: number
  categoryId?: number
}

export const fetchPosts = async ({
  categoryId,
  perPage,
  page
}: FetchPostsProps): Promise<WordpressPost[]> => {
  const params = {page, per_page: perPage, _embed: true} as any
  if (categoryId) {
    params.categories = categoryId.toString()
  }
  const response = await request({
    method: 'get',
    path: '/posts',
    auth: fetchAuth(),
    params
  })
  return response.data
}

export const fetchPost = async (id: string): Promise<WordpressPost> => {
  const response = await request({
    method: 'get',
    path: '/posts/' + id,
    auth: fetchAuth(),
    params: {_embed: true}
  })
  return response.data
}

export const fetchTagsForPost = async (postId: string): Promise<WordpressTag[]> => {
  const response = await request({
    method: 'get',
    path: '/tags?post=' + postId,
    auth: fetchAuth()
  })
  return response.data
}

export const fetchLeafCategoriesForPost = async (postId: number): Promise<WordpressCategory[]> => {
  const response = await request({
    method: 'get',
    path: '/categories?post=' + postId,
    auth: fetchAuth()
  })
  return response.data
}

export const fetchCategoryById = async (categoryId: number): Promise<WordpressCategory> => {
  const response = await request({
    method: 'get',
    path: '/categories/' + categoryId.toString(),
    auth: fetchAuth()
  })
  return response.data
}

export const fetchCategoryBranch = async (categoryId: number) => {
  const category = await fetchCategoryById(categoryId)
  const categories = [category]
  if (category.parent) {
    categories.push(...(await fetchCategoryBranch(category.parent)))
  }
  return categories
}

export const fetchCategoriesForPost = async (postId: number): Promise<WordpressCategory[]> => {
  const leafCategories = await fetchLeafCategoriesForPost(postId)
  const categories = []

  for (const category of leafCategories) {
    categories.push(...(await fetchCategoryBranch(category.id)))
  }
  return categories
}
