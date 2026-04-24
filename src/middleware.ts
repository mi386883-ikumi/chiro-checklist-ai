import { NextRequest, NextResponse } from 'next/server'

function encodeB64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function getValidTokens(): string[] {
  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const multi = process.env.AUTH_USERS
  if (multi) {
    return multi.split(',').map(entry => {
      const [user] = entry.trim().split(':')
      return encodeB64(`${user}:${secret}`)
    })
  }
  const user = process.env.BASIC_AUTH_USER ?? 'admin'
  return [encodeB64(`${user}:${secret}`)]
}

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/_next', '/favicon.ico']
const SESSION_MAX_AGE = 60 * 10 // 10分（操作のたびに延長）

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  if (token && getValidTokens().includes(token)) {
    // スライディングセッション：アクセスごとに有効期限をリセット
    const res = NextResponse.next()
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return res
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
