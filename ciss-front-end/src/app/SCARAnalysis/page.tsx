'use client'

import React, { useState } from 'react'
import pyApi from '@/lib/pyApiClient'

export default function AnalysisPage() {
  const [folder, setFolder] = useState('')
  const [status, setStatus] = useState('')
  const [dstFiles, setDstFiles] = useState<string[]>([])

  const callApi = async <T,>(endpoint: string, body?: Record<string, unknown>): Promise<T> => {
    /* blocked original fetch 250807
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }

    return res.json()*/
    const res = await pyApi.post(endpoint, body)
    return res.data as T
  }

  const handleSelectFolder = async () => {
    try {
        console.log(folder)
      const result = await callApi<{ folder: string; fileCount: number }>(
        '/select_folder',
        { folder }
      )
      setStatus(`📂 폴더 선택 완료: ${result.folder}, 파일 ${result.fileCount}개`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus(`❌ 폴더 선택 실패: ${message}`)
    }
  }

  const handleAnalyze = async () => {
    try {
      const result = await callApi<{ analyzedCount: number; dstFiles?: string[] }>(
        '/analyze'
      )
      setStatus(`🔍 분석 완료: ${result.analyzedCount}개`)
      setDstFiles(result.dstFiles || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus(`❌ 분석 실패: ${message}`)
    }
  }

  const handleCategorize = async () => {
    try {
      await callApi<unknown>('/categorize')
      setStatus(`🗂️ 분류 완료`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus(`❌ 분류 실패: ${message}`)
    }
  }

  const handleSummarize = async () => {
    try {
      await callApi<unknown>('/summarize')
      setStatus(`📊 요약 완료`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus(`❌ 요약 실패: ${message}`)
    }
  }

  return (
    <main className="p-10 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">SCAR 분석 제어 페이지</h1>

      <div className="flex space-x-2">
        <input
          type="text"
          className="border px-2 py-1 flex-1"
          placeholder="폴더 경로를 입력하세요"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        />
        <button onClick={handleSelectFolder} className="bg-blue-600 text-white px-4 py-1 rounded">
          폴더 선택
        </button>
      </div>

      <div className="flex space-x-3">
        <button onClick={handleAnalyze} className="bg-green-600 text-white px-4 py-1 rounded">
          분석
        </button>
        <button onClick={handleCategorize} className="bg-yellow-600 text-white px-4 py-1 rounded">
          분류
        </button>
        <button onClick={handleSummarize} className="bg-purple-600 text-white px-4 py-1 rounded">
          요약
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded shadow">
        <strong>📌 상태:</strong> {status}
      </div>

      {dstFiles.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">📁 분석 결과 파일</h2>
          <ul className="list-disc list-inside">
            {dstFiles.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
