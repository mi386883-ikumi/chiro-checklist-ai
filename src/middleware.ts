import { NextRequest, NextResponse } from 'next/server'

const SESSION_MAX_MS = 120 * 60 * 1000 // 120分（無操作時のタイムアウト）

function encodeB64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function decodeB64(str: string): string {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function getValidUsers(): string[] {
  const multi = process.env.AUTH_USERS
  if (multi) {
    return multi.split(',').map(entry => entry.trim().split(':')[0])
  }
  return [process.env.BASIC_AUTH_USER ?? 'admin']
}

export function issueToken(user: string): string {
  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  return encodeB64(`${user}\x00${secret}\x00${Date.now()}`)
}

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/_next', '/favicon.ico']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const validUsers = getValidUsers()

  if (token) {
    try {
      const decoded = decodeB64(token)
      const [user, tokenSecret, tsStr] = decoded.split('\x00')
      const ts = parseInt(tsStr, 10)
      if (
        user &&
        tokenSecret === secret &&
        validUsers.includes(user) &&
        !isNaN(ts) &&
        Date.now() - ts < SESSION_MAX_MS
      ) {
        // 操作ごとにタイムスタンプを更新（セッションクッキーなのでブラウザ終了で消える）
        const newToken = encodeB64(`${user}\x00${secret}\x00${Date.now()}`)
        const res = NextResponse.next()
        res.cookies.set('auth_token', newToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          // maxAge を指定しない = セッションクッキー（ブラウザ終了で自動削除）
        })
        return res
      }
    } catch {
      // 不正トークン → ログイン画面へ
    }
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
