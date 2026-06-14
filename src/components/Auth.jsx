import React, { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Auth({ showToast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        showToast('注册成功，请查看邮箱确认')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      showToast(err.message === 'Invalid login credentials'
        ? '邮箱或密码错误'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>🕳️</div>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>树洞</h1>
        <p style={{
          fontSize: 14,
          color: 'var(--text-tertiary)',
          marginBottom: 32,
          textAlign: 'center',
          lineHeight: 1.6
        }}>
          你的私人情绪空间
        </p>

        <div style={{ width: '100%', maxWidth: 320 }}>
          <div className="field">
            <input
              className="field-input"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <input
              className="field-input"
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            className="btn"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              marginBottom: 12
            }}
          >
            {loading ? '请稍候...' : isSignUp ? '注册' : '登录'}
          </button>

          <button
            className="btn"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ fontSize: 14 }}
          >
            {isSignUp ? '已有账号？登录' : '没有账号？注册'}
          </button>
        </div>
      </div>
    </div>
  )
}
