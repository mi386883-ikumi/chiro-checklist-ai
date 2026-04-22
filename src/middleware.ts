import { NextRequest, NextResponse } from 'next/server'

function getValidTokens(): string[] {
  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const multi = process.env.AUTH_USERS
  if (multi) {
    return multi.split(',').map(entry => {
      const [user] = entry.trim().split(':')
      return btoa(`${user}:${secret}`)
    })
  }
  const user = process.env.BASIC_AUTH_USER ?? 'admin'
  return [btoa(`${user}:${secret}`)]
}

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/_next', '/favicon.ico']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  if (token && getValidTokens().includes(token)) return NextResponse.next()

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
