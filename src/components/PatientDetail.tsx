'use client'

import type { Patient } from '@/lib/types'

interface Props {
  patient: Patient
  onBack: () => void
  onAnalyze: () => void
  analyzing: boolean
}

export default function PatientDetail({ patient, onBack, onAnalyze, analyzing }: Props) {
  const age = calcAge(patient.q9_birthday)

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-warm-brown-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-warm-brown-200 hover:text-white text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              患者一覧
            </button>
            <span className="text-warm-brown-400">/</span>
            <span className="font-semibold">患者詳細</span>
          </div>
          <span className="text-warm-brown-200 text-sm">行 {patient.rowNumber}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {/* 患者名 + 分析ボタン */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-warm-brown-100 px-6 py-5">
          <div>
            <p className="text-warm-brown-400 text-xs mb-1">患者名</p>
            <h2 className="text-2xl font-bold text-warm-brown-900">{patient.q2_name || '（未入力）'}</h2>
            <p className="text-warm-brown-500 text-sm mt-0.5">{patient.q3_kana}</p>
          </div>
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI分析中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AIで分析する
              </>
            )}
          </button>
        </div>

        {/* Section 1: 症状・主訴 */}
        <section>
          <SectionTitle color="terracotta" icon="🩺" label="症状・主訴" />
          <div className="bg-white rounded-xl shadow-sm border border-terracotta-200 overflow-hidden">
            <div className="bg-terracotta-50 border-b border-terracotta-100 px-6 py-4">
              <p className="text-xs text-terracotta-500 font-semibold mb-1">Q1. 主訴（お困りのこと）</p>
              <p className="text-warm-brown-900 leading-relaxed whitespace-pre-wrap text-sm">
                {patient.q1_complaint || <span className="text-warm-brown-300">記載なし</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-brown-50">
              <Field label="Q11. 気になる症状" value={patient.q11_symptoms} />
              <Field label="Q12. 期待している効果" value={patient.q12_expectations} />
              <Field label="Q13. 症状が出た時期" value={patient.q13_duration} />
              <Field label="Q14. その他のお悩み" value={patient.q14_other_concerns} />
            </div>
            <div className="border-t border-warm-brown-50">
              <Field label="Q22. 病歴" value={patient.q22_medical_history} />
            </div>
          </div>
        </section>

        {/* Section 2: 基本情報 */}
        <section>
          <SectionTitle color="brown" icon="👤" label="基本情報" />
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-brown-50">
              <Field label="受付日時" value={patient.timestamp} />
              <Field label="Q8. 性別" value={patient.q8_gender} />
              <Field label="Q9. 生年月日" value={patient.q9_birthday} extra={age ? `（${age}）` : undefined} />
              <Field label="Q10. 来院きっかけ" value={patient.q10_source} />
              <Field label="Q4. 郵便番号" value={patient.q4_postal} />
              <Field label="Q5. 住所" value={patient.q5_address} />
              <Field label="Q6. 電話番号" value={maskPhone(patient.q6_phone)} />
              <Field label="Q7. メールアドレス" value={maskEmail(patient.q7_email)} />
            </div>
          </div>
        </section>

        {/* Section 3: 生活習慣 */}
        <section>
          <SectionTitle color="sage" icon="🌿" label="生活習慣" />
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-brown-50">
              <Field label="Q15. 職業" value={patient.q15_occupation} />
              <Field label="Q16. 運動" value={patient.q16_exercise} />
              <Field label="Q17. 趣味・休日" value={patient.q17_hobbies} />
              <Field label="Q18. 喫煙" value={patient.q18_smoking} />
              <Field label="Q19. 飲酒" value={patient.q19_drinking} />
            </div>
          </div>
        </section>

        {/* Section 4: 来院について */}
        <section>
          <SectionTitle color="brown" icon="📅" label="来院について" />
          <div className="bg-white rounded-xl shadow-sm border border-warm-brown-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-warm-brown-50">
              <Field label="Q20. 来院しやすい曜日" value={patient.q20_visit_days} />
              <Field label="Q21. 来院しやすい時間帯" value={patient.q21_visit_times} />
            </div>
            <div className="border-t border-warm-brown-50">
              <Field label="Q23. ご要望・ご質問" value={patient.q23_requests} />
            </div>
          </div>
        </section>

        {/* 下部の分析ボタン */}
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-semibold px-8 py-4 rounded-xl shadow-md transition-colors text-base"
          >
            {analyzing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI分析中...（しばらくお待ちください）
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AIで分析する
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({ color, icon, label }: { color: string; icon: string; label: string }) {
  const cls =
    color === 'terracotta'
      ? 'text-terracotta-600 border-terracotta-300'
      : color === 'sage'
      ? 'text-sage-500 border-sage-200'
      : 'text-warm-brown-600 border-warm-brown-300'
  return (
    <h3 className={`flex items-center gap-2 font-semibold text-base mb-2 border-l-4 pl-3 ${cls}`}>
      <span>{icon}</span>{label}
    </h3>
  )
}

function Field({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="px-5 py-3">
      <p className="text-xs text-warm-brown-400 font-medium mb-0.5">{label}</p>
      <p className="text-warm-brown-800 text-sm leading-relaxed whitespace-pre-wrap">
        {value || <span className="text-warm-brown-300">記載なし</span>}
        {extra && <span className="text-warm-brown-500 ml-1">{extra}</span>}
      </p>
    </div>
  )
}

function maskPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  }
  return phone.slice(0, 3) + '****'
}

function maskEmail(email: string): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email.slice(0, 2) + '****'
  return `${local.slice(0, 2)}****@${domain}`
}

function calcAge(birthday: string): string {
  if (!birthday) return ''
  const normalized = birthday
    .replace(/年/g, '/').replace(/月/g, '/').replace(/日/g, '').trim()
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return `${age}歳`
}
