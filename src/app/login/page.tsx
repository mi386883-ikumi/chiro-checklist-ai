'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('ユーザー名またはパスワードが正しくありません')
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-warm-brown-800">整体院 問診チェックリストAI</h1>
          <p className="text-warm-brown-500 text-sm mt-2">スタッフ専用システム</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-warm-brown-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-brown-700 mb-1.5">
              ユーザー名
            </label>
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 border border-warm-brown-200 rounded-lg text-warm-brown-900 focus:outline-none focus:ring-2 focus:ring-warm-brown-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-brown-700 mb-1.5">
              パスワード
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-warm-brown-200 rounded-lg text-warm-brown-900 focus:outline-none focus:ring-2 focus:ring-warm-brown-400 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warm-brown-600 hover:bg-warm-brown-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
