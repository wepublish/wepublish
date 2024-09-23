import * as fs from 'fs'
import {fetchPosts, WordpressPost} from '../posts/wordpress-api'

const BASE_URL: string = process.env['WORDPRESS_URL'] || 'https://mannschaft.com'
const BASE_PATH = './libs/migrate-wordpress/src/lib/redirects'
const IMPORT_PATH = BASE_PATH + '/import-redirects.json'
const EXPORT_PATH = BASE_PATH + '/redirects.json'

interface NextJsRoute {
  source: string
  destination: string
  permanent: boolean
}

init()

async function init() {
  try {
    console.log('read file...')
    const originalRedirects = readFile()
    console.log('transform redirects...')
    const nextJsCompatibleRoutes: NextJsRoute[] = transformData(originalRedirects)
    console.log('fetching wordpress posts...')
    const wpArticleRedirects: NextJsRoute[] = await getRedirectsFromWpArticles()
    console.log('write file...')
    saveFile([...nextJsCompatibleRoutes, ...wpArticleRedirects])
    console.log('congrats, all done!')
  } catch (e) {
    console.log('# while migrating the redirects an error occurred', e)
  }
}

function readFile(): any[] {
  const data = fs.readFileSync(IMPORT_PATH, 'utf8')
  const originalRedirects = JSON.parse(data)?.redirects
  if (!originalRedirects) throw new Error('no redirects found.')
  return originalRedirects
}

function transformData(inputData: any[]): NextJsRoute[] {
  const nextJsCompatibleRoutes: NextJsRoute[] = []
  for (const redirect of inputData) {
    const source = getPathname(redirect?.url)
    const destination = getPathname(redirect?.action_data?.url)
    if (!source || !destination)
      throw new Error(`old or new url not provided in redirect with id ${redirect?.id}`)
    nextJsCompatibleRoutes.push({
      source,
      destination,
      permanent: false
    })
  }
  return nextJsCompatibleRoutes
}

function saveFile(data: NextJsRoute[]) {
  const jsonData = JSON.stringify(data, null, 2)
  fs.writeFileSync(EXPORT_PATH, jsonData, 'utf8')
}

async function getRedirectsFromWpArticles(): Promise<NextJsRoute[]> {
  let wpArticleRedirects: NextJsRoute[] = []
  const perPage = 100

  // get first batch of posts
  console.log('fetching page 1...')
  const {items, total} = await fetchPosts({
    page: 1,
    perPage
  })

  wpArticleRedirects = getRedirectsFromPosts(items)

  // get rest of posts
  const maxPages = Math.ceil(total / perPage)
  for (let page = 2; page < maxPages; page++) {
    console.log(`page ${page}/${maxPages}...`)
    const {items} = await fetchPosts({
      page,
      perPage
    })
    wpArticleRedirects = [...wpArticleRedirects, ...getRedirectsFromPosts(items)]
  }

  return wpArticleRedirects
}

function getRedirectsFromPosts(posts: WordpressPost[]): NextJsRoute[] {
  const wpArticleRedirects: NextJsRoute[] = []
  for (const post of posts) {
    const source = getPathname(post.link)
    const destination = `/a${getPathname(post.link)}`
    wpArticleRedirects.push({
      source,
      destination,
      permanent: false
    })
  }
  return wpArticleRedirects
}

function getPathname(rawUrl: string): string {
  // remove trailing slash
  // remove base url
  return rawUrl?.replace(BASE_URL, '')?.replace(/\/$/, '') || '/'
}
