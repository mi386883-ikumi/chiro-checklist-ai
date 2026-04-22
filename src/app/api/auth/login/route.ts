import { NextRequest, NextResponse } from 'next/server'

function getUsers(): { user: string; pass: string }[] {
  // AUTH_USERS format: "user1:pass1,user2:pass2"
  const multi = process.env.AUTH_USERS
  if (multi) {
    return multi.split(',').map(entry => {
      const [user, ...rest] = entry.trim().split(':')
      return { user, pass: rest.join(':') }
    })
  }
  return [{
    user: process.env.BASIC_AUTH_USER ?? 'admin',
    pass: process.env.BASIC_AUTH_PASS ?? 'changeme',
  }]
}

export async function POST(req: NextRequest) {
  const { user, pass } = await req.json()
  const users = getUsers()
  const matched = users.find(u => u.user === user && u.pass === pass)

  if (!matched) {
    return NextResponse.json({ error: '認証失敗' }, { status: 401 })
  }

  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const token = btoa(`${user}:${secret}`)
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
