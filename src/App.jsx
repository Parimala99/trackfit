import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import LogWorkout from './components/LogWorkout'
import Dashboard from './components/Dashboard'
import Feed from './components/Feed'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [tab, setTab] = useState('week')
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  function handleSaved() {
    setRefreshKey((k) => k + 1)
    setTab('week')
    setToast('Workout saved')
    setTimeout(() => setToast(null), 1800)
  }

  if (session === undefined) {
    return <div className="empty" style={{ paddingTop: 120 }}>Loading…</div>
  }
  if (!session) return <div className="app"><Auth /></div>

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">
          Gym<span className="bar">/</span>Tracker
        </span>
        <button className="signout" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>

      <main className="content">
        {tab === 'week' && <Dashboard session={session} refreshKey={refreshKey} />}
        {tab === 'log' && <LogWorkout session={session} onSaved={handleSaved} />}
        {tab === 'feed' && <Feed refreshKey={refreshKey} />}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <nav className="tabbar">
        <button aria-current={tab === 'week'} onClick={() => setTab('week')}>
          <span className="dot">▤</span> This week
        </button>
        <button aria-current={tab === 'log'} onClick={() => setTab('log')}>
          <span className="dot">＋</span> Log
        </button>
        <button aria-current={tab === 'feed'} onClick={() => setTab('feed')}>
          <span className="dot">◎</span> Friends
        </button>
      </nav>
    </div>
  )
}
