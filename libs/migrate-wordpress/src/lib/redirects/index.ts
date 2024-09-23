import * as fs from 'fs'

const BASE_URL = 'https://mannschaft.com'
const BASE_PATH = './libs/migrate-wordpress/src/lib/redirects'
const IMPORT_PATH = BASE_PATH + '/import-redirects.json'
const EXPORT_PATH = BASE_PATH + '/routes.json'

init()

async function init() {
  try {
    console.log('read file...')
    const originalRedirects = readFile()
    console.log('transform redirects...')
    const nextJsCompatibleRoutes = transformData(originalRedirects)
    console.log('write file...')
    saveFile(nextJsCompatibleRoutes)
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

function transformData(inputData: any[]): any[] {
  const nextJsCompatibleRoutes: any[] = []
  for (const redirect of inputData) {
    const oldUrl = getPathname(redirect?.url)
    const newUrl = getPathname(redirect?.action_data?.url)
    if (!oldUrl || !newUrl)
      throw new Error(`old or new url not provided in redirect with id ${redirect?.id}`)
    nextJsCompatibleRoutes.push({
      source: oldUrl,
      destination: newUrl,
      permanent: false
    })
  }
  return nextJsCompatibleRoutes
}

function getPathname(rawUrl: string): string {
  if (!rawUrl.startsWith(BASE_URL)) return rawUrl
  if (rawUrl === BASE_URL) return '/'
  return rawUrl.replace(BASE_URL, '')
}

function saveFile(data: any[]) {
  const jsonData = JSON.stringify(data, null, 2)
  fs.writeFileSync(EXPORT_PATH, jsonData, 'utf8')
}
