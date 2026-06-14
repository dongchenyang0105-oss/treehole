import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { clearAllData, exportData, getMessageCount } from '../utils/db'

export default function Settings({ onBack, showToast, session }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('claude-sonnet-4-6')
  const [msgCount, setMsgCount] = useState(0)

  useEffect(() => {
    setApiKey(localStorage.getItem('treehole_api_key') || '')
    setModel(localStorage.getItem('treehole_model') || 'claude-sonnet-4-6')
    getMessageCount().then(setMsgCount).catch(() => {})
  }, [])

  function handleSaveKey(val) {
    setApiKey(val)
    localStorage.setItem('treehole_api_key', val)
  }

  function handleSaveModel(val) {
    setModel(val)
    localStorage.setItem('treehole_model', val)
  }

  async function handleExport() {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `treehole-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('导出成功')
    } catch (e) {
      showToast('导出失败')
    }
  }

  async function handleClear() {
    if (!confirm('确定要清除所有记录吗？此操作不可撤销。')) return
    await clearAllData()
    setMsgCount(0)
    showToast('已清除所有数据')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div className="header">
        <button className="icon-btn" onClick={onBack}>←</button>
        <span className="header-title">设置</span>
        <div style={{ width: 36 }}></div>
      </div>

      <div className="page">
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
          padding: 14,
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--text-secondary)'
        }}>
          已登录：{session?.user?.email}
        </div>

        <div className="field">
          <div className="field-label">Anthropic API Key</div>
          <input
            className="field-input"
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => handleSaveKey(e.target.value)}
          />
          <div className="field-hint">
            API Key 仅保存在当前设备的浏览器中。
            在 console.anthropic.com 获取。
          </div>
        </div>

        <div className="field">
          <div className="field-label">模型</div>
          <select
            className="field-select"
            value={model}
            onChange={e => handleSaveModel(e.target.value)}
          >
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6（推荐）</option>
            <option value="claude-opus-4-6">Claude Opus 4.6（更深度）</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5（最快）</option>
          </select>
        </div>

        <div className="divider"></div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">对话记录</div>
            <div className="stat-value">{msgCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">数据存储</div>
            <div className="stat-value">云端</div>
          </div>
        </div>

        <div className="field">
          <button className="btn" onClick={handleExport}>
            📥 导出数据（JSON）
          </button>
        </div>

        <div className="field">
          <button className="btn btn-danger" onClick={handleClear}>
            🗑️ 清除所有数据
          </button>
        </div>

        <div className="divider"></div>

        <div className="field">
          <button className="btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, marginTop: 16 }}>
          树洞 v1.0 — 对话数据存储在你的 Supabase 云端，
          API Key 仅保存在当前设备。跨设备登录同一账号即可同步数据。
        </div>
      </div>
    </>
  )
}
