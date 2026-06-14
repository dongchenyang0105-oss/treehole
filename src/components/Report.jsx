import React, { useState, useEffect } from 'react'
import { getMessagesByDateRange, getUserMessageCount, getReports, saveReport, deleteReport, getUserMemory, saveUserMemory } from '../utils/db'
import { generateReport, generateMemorySummary } from '../utils/ai'

export default function Report({ onBack, showToast }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState('week')
  const [msgCount, setMsgCount] = useState(0)
  const [memory, setMemory] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [rpts, count, mem] = await Promise.all([
        getReports(),
        getUserMessageCount(),
        getUserMemory()
      ])
      setReports(rpts)
      setMsgCount(count)
      setMemory(mem)
    } catch (err) {
      console.error(err)
    }
  }

  function getRangeLabel() {
    return range === 'week' ? '最近 7 天' : range === 'month' ? '最近 30 天' : '全部'
  }

  function getRangeDays() {
    return range === 'week' ? 7 : range === 'month' ? 30 : 365 * 10
  }

  async function handleGenerate() {
    const apiKey = localStorage.getItem('treehole_api_key')
    if (!apiKey) {
      showToast('请先在设置中填写 API Key')
      return
    }

    setLoading(true)

    try {
      const days = getRangeDays()
      const start = Date.now() - days * 24 * 60 * 60 * 1000
      const msgs = await getMessagesByDateRange(start, Date.now())
      const userMsgs = msgs.filter(m => m.role === 'user')

      if (userMsgs.length < 3) {
        showToast('记录太少，至少需要 3 条才能生成报告')
        setLoading(false)
        return
      }

      // 生成复盘报告
      const content = await generateReport(userMsgs)
      const report = await saveReport(content, getRangeLabel(), userMsgs.length)
      setReports(prev => [report, ...prev])

      // 同时更新记忆摘要
      showToast('报告已生成，正在更新记忆...')
      const existingMemory = memory?.summary || ''
      const newMemory = await generateMemorySummary(userMsgs, existingMemory)
      const savedMemory = await saveUserMemory(newMemory)
      setMemory(savedMemory)

      showToast('报告和记忆都已更新')
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteReport(id)
      setReports(prev => prev.filter(r => r.id !== id))
      showToast('已删除')
    } catch (err) {
      showToast('删除失败')
    }
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      <div className="header">
        <button className="icon-btn" onClick={onBack}>←</button>
        <span className="header-title">复盘</span>
        <div style={{ width: 36 }}></div>
      </div>

      <div className="page">
        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">你的记录</div>
            <div className="stat-value">{msgCount} 条</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已生成报告</div>
            <div className="stat-value">{reports.length} 份</div>
          </div>
        </div>

        {memory?.summary && (
          <div className="report-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="report-meta">
              🧠 AI 对你的记忆画像 · 更新于 {formatDate(memory.updated_at)}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{memory.summary}</div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div className="field-label" style={{ marginBottom: 8 }}>选择时间范围</div>
          <div className="mode-bar" style={{ padding: 0, border: 'none' }}>
            {[
              { key: 'week', label: '7 天' },
              { key: 'month', label: '30 天' },
              { key: 'all', label: '全部' }
            ].map(r => (
              <button
                key={r.key}
                className={'mode-chip' + (range === r.key ? ' active' : '')}
                onClick={() => setRange(r.key)}
              >{r.label}</button>
            ))}
          </div>
        </div>

        <button
          className="report-generate-btn"
          onClick={handleGenerate}
          disabled={loading || msgCount < 3}
          style={{ marginBottom: 24 }}
        >
          {loading ? '生成中...' : '生成复盘报告'}
        </button>

        {msgCount < 3 && (
          <div className="report-empty">
            多记录一些想法后再来生成报告，至少需要 3 条记录。
          </div>
        )}

        {reports.map(r => (
          <div className="report-card" key={r.id}>
            <div className="report-meta">
              {formatDate(r.created_at)} · {r.range_label} · {r.message_count} 条记录
              <span
                style={{ float: 'right', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                onClick={() => handleDelete(r.id)}
              >🗑️</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.content}</div>
          </div>
        ))}
      </div>
    </>
  )
}
