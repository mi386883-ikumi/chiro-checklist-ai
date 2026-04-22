import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { user, pass } = await req.json()

  const validUser = process.env.BASIC_AUTH_USER ?? 'admin'
  const validPass = process.env.BASIC_AUTH_PASS ?? 'changeme'

  if (user !== validUser || pass !== validPass) {
    return NextResponse.json({ error: '認証失敗' }, { status: 401 })
  }

  const token = btoa(`${validUser}:${validPass}`)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
