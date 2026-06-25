import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Monday as the start of the training week.
function startOfWeek() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

export default function WeeklyView({ session, refreshKey }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const monday = startOfWeek()
    supabase
      .from('workouts')
      .select('id, date, sets(weight, reps, exercise:exercises(name))')
      .eq('user_id', session.user.id)
      .gte('date', monday)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        // Collapse to the heaviest set per exercise this week.
        const best = {}
        let topVolume = 0
        for (const w of data) {
          for (const s of w.sets) {
            const name = s.exercise?.name ?? 'Exercise'
            const cur = best[name]
            if (!cur || s.weight > cur.weight) {
              best[name] = { weight: s.weight, reps: s.reps }
            }
            topVolume = Math.max(topVolume, s.weight)
          }
        }
        const list = Object.entries(best)
          .map(([name, v]) => ({ name, ...v, isTop: v.weight === topVolume }))
          .sort((a, b) => b.weight - a.weight)
        setRows(list)
      })
  }, [session.user.id, refreshKey])

  if (error) return <p className="error">{error}</p>
  if (rows === null) return <p className="empty">Loading your week…</p>

  if (rows.length === 0) {
    return (
      <div className="empty">
        Nothing logged this week yet.
        <br />
        Head to <strong style={{ color: 'var(--accent)' }}>Log</strong> and add your first set.
      </div>
    )
  }

  return (
    <div>
      <p className="section-label">This week · top set per lift</p>
      <div className="card">
        {rows.map((r) => (
          <div className="lift-row" key={r.name}>
            <span className="lift-name">{r.name}</span>
            <span className="lift-figure num">
              <span className="lift-weight">{r.weight}</span>
              <span className="lift-unit">kg</span>
              <span className="lift-reps">× {r.reps}</span>
              {r.isTop && <span className="pb-flag">  ★ top</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
