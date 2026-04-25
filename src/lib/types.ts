export interface Patient {
  rowNumber: number
  timestamp: string
  q1_complaint: string       // 主訴
  q2_name: string            // 氏名（漢字）
  q3_kana: string            // 氏名（カナ）
  q4_postal: string          // 郵便番号
  q5_address: string         // 住所
  q6_phone: string           // 電話番号
  q7_email: string           // メールアドレス
  q8_gender: string          // 性別
  q9_birthday: string        // 生年月日
  q10_source: string         // 来院きっかけ
  q11_symptoms: string       // 気になる症状
  q12_expectations: string   // 期待している効果
  q13_duration: string       // 症状の期間
  q14_other_concerns: string // その他の悩み
  q15_occupation: string     // 職業
  q16_exercise: string       // 運動
  q17_hobbies: string        // 趣味
  q18_smoking: string        // 喫煙
  q19_drinking: string       // 飲酒
  q20_visit_days: string     // 来院曜日
  q21_visit_times: string    // 来院時間帯
  q22_medical_history: string // 病歴
  q23_requests: string       // ご要望
}

export interface CheckItem {
  question: string
  reason: string
  options: string[]
}

export interface CheckCategory {
  category: string
  items: CheckItem[]
}

export interface Advice {
  title: string
  body: string
  priority: 'high' | 'medium' | 'low'
}

export interface FollowUp {
  accessibility: string
  visitPlan: string
  homecare: string
}

export interface AnalysisResult {
  checkItems: CheckCategory[]
  advice: Advice[]
  followUp: FollowUp
}

// 質問ごとの回答状態
export interface AnswerState {
  selectedOptions: string[]
  freeText: string
}

// 施術者による手動入力欄
export interface ManualNotes {
  rangeOfMotion: string  // 可動域
  painLocation: string   // 疼痛部位
  posture: string        // 姿勢など特徴
  other: string          // その他
}
