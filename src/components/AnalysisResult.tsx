'use client'

import { useState } from 'react'
import type { Patient, AnalysisResult as AnalysisResultType, Advice } from '@/lib/types'

interface Props {
  patient: Patient
  result: AnalysisResultType
  onBackToDetail: () => void
  onBackToList: () => void
}

export default function AnalysisResult({ patient, result, onBackToDetail, onBackToList }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = buildCopyText(patient, result)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

        {/* Section 1: 施術前チェック項目 */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-warm-brown-800 mb-4">
            <span className="w-7 h-7 rounded-full bg-terracotta-500 text-white text-sm flex items-center justify-center font-bold">1</span>
            施術前チェック項目
          </h2>
          <div className="space-y-4">
            {result.checkItems.map((category, ci) => (
              <div key={ci} className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
                <div className="bg-terracotta-50 border-b border-terracotta-100 px-5 py-3">
                  <h3 className="font-semibold text-terracotta-700 text-sm">{category.category}</h3>
                </div>
                <div className="divide-y divide-warm-brown-50">
                  {category.items.map((item, ii) => (
                    <div key={ii} className="px-5 py-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-warm-brown-900 text-sm">{item.question}</p>
                          <p className="text-warm-brown-400 text-xs mt-0.5">{item.reason}</p>
                        </div>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.options.map((opt, oi) => (
                            <span
                              key={oi}
                              className="px-3 py-1.5 bg-warm-brown-50 border border-warm-brown-200 text-warm-brown-700 text-xs rounded-full hover:bg-terracotta-50 hover:border-terracotta-300 hover:text-terracotta-700 cursor-default transition-colors"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
