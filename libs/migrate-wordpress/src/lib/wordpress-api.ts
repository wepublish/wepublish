import axios from 'axios'

export type WordpressTag = {
  name: string
  slug: string
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

const fetchAuth = () => {
  if (process.env['WORDPRESS_USERNAME'] && process.env['WORDPRESS_PASSWORD']) {
    return {
      username: process.env['WORDPRESS_USERNAME'],
      password: process.env['WORDPRESS_PASSWORD']
    }
  }
  return undefined
}

export const fetchPosts = async (page: number, perPage: number): Promise<WordpressPost[]> => {
  const response = await axios.get(WORDPRESS_URL + '/posts', {
    auth: fetchAuth(),
    params: {page, per_page: perPage, _embed: true}
  })
  return response.data
}

export const fetchPost = async (id: string): Promise<WordpressPost> => {
  const response = await axios.get(WORDPRESS_URL + '/posts/' + id, {
    auth: fetchAuth(),
    params: {_embed: true}
  })
  return response.data
}

export const fetchTagsForPost = async (postId: string): Promise<WordpressTag[]> => {
  const response = await axios.get(WORDPRESS_URL + '/tags?post=' + postId, {
    auth: fetchAuth()
  })
  return response.data
}
