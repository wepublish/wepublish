import {NextResponse, NextRequest} from 'next/server'
import redirectsJson from './redirects.json'

// Convert redirects JSON to a Map for O(1) lookups
const redirects = new Map(Object.entries(redirectsJson))

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const redirect = redirects.get(pathname)

  if (redirect) {
    const statusCode = redirect.permanent ? 301 : 307
    const destination = request.nextUrl.clone()
    destination.pathname = redirect.destination
    return NextResponse.redirect(destination, statusCode)
  }
  return NextResponse.next()
}