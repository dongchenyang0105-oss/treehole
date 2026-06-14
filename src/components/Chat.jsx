import React, { useState, useEffect, useRef } from 'react'
import { saveMessage, getRecentMessages } from '../utils/db'
import { sendMessage, getModes } from '../utils/ai'

export default function Chat({ onNavigate, showToast }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('listen')
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  async function loadMessages() {
    try {
      const msgs = await getRecentMessages(50)
      setMessages(msgs)
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoad(false)
    }
  }

  function scrollToBottom() {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }

  function handleInputChange(e) {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    setInput(el.value)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const apiKey = localStorage.getItem('treehole_api_key')
    if (!apiKey) {
      showToast('请先在设置中填写 API Key')
      onNavigate('settings')
      return
    }

    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const userMsg = await saveMessage('user', text, mode)
      setMessages(prev => [...prev, userMsg])

      setLoading(true)

      const contextMessages = [...messages.slice(-20), userMsg].map(m => ({
        role: m.role,
        content: m.content
      }))

      const reply = await sendMessage(contextMessages, mode)
      const aiMsg = await saveMessage('assistant', reply, mode)
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      showToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + time
  }

  function shouldShowTime(index) {
    if (index === 0) return true
    const prev = messages[index - 1]
    const curr = messages[index]
    const prevTime = new Date(prev.created_at).getTime()
    const currTime = new Date(curr.created_at).getTime()
    return currTime - prevTime > 30 * 60 * 1000
  }

  const modes = getModes()

  if (initialLoad) {
    return (
      <div className="app" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)'
      }}>
        加载中...
      </div>
    )
  }

  return (
    <>
      <div className="header">
        <span className="header-title">树洞</span>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => onNavigate('report')} title="复盘报告">
            📊
          </button>
          <button className="icon-btn" onClick={() => onNavigate('settings')} title="设置">
            ⚙️
          </button>
        </div>
      </div>

      <div className="mode-bar">
        {modes.map(m => (
          <button
            key={m.key}
            className={'mode-chip' + (mode === m.key ? ' active' : '')}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="messages" ref={messagesRef}>
        {messages.length === 0 && !loading ? (
          <div className="messages-empty">
            <div className="messages-empty-icon">🕳️</div>
            <div>这里是你的树洞</div>
            <div>想说什么就说什么</div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <React.Fragment key={msg.id}>
                {shouldShowTime(i) && (
                  <div className="bubble-time">{formatTime(msg.created_at)}</div>
                )}
                <div className={'bubble ' + msg.role}>
                  {msg.content}
                </div>
              </React.Fragment>
            ))}
            {loading && (
              <div className="bubble assistant loading">在想...</div>
            )}
          </>
        )}
      </div>

      <div className="input-area">
        <textarea
          ref={inputRef}
          className="input-field"
          placeholder="说点什么..."
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          ↑
        </button>
      </div>
    </>
  )
}
