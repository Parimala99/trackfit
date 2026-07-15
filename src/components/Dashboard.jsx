import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function startOfWeek() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

function dayLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  // Use noon to avoid DST edge cases when constructing from a date-only string.
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export default function Dashboard({ session, refreshKey }) {
  const [workouts, setWorkouts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const monday = startOfWeek()
    supabase
      .from('workouts')
      .select('id, date, sets(weight, reps, set_order, exercise:exercises(name))')
      .eq('user_id', session.user.id)
      .gte('date', monday)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setWorkouts(data)
      })
  }, [session.user.id, refreshKey])

  if (error) return <p className="error">{error}</p>
  if (workouts === null) return <p className="empty">Loading your week…</p>

  if (workouts.length === 0) {
    return (
      <div className="empty">
        Nothing logged this week yet.
        <br />
        Head to <strong style={{ color: 'var(--accent)' }}>Log</strong> and add your first set.
      </div>
    )
  }

  const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0)

  return (
    <div>
      <p className="section-label">
        {workouts.length} session{workouts.length !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''}
      </p>
      {workouts.map((w) => (
        <div className="card" key={w.id}>
          <p className="section-label" style={{ margin: '0 0 4px' }}>{dayLabel(w.date)}</p>
          {[...w.sets]
            .sort((a, b) => a.set_order - b.set_order)
            .map((s, i) => (
              <div className="lift-row" key={i}>
                <span className="lift-name">{s.exercise?.name ?? 'Exercise'}</span>
                <span className="lift-figure num">
                  <span className="lift-weight">{s.weight}</span>
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
