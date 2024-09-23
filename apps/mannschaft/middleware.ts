import {NextResponse, NextRequest} from 'next/server'
import redirects from './redirects.json'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const redirect = redirects.find(redirect => redirect.source === pathname)

  if (redirect) {
    const statusCode = redirect.permanent ? 301 : 302
    const destination = request.nextUrl.clone()
    destination.pathname = redirect.destination
    return NextResponse.redirect(destination, statusCode)
  }

  // No redirect found, continue without redirecting
  return NextResponse.next()
}
