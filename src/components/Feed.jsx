import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return 'today'
  const diff = Math.round((Date.now() - d.getTime()) / 86400000)
  if (diff === 1) return 'yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString()
}

export default function Feed({ refreshKey }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('workouts')
      .select('id, date, author:profiles(username), sets(weight, reps, exercise:exercises(name))')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows(data)
      })
  }, [refreshKey])

  if (error) return <p className="error">{error}</p>
  if (rows === null) return <p className="empty">Loading the feed…</p>
  if (rows.length === 0)
    return <div className="empty">No sessions yet. Be the first to log one.</div>

  return (
    <div>
      <p className="section-label">Recent sessions</p>
      {rows.map((w) => (
        <div className="card" key={w.id}>
          <div className="feed-author">
            <span className="who">{w.author?.username ?? 'Someone'}</span>
            <span className="when">{timeAgo(w.date)}</span>
          </div>
          {w.sets.map((s, i) => (
            <div className="lift-row" key={i}>
              <span className="lift-name">{s.exercise?.name ?? 'Exercise'}</span>
              <span className="lift-figure num">
                <span className="lift-weight" style={{ fontSize: 22 }}>{s.weight}</span>
                <span className="lift-unit">kg</span>
                <span className="lift-reps">× {s.reps}</span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
