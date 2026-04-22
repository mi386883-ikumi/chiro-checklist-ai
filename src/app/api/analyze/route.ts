import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Patient, AnalysisResult } from '@/lib/types'

const SYSTEM_PROMPT = `あなたは整体院の施術準備をサポートするAIアシスタントです。
患者の問診票データを分析し、施術者が施術前に確認すべきポイントを提案してください。

出力形式（必ずこのJSON形式のみで返答。JSON以外のテキストは一切含めないでください）:
{
  "checkItems": [
    {
      "category": "カテゴリ名",
      "items": [
        {"question": "患者に聞くべき具体的な質問", "reason": "この質問をする理由", "options": ["選択肢1", "選択肢2", "選択肢3"]}
      ]
    }
  ],
  "advice": [
    {"title": "見出し", "body": "具体的な説明", "priority": "high/medium/low"}
  ],
  "followUp": {
    "accessibility": "来院のしやすさ",
    "visitPlan": "推奨通院ペース",
    "homecare": "セルフケアの方向性"
  }
}

ルール:
- checkItemsのcategoryは主訴に応じて動的に変える（3〜5カテゴリ）
- optionsは患者が答えやすい具体的な選択肢を2〜5個提示する
- 病歴・喫煙・飲酒・運動習慣も考慮しadviceのpriorityを判断
- adviceは3〜6項目を生成する
- 医療診断は行わない。「〜の可能性があるため確認をおすすめします」の表現を使う
- 院の所在地は東京都大田区`

function buildUserMessage(patient: Patient, age: string): string {
  return `以下の患者の問診票データを分析してください。

【主訴】
${patient.q1_complaint || '記載なし'}

【症状・身体の悩み】
- 気になる症状: ${patient.q11_symptoms || '記載なし'}
- 期待している効果: ${patient.q12_expectations || '記載なし'}
- 症状が出た時期: ${patient.q13_duration || '記載なし'}
- その他の悩み: ${patient.q14_other_concerns || '記載なし'}
- 病歴: ${patient.q22_medical_history || '記載なし'}

【基本情報】
- 性別: ${patient.q8_gender || '記載なし'}
- 年齢: ${age}
- 来院きっかけ: ${patient.q10_source || '記載なし'}

【生活習慣】
- 職業: ${patient.q15_occupation || '記載なし'}
- 運動: ${patient.q16_exercise || '記載なし'}
- 趣味・休日: ${patient.q17_hobbies || '記載なし'}
- 喫煙: ${patient.q18_smoking || '記載なし'}
- 飲酒: ${patient.q19_drinking || '記載なし'}

【来院について】
- 居住地（市区町村まで）: ${extractCityArea(patient.q5_address)}
- 来院しやすい曜日: ${patient.q20_visit_days || '記載なし'}
- 来院しやすい時間帯: ${patient.q21_visit_times || '記載なし'}
- ご要望・ご質問: ${patient.q23_requests || '記載なし'}`
}

function extractCityArea(address: string): string {
  if (!address) return '記載なし'
  const match = address.match(/^(.{2,6}[都道府県])(.{2,6}[市区町村])/)
  if (match) return `${match[1]}${match[2]}`
  return address.substring(0, 10) + (address.length > 10 ? '...' : '')
}

export async function POST(req: NextRequest) {
  try {
    const { patient, age } = (await req.json()) as { patient: Patient; age: string }

    if (!patient) {
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
      messages: [{ role: 'user', content: buildUserMessage(patient, age || '不明') }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AIから予期しないレスポンス形式が返されました' }, { status: 500 })
    }

    let result: AnalysisResult
    try {
      const jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim()
      result = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: 'AIのレスポンスをパースできませんでした', raw: content.text },
        { status: 500 }
      )
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('Analyze error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
