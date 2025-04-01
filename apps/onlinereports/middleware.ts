import {NextRequest, NextResponse} from 'next/server'
import {redirectMap} from './redirectMap'

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl
  console.log(`Checking ${pathname}`)

  const htmlFile = pathname.substring(1) // Remove leading slash
  if (redirectMap.has(htmlFile)) {
    const newPath = `/${redirectMap.get(htmlFile)}`
    return NextResponse.redirect(new URL(newPath, request.url), 301)
  }

  const externalHostname = 'https://onlinereports.ch'
  const externalUrl = `${externalHostname}${pathname}`
  try {
    const response = await fetch(externalUrl)

    if (response.status === 404) {
      return NextResponse.next()
    }

    const html = await response.text()
    const homepageTitle =
      '<title>ONLINEREPORTS | News, Stories, Reportagen aus Basel, Nordwestschweiz</title>'
    const isHomepage = html.includes(homepageTitle)

    if (!isHomepage) {
      return NextResponse.redirect(externalUrl, 302)
    }
  } catch (error) {
    console.warn(`Error checking ${externalUrl} :`, error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*html)']
}
