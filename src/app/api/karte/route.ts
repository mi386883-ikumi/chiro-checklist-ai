import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Patient, AnalysisResult, AnswerState, ManualNotes } from '@/lib/types'

const SYSTEM_PROMPT = `あなたは整体院のカルテ作成をサポートするAIアシスタントです。
施術者が記録した問診の回答と所見から、簡潔で読みやすいカルテを作成してください。

出力形式（必ずこの形式のテキストのみで返答。前後の説明や挨拶は一切含めないでください）:
【主訴】：（主訴を簡潔に。可能なら推定病態を括弧で添える 例: 腰痛（仙腸関節性腰痛））
【副主訴】：（あれば。なければ「なし」）
【セルフケア】：（推奨するストレッチや運動 例: 臀部、腸腰筋ストレッチ）
【目標】：（施術の目標。具体的に書ける場合のみ。情報不足なら空欄でOK）
【その他】：（特記事項、生活背景、施術者が把握しておくべき情報）

ルール:
- 各項目は1〜3行で簡潔に
- 過剰な医学用語は避け、現場で読み返しやすい言葉で
- 医療診断は行わない（「〜性腰痛」のような表現は推定として括弧書きでOK）
- 情報が無い項目は空欄、または「なし」と記載`

interface KarteRequest {
  patient: Patient
  age: string
  result: AnalysisResult
  answers: Record<string, AnswerState>
  notes: ManualNotes
}

function buildUserMessage(req: KarteRequest): string {
  const { patient, age, result, answers, notes } = req

  const lines: string[] = []
  lines.push('【患者基本情報】')
  lines.push(`- 主訴: ${patient.q1_complaint || '記載なし'}`)
  lines.push(`- 性別/年齢: ${patient.q8_gender || '不明'} / ${age}`)
  lines.push(`- 気になる症状: ${patient.q11_symptoms || '記載なし'}`)
  lines.push(`- 症状が出た時期: ${patient.q13_duration || '記載なし'}`)
  lines.push(`- その他の悩み: ${patient.q14_other_concerns || '記載なし'}`)
  lines.push(`- 病歴・既往歴: ${patient.q22_medical_history || '記載なし'}`)
  lines.push(`- 運動習慣: ${patient.q16_exercise || '記載なし'}`)
  lines.push(`- 趣味: ${patient.q17_hobbies || '記載なし'}`)
  lines.push(`- 喫煙: ${patient.q18_smoking || '記載なし'}`)
  lines.push(`- 飲酒: ${patient.q19_drinking || '記載なし'}`)

  lines.push('')
  lines.push('【問診で記録した回答】')
  result.checkItems.forEach((cat, ci) => {
    cat.items.forEach((item, ii) => {
      const key = `${ci}-${ii}`
      const ans = answers[key]
      if (!ans) return
      const hasAns = ans.selectedOptions.length > 0 || ans.freeText.trim()
      if (!hasAns) return
      lines.push(`■ ${item.question}`)
      if (ans.selectedOptions.length > 0) {
        lines.push(`  → 選択: ${ans.selectedOptions.join(' / ')}`)
      }
      if (ans.freeText.trim()) {
        lines.push(`  → メモ: ${ans.freeText.trim()}`)
      }
    })
  })

  lines.push('')
  lines.push('【施術者の所見・検査結果】')
  if (notes.rangeOfMotion.trim()) lines.push(`- 可動域: ${notes.rangeOfMotion.trim()}`)
  if (notes.painLocation.trim()) lines.push(`- 疼痛部位: ${notes.painLocation.trim()}`)
  if (notes.posture.trim()) lines.push(`- 姿勢など特徴: ${notes.posture.trim()}`)
  if (notes.other.trim()) lines.push(`- その他: ${notes.other.trim()}`)

  lines.push('')
  lines.push('上記の情報をもとに、指定された形式でカルテを生成してください。')
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as KarteRequest

    if (!body.patient) {
      return NextResponse.json({ error: '患者データが必要です' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserMessage(body) },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AIから予期しないレスポンス形式が返されました' }, { status: 500 })
    }

    return NextResponse.json({ karte: content.text.trim() })
  } catch (err) {
    console.error('Karte error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
