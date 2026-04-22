import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import Papa from 'papaparse'
import type { Patient } from '@/lib/types'

const SHEET_ID = '1J5hKWFNcg6O5_xSLlJTKHwDycyEEfldOtsTlD4MgAS4'
const GID = '603982431'
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

// Col 0:タイムスタンプ  1:Q1主訴  2:Q2氏名(漢字)  3:Q3氏名(カナ)
//      4:Q4郵便番号   5:Q5住所   6:Q6電話       7:Q7メール
//      8:Q8性別      9:Q9生年月日 10:Q10きっかけ  11:Q11症状
//      12:Q12期待効果 13:Q13期間 14:Q14その他悩み 15:Q15職業
//      16:Q16運動    17:Q17趣味  18:Q18喫煙     19:Q19飲酒
//      20:Q20曜日   21:Q21時間帯 22:Q22病歴     23:Q23要望

export async function GET() {
  try {
    const res = await fetch(CSV_URL, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ error: 'スプレッドシートの取得に失敗しました' }, { status: 500 })
    }
    const csvText = await res.text()

    const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true })
    const rows = parsed.data

    // Row 0 is the header row; data starts from row 1
    if (rows.length < 2) {
      return NextResponse.json({ patients: [] })
    }

    const patients: Patient[] = rows.slice(1).map((row, index) => ({
      rowNumber: index + 2,
      timestamp: row[0] ?? '',
      q1_complaint: row[1] ?? '',
      q2_name: row[2] ?? '',
      q3_kana: row[3] ?? '',
      q4_postal: row[4] ?? '',
      q5_address: row[5] ?? '',
      q6_phone: row[6] ?? '',
      q7_email: row[7] ?? '',
      q8_gender: row[8] ?? '',
      q9_birthday: row[9] ?? '',
      q10_source: row[10] ?? '',
      q11_symptoms: row[11] ?? '',
      q12_expectations: row[12] ?? '',
      q13_duration: row[13] ?? '',
      q14_other_concerns: row[14] ?? '',
      q15_occupation: row[15] ?? '',
      q16_exercise: row[16] ?? '',
      q17_hobbies: row[17] ?? '',
      q18_smoking: row[18] ?? '',
      q19_drinking: row[19] ?? '',
      q20_visit_days: row[20] ?? '',
      q21_visit_times: row[21] ?? '',
      q22_medical_history: row[22] ?? '',
      q23_requests: row[23] ?? '',
    }))

    return NextResponse.json({ patients })
  } catch (err) {
    console.error('Patients fetch error:', err)
    return NextResponse.json({ error: 'データ取得中にエラーが発生しました' }, { status: 500 })
  }
}
