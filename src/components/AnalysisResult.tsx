'use client'

import { useState } from 'react'
import type { Patient, AnalysisResult as AnalysisResultType, Advice, AnswerState, ManualNotes } from '@/lib/types'

interface Props {
  patient: Patient
  result: AnalysisResultType
  onBackToDetail: () => void
  onBackToList: () => void
}

const EMPTY_NOTES: ManualNotes = {
  rangeOfMotion: '',
  painLocation: '',
  posture: '',
  other: '',
}

export default function AnalysisResult({ patient, result, onBackToDetail, onBackToList }: Props) {
  const [copied, setCopied] = useState(false)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [notes, setNotes] = useState<ManualNotes>(EMPTY_NOTES)
  const [karte, setKarte] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [karteError, setKarteError] = useState<string | null>(null)
  const [karteCopied, setKarteCopied] = useState(false)

  const toggleOption = (key: string, opt: string) => {
    setAnswers(prev => {
      const current = prev[key] ?? { selectedOptions: [], freeText: '' }
      const exists = current.selectedOptions.includes(opt)
      const selectedOptions = exists
        ? current.selectedOptions.filter(o => o !== opt)
        : [...current.selectedOptions, opt]
      return { ...prev, [key]: { ...current, selectedOptions } }
    })
  }

  const updateFreeText = (key: string, text: string) => {
    setAnswers(prev => {
      const current = prev[key] ?? { selectedOptions: [], freeText: '' }
      return { ...prev, [key]: { ...current, freeText: text } }
    })
  }

  const handleCopy = async () => {
    const text = buildCopyText(patient, result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateKarte = async () => {
    setGenerating(true)
    setKarteError(null)
    try {
      const age = calcAge(patient.q9_birthday)
      const res = await fetch('/api/karte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient, age, result, answers, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'カルテ生成に失敗しました')
      setKarte(data.karte)
      setTimeout(() => {
        document.getElementById('karte-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e) {
      setKarteError(e instanceof Error ? e.message : 'カルテ生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyKarte = async () => {
    if (!karte) return
    // Google Sheets で 1 セルに収まるように HTML(table) + plain text の両方をクリップボードに書き込む
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<table><tbody><tr><td style="white-space:pre-wrap;text-align:center;vertical-align:middle">${karte
      .split('\n')
      .map(escapeHtml)
      .join('<br>')}</td></tr></tbody></table>`
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([karte], { type: 'text/plain' }),
        }),
      ])
    } catch {
      // 古いブラウザ向けフォールバック
      await navigator.clipboard.writeText(karte)
    }
    setKarteCopied(true)
    setTimeout(() => setKarteCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-warm-brown-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <button onClick={onBackToList} className="text-warm-brown-200 hover:text-white transition-colors">
              患者一覧
            </button>
            <span className="text-warm-brown-400">/</span>
            <button onClick={onBackToDetail} className="text-warm-brown-200 hover:text-white transition-colors">
              {patient.q2_name || '患者詳細'}
            </button>
            <span className="text-warm-brown-400">/</span>
            <span className="font-semibold">AI分析結果</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-warm-brown-500 hover:bg-warm-brown-400 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                コピーしました
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                結果をコピー
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Patient summary bar */}
        <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 px-6 py-4 flex flex-wrap gap-4 items-center">
          <div>
            <p className="text-xs text-warm-brown-400">患者名</p>
            <p className="font-bold text-warm-brown-900">{patient.q2_name || '（未入力）'}</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-warm-brown-100" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-warm-brown-400">主訴</p>
            <p className="text-warm-brown-700 text-sm line-clamp-2">{patient.q1_complaint}</p>
          </div>
        </div>

        {/* Section 1: 施術前チェック項目（記録可能） */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-2">
            <span className="w-7 h-7 rounded-full bg-terracotta-500 text-white text-sm flex items-center justify-center font-bold">1</span>
            施術前チェック項目
          </h2>
          <p className="text-warm-brown-500 text-xs mb-4 ml-9">選択肢をタップで複数選択できます。自由記入欄も併用可能です。</p>
          <div className="space-y-4">
            {result.checkItems.map((category, ci) => (
              <div key={ci} className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
                <div className="bg-terracotta-50 border-b border-terracotta-100 px-5 py-3">
                  <h3 className="font-semibold text-terracotta-700 text-sm">{category.category}</h3>
                </div>
                <div className="divide-y divide-warm-brown-50">
                  {category.items.map((item, ii) => {
                    const key = `${ci}-${ii}`
                    const ans = answers[key] ?? { selectedOptions: [], freeText: '' }
                    return (
                      <div key={ii} className="px-5 py-4">
                        <div className="mb-3">
                          <p className="font-medium text-warm-brown-900 text-sm">{item.question}</p>
                          <p className="text-warm-brown-400 text-xs mt-0.5">{item.reason}</p>
                        </div>
                        {item.options && item.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.options.map((opt, oi) => {
                              const selected = ans.selectedOptions.includes(opt)
                              return (
                                <button
                                  key={oi}
                                  type="button"
                                  onClick={() => toggleOption(key, opt)}
                                  className={`px-3 py-1.5 border text-xs rounded-full transition-colors ${
                                    selected
                                      ? 'bg-terracotta-500 border-terracotta-500 text-white'
                                      : 'bg-warm-brown-50 border-warm-brown-200 text-warm-brown-700 hover:bg-terracotta-50 hover:border-terracotta-300'
                                  }`}
                                >
                                  {selected && '✓ '}{opt}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        <textarea
                          value={ans.freeText}
                          onChange={e => updateFreeText(key, e.target.value)}
                          placeholder="自由記入（追加メモがあれば）"
                          rows={1}
                          className="w-full text-sm border border-warm-brown-200 rounded-lg px-3 py-2 bg-warm-brown-50/30 text-warm-brown-900 placeholder-warm-brown-300 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-transparent transition resize-y"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: 施術アドバイス */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-4">
            <span className="w-7 h-7 rounded-full bg-warm-brown-500 text-white text-sm flex items-center justify-center font-bold">2</span>
            施術アドバイス
          </h2>
          <div className="space-y-3">
            {result.advice.map((adv, i) => (
              <AdviceCard key={i} advice={adv} />
            ))}
          </div>
        </section>

        {/* Section 3: 来院フォローメモ */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-4">
            <span className="w-7 h-7 rounded-full bg-sage-500 text-white text-sm flex items-center justify-center font-bold">3</span>
            来院フォローメモ
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
            <FollowUpItem icon="📍" label="来院のしやすさ" value={result.followUp.accessibility} />
            <FollowUpItem icon="📆" label="推奨通院ペース" value={result.followUp.visitPlan} />
            <FollowUpItem icon="🏠" label="セルフケアの方向性" value={result.followUp.homecare} last />
          </div>
        </section>

        {/* Section 4: 施術者所見入力 */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-4">
            <span className="w-7 h-7 rounded-full bg-warm-brown-700 text-white text-sm flex items-center justify-center font-bold">4</span>
            施術者所見・検査結果
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 p-5 space-y-4">
            <NoteField
              label="可動域"
              placeholder="例: 前屈 60° / 後屈 制限あり / 側屈 R<L"
              value={notes.rangeOfMotion}
              onChange={v => setNotes(n => ({ ...n, rangeOfMotion: v }))}
            />
            <NoteField
              label="疼痛部位"
              placeholder="例: L4-L5 椎間関節周辺、右仙腸関節部に圧痛"
              value={notes.painLocation}
              onChange={v => setNotes(n => ({ ...n, painLocation: v }))}
            />
            <NoteField
              label="姿勢など特徴"
              placeholder="例: 骨盤後傾、胸椎後弯増強、頭部前方位"
              value={notes.posture}
              onChange={v => setNotes(n => ({ ...n, posture: v }))}
            />
            <NoteField
              label="その他"
              placeholder="例: ストレス高め、デスクワーク中心、出張前で時間制約あり"
              value={notes.other}
              onChange={v => setNotes(n => ({ ...n, other: v }))}
            />
          </div>
        </section>

        {/* Section 5: カルテ生成 */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-4">
            <span className="w-7 h-7 rounded-full bg-terracotta-600 text-white text-sm flex items-center justify-center font-bold">5</span>
            カルテ生成
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 p-5">
            <p className="text-warm-brown-600 text-sm mb-4">
              上で記録した回答と所見をもとに、AIがカルテを生成します。
            </p>
            <button
              onClick={handleGenerateKarte}
              disabled={generating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  AIでカルテを生成
                </>
              )}
            </button>
            {karteError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                ⚠ {karteError}
              </div>
            )}
            {karte && (
              <div id="karte-result" className="mt-6 border-t border-warm-brown-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-warm-brown-800 text-sm">生成されたカルテ</h3>
                  <button
                    onClick={handleCopyKarte}
                    className="flex items-center gap-1.5 bg-warm-brown-500 hover:bg-warm-brown-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {karteCopied ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        コピーしました
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        コピー
                      </>
                    )}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-warm-brown-900 leading-relaxed bg-warm-brown-50/50 border border-warm-brown-100 rounded-lg p-4 font-sans">
{karte}
                </pre>
                <p className="text-xs text-warm-brown-400 mt-3">
                  ※ コピーしてスプレッドシートのカルテ欄に貼り付けてください。
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-warm-brown-50 border border-warm-brown-200 rounded-lg px-5 py-4 text-xs text-warm-brown-500 leading-relaxed">
          ※ AIの出力は施術方針の参考情報であり、医療診断ではありません。施術の最終判断は必ず施術者が行ってください。
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            onClick={onBackToDetail}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-warm-brown-300 text-warm-brown-600 hover:bg-warm-brown-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            患者詳細に戻る
          </button>
          <button
            onClick={onBackToList}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-warm-brown-300 text-warm-brown-600 hover:bg-warm-brown-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            患者一覧に戻る
          </button>
        </div>
      </main>
    </div>
  )
}

function NoteField({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-warm-brown-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full text-sm border border-warm-brown-200 rounded-lg px-3 py-2 bg-white text-warm-brown-900 placeholder-warm-brown-300 focus:outline-none focus:ring-2 focus:ring-warm-brown-400 focus:border-transparent transition resize-y"
      />
    </div>
  )
}

function AdviceCard({ advice }: { advice: Advice }) {
  const config = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-500 text-white',
      title: 'text-red-800',
      label: '重要',
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-500 text-white',
      title: 'text-amber-800',
      label: '注意',
    },
    low: {
      bg: 'bg-sage-50',
      border: 'border-sage-200',
      badge: 'bg-sage-500 text-white',
      title: 'text-sage-500',
      label: '参考',
    },
  }[advice.priority] ?? {
    bg: 'bg-warm-brown-50',
    border: 'border-warm-brown-200',
    badge: 'bg-warm-brown-400 text-white',
    title: 'text-warm-brown-800',
    label: '情報',
  }

  return (
    <div className={`rounded-xl border ${config.bg} ${config.border} px-5 py-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${config.badge}`}>
          {config.label}
        </span>
        <div>
          <p className={`font-semibold text-sm mb-1 ${config.title}`}>{advice.title}</p>
          <p className="text-warm-brown-700 text-sm leading-relaxed">{advice.body}</p>
        </div>
      </div>
    </div>
  )
}

function FollowUpItem({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <div className={`px-5 py-4 ${!last ? 'border-b border-warm-brown-50' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{icon}</span>
        <div>
          <p className="text-xs text-warm-brown-400 font-medium mb-1">{label}</p>
          <p className="text-warm-brown-800 text-sm leading-relaxed">{value}</p>
        </div>
      </div>
    </div>
  )
}

function calcAge(birthday: string): string {
  if (!birthday) return '不明'
  const normalized = birthday
    .replace(/年/g, '/').replace(/月/g, '/').replace(/日/g, '').trim()
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return '不明'
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return `${age}歳`
}

function buildCopyText(patient: Patient, result: AnalysisResultType): string {
  const lines: string[] = [
    `■ 問診チェックリスト分析結果`,
    `患者: ${patient.q2_name}  主訴: ${patient.q1_complaint}`,
    '',
    '【1. 施術前チェック項目】',
  ]

  for (const cat of result.checkItems) {
    lines.push(`▼ ${cat.category}`)
    for (const item of cat.items) {
      lines.push(`  ・${item.question}`)
      lines.push(`    選択肢: ${item.options.join(' / ')}`)
    }
  }

  lines.push('', '【2. 施術アドバイス】')
  for (const adv of result.advice) {
    const pLabel = adv.priority === 'high' ? '[重要]' : adv.priority === 'medium' ? '[注意]' : '[参考]'
    lines.push(`${pLabel} ${adv.title}`)
    lines.push(`  ${adv.body}`)
  }

  lines.push('', '【3. 来院フォローメモ】')
  lines.push(`来院のしやすさ: ${result.followUp.accessibility}`)
  lines.push(`推奨通院ペース: ${result.followUp.visitPlan}`)
  lines.push(`セルフケア: ${result.followUp.homecare}`)
  lines.push('', '※ AIの出力は施術方針の参考情報であり、医療診断ではありません。')

  return lines.join('\n')
}
