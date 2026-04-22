import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const user = process.env.BASIC_AUTH_USER ?? 'admin'
  const pass = process.env.BASIC_AUTH_PASS ?? 'changeme'
  const expected = 'Basic ' + btoa(`${user}:${pass}`)

  if (auth === expected) return NextResponse.next()

  return new NextResponse('認証が必要です', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="問診チェックリストAI"' },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
