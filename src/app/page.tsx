'use client'

import { useState, useEffect, useCallback } from 'react'
import PatientList from '@/components/PatientList'
import PatientDetail from '@/components/PatientDetail'
import AnalysisResult from '@/components/AnalysisResult'
import type { Patient, AnalysisResult as AnalysisResultType } from '@/lib/types'

type Screen = 'list' | 'detail' | 'analysis'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('list')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'データ取得に失敗しました')
      setPatients(data.patients)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データ取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setAnalysisResult(null)
    setAnalyzeError(null)
    setScreen('detail')
  }

  const handleAnalyze = async () => {
    if (!selectedPatient) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const age = calcAge(selectedPatient.q9_birthday)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: selectedPatient, age }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI分析に失敗しました')
      setAnalysisResult(data.result)
      setScreen('analysis')
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'AI分析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  if (screen === 'analysis' && selectedPatient && analysisResult) {
    return (
      <AnalysisResult
        patient={selectedPatient}
        result={analysisResult}
        onBackToDetail={() => setScreen('detail')}
        onBackToList={() => setScreen('list')}
      />
    )
  }

  if (screen === 'detail' && selectedPatient) {
    return (
      <>
        {analyzeError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg max-w-sm text-center">
            ⚠ {analyzeError}
          </div>
        )}
        <PatientDetail
          patient={selectedPatient}
          onBack={() => setScreen('list')}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
        />
      </>
    )
  }

  return (
    <PatientList
      patients={patients}
      loading={loading}
      error={error}
      onSelect={handleSelectPatient}
      onRefresh={fetchPatients}
    />
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
