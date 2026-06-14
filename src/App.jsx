import React, { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'
import Auth from './components/Auth'
import Chat from './components/Chat'
import Settings from './components/Settings'
import Report from './components/Report'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('chat')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) {
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

  if (!session) {
    return (
      <>
        <Auth showToast={showToast} />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  return (
    <div className="app">
      {page === 'chat' && (
        <Chat onNavigate={setPage} showToast={showToast} />
      )}
      {page === 'settings' && (
        <Settings
          onBack={() => setPage('chat')}
          showToast={showToast}
          session={session}
        />
      )}
      {page === 'report' && (
        <Report onBack={() => setPage('chat')} showToast={showToast} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
