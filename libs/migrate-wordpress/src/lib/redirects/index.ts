import * as fs from 'fs'
import {fetchPosts, WordpressPost} from '../posts/wordpress-api'
import {slugify} from '../posts/utils'

const BASE_URL: string = process.env['WORDPRESS_URL'] || 'https://mannschaft.com'
const BASE_PATH = './libs/migrate-wordpress/src/lib/redirects'
const IMPORT_PATH = BASE_PATH + '/import-redirects.json'
const EXPORT_PATH = BASE_PATH + '/redirects.json'
const EXPORT_PATH_WARNS = BASE_PATH + '/warns.json'

type NextJsRedirectsMap = {
  [key: string]: NextJsRoute
}

interface NextJsRoute {
  destination: string
  permanent?: boolean
}

const exportWarns: NextJsRedirectsMap = {}

init()

async function init() {
  try {
    console.log('read file...')
    const originalRedirects = readFile()
    console.log('transform redirects...')
    const nextJsCompatibleRoutes: NextJsRedirectsMap = transformData(originalRedirects)
    console.log('fetching wordpress posts...')
    const wpArticleRedirects: NextJsRedirectsMap = await getRedirectsFromWpArticles()
    console.log('resolve redirects...')
    const nextJsRoutes = resolveRedirects({...nextJsCompatibleRoutes, ...wpArticleRedirects})
    console.log('write file...')
    saveFile(nextJsRoutes, EXPORT_PATH)
    console.log('write warning file...')
    saveFile(exportWarns, EXPORT_PATH_WARNS)
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

function transformData(inputData: any[]): NextJsRedirectsMap {
  let nextJsCompatibleRoutes: NextJsRedirectsMap = {}
  for (const redirect of inputData) {
    nextJsCompatibleRoutes = addRedirectToMap(
      nextJsCompatibleRoutes,
      redirect?.url,
      redirect?.action_data?.url
    )
  }
  return nextJsCompatibleRoutes
}

function saveFile(data: NextJsRedirectsMap, exportPath: string) {
  const jsonData = JSON.stringify(data, null, 2)
  fs.writeFileSync(exportPath, jsonData, 'utf8')
}

async function getRedirectsFromWpArticles(): Promise<NextJsRedirectsMap> {
  let wpArticleRedirects: NextJsRedirectsMap = {}
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
    wpArticleRedirects = {...wpArticleRedirects, ...getRedirectsFromPosts(items)}
  }

  return wpArticleRedirects
}

function getRedirectsFromPosts(posts: WordpressPost[]): NextJsRedirectsMap {
  let wpArticleRedirects: NextJsRedirectsMap = {}
  for (const post of posts) {
    wpArticleRedirects = addRedirectToMap(wpArticleRedirects, post.link, post.link)
  }
  return wpArticleRedirects
}

function getSourcePath(rawUrl: string): string {
  return standardizeRawUrl(rawUrl)
}

function getDestinationPath(rawUrl: string): string {
  let newDestination = standardizeRawUrl(rawUrl)

  // preserve search params
  const {pathname, searchParams} = new URL(`${BASE_URL}/${newDestination}`)

  // slugify every part of the path name separately. otherwise slashes / would be deleted by the slugify method
  newDestination = pathname
    .split('/')
    .filter(pathnameBit => !!pathnameBit) // remove empty strings
    .map(pathnameBit => slugify(pathnameBit)) // slugify each pathname bit
    .join('/') // re-join the pathname

  // add search params again to the url
  if (searchParams.size) {
    newDestination += `?${new URLSearchParams(searchParams).toString()}`
  }

  // every pathname should start with /
  // empty path would also get a slash
  if (!newDestination.startsWith('/')) {
    newDestination = `/${newDestination}`
  }

  // add /a/ to the pathname only if
  // - one slug is available (article)
  // - or pathname consists of 2 parts and starts with /tag/
  const pathNameParts = newDestination.split('/').filter(pathNamePart => !!pathNamePart)
  if (
    pathNameParts.length === 1 ||
    (pathNameParts.length === 2 && newDestination.startsWith('/tag/'))
  ) {
    newDestination = `/a${newDestination}`
  }

  return newDestination
}

// common helper function for destination and source path
function standardizeRawUrl(rawUrl: string): string {
  // remove base url
  // remove trailing slash
  return rawUrl?.replace(BASE_URL, '')?.replace(/\/$/, '')
}

function addRedirectToMap(map: NextJsRedirectsMap, rawSource: string, rawDestination: string) {
  const source = getSourcePath(rawSource)
  const destination = getDestinationPath(rawDestination)
  checkIntegrity(source, destination)
  map[source] = {
    destination
  }
  return map
}

function checkIntegrity(source: string, destination: string) {
  if (!source || !destination) {
    throw new Error(
      `Source or destination url not provided. source: ${source} | destination: ${destination}`
    )
  }

  if (!destination.startsWith('/a/') && destination !== '/') {
    exportWarns[source] = {
      destination
    }
    console.log(`Redirection with destination maybe not working: ${destination}`)
  }
}

function resolveRedirects(redirects: NextJsRedirectsMap): NextJsRedirectsMap {
  const resolvedRedirects: NextJsRedirectsMap = {...redirects}

  for (const key in resolvedRedirects) {
    const currentRoute = resolvedRedirects[key]

    while (resolvedRedirects[currentRoute.destination]) {
      const nextRoute = resolvedRedirects[currentRoute.destination]
      currentRoute.destination = nextRoute.destination
    }
  }

  return resolvedRedirects
}
