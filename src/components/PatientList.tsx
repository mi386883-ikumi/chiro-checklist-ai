'use client'

import { useState, useMemo } from 'react'
import type { Patient } from '@/lib/types'

interface Props {
  patients: Patient[]
  loading: boolean
  error: string | null
  onSelect: (patient: Patient) => void
  onRefresh: () => void
}

export default function PatientList({ patients, loading, error, onSelect, onRefresh }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return patients
    const lower = q.toLowerCase()
    return patients.filter(p =>
      p.q2_name.toLowerCase().includes(lower) ||
      p.q3_kana.toLowerCase().includes(lower) ||
      p.q1_complaint.includes(q)
    )
  }, [patients, query])

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-warm-brown-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">整体院 問診チェックリストAI</h1>
            <p className="text-warm-brown-200 text-sm mt-0.5">施術前確認サポートツール</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-warm-brown-500 hover:bg-warm-brown-400 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? '読み込み中...' : 'データ更新'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠ {error}
          </div>
        )}

        {loading && patients.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-warm-brown-300 border-t-warm-brown-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-warm-brown-500 text-sm">患者データを読み込み中...</p>
            </div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-24 text-warm-brown-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>患者データがありません</p>
          </div>
        ) : (
          <>
            {/* ヘッダー行：件数 + 検索ボックス */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-warm-brown-800 font-semibold text-lg shrink-0">
                患者一覧{' '}
                <span className="text-warm-brown-400 text-base font-normal">
                  （{query ? `${filtered.length} / ${patients.length}名` : `${patients.length}名`}）
                </span>
              </h2>

              {/* 検索ボックス */}
              <div className="relative flex-1 max-w-sm">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-brown-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="名前・カナ・主訴で検索"
                  className="w-full pl-9 pr-8 py-2 text-sm border border-warm-brown-200 rounded-lg bg-white text-warm-brown-900 placeholder-warm-brown-300 focus:outline-none focus:ring-2 focus:ring-warm-brown-400 focus:border-transparent transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-brown-300 hover:text-warm-brown-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 検索結果ゼロ */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-warm-brown-400 bg-white rounded-xl border border-warm-brown-100">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <p className="text-sm">「{query}」に一致する患者が見つかりませんでした</p>
                <button onClick={() => setQuery('')} className="mt-3 text-xs text-warm-brown-500 underline">
                  検索をクリア
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-14" />
                    <col className="w-32" />
                    <col />
                    <col className="w-32 hidden md:table-column" />
                  </colgroup>
                  <thead>
                    <tr className="bg-warm-brown-50 border-b border-warm-brown-100">
                      <th className="text-left text-warm-brown-600 font-semibold px-3 py-3 text-xs">行番号</th>
                      <th className="text-left text-warm-brown-600 font-semibold px-3 py-3 text-xs">お名前</th>
                      <th className="text-left text-warm-brown-600 font-semibold px-3 py-3 text-xs">主訴（お困りのこと）</th>
                      <th className="text-left text-warm-brown-600 font-semibold px-3 py-3 text-xs hidden md:table-cell">受付日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((patient, i) => (
                      <tr
                        key={patient.rowNumber}
                        onClick={() => onSelect(patient)}
                        className={`cursor-pointer border-b border-warm-brown-50 transition-colors hover:bg-terracotta-50 ${i % 2 === 0 ? 'bg-white' : 'bg-warm-brown-50/30'}`}
                      >
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-warm-brown-500 text-white text-xs font-bold rounded-full">
                            {patient.rowNumber}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium text-warm-brown-900 truncate">
                          <Highlight text={patient.q2_name || '（未入力）'} query={query} />
                        </td>
                        <td className="px-3 py-3 text-warm-brown-700 truncate">
                          {patient.q1_complaint || '記載なし'}
                        </td>
                        <td className="px-3 py-3 text-warm-brown-400 text-xs hidden md:table-cell whitespace-nowrap">
                          {formatTimestamp(patient.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-terracotta-200 text-terracotta-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts.slice(0, 10)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
