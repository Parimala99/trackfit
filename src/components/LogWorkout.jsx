import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LogWorkout({ session, onSaved }) {
  const [exercises, setExercises] = useState([])
  const [exerciseId, setExerciseId] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [draft, setDraft] = useState([]) // sets queued for this session
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customGroup, setCustomGroup] = useState('')
  const [customSaving, setCustomSaving] = useState(false)
  const [customError, setCustomError] = useState(null)

  function fetchExercises() {
    return supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .order('is_default', { ascending: false })
      .order('name')
  }

  useEffect(() => {
    fetchExercises().then(({ data, error }) => {
      if (error) setError(error.message)
      else {
        setExercises(data)
        if (data.length) setExerciseId(String(data[0].id))
      }
    })
  }, [])

  async function addCustomExercise(e) {
    e.preventDefault()
    if (!customName.trim()) return
    setCustomSaving(true)
    setCustomError(null)
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: customName.trim(),
        muscle_group: customGroup.trim() || null,
        is_default: false,
        created_by: session.user.id
      })
      .select()
      .single()
    if (error) {
      setCustomError(error.message)
      setCustomSaving(false)
      return
    }
    const { data: all } = await fetchExercises()
    if (all) {
      setExercises(all)
      setExerciseId(String(data.id))
    }
    setCustomName('')
    setCustomGroup('')
    setCustomSaving(false)
    setShowCustomForm(false)
  }

  function addSet(e) {
    e.preventDefault()
    if (!exerciseId || weight === '' || reps === '') return
    const ex = exercises.find((x) => String(x.id) === String(exerciseId))
    setDraft((d) => [
      ...d,
      {
        exercise_id: Number(exerciseId),
        name: ex?.name ?? 'Exercise',
        weight: Number(weight),
        reps: Number(reps)
      }
    ])
    setWeight('')
    setReps('')
  }

  function removeSet(i) {
    setDraft((d) => d.filter((_, idx) => idx !== i))
  }

  async function saveWorkout() {
    if (!draft.length) return
    setSaving(true)
    setError(null)

    // 1) create the session row
    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({ user_id: session.user.id, date })
      .select()
      .single()

    if (wErr) {
      setError(wErr.message)
      setSaving(false)
      return
    }

    // 2) attach every set to it
    const rows = draft.map((s, i) => ({
      workout_id: workout.id,
      exercise_id: s.exercise_id,
      weight: s.weight,
      reps: s.reps,
      set_order: i + 1
    }))
    const { error: sErr } = await supabase.from('sets').insert(rows)

    setSaving(false)
    if (sErr) {
      setError(sErr.message)
      return
    }
    setDraft([])
    onSaved?.()
  }

  return (
    <div>
      <p className="section-label">New session</p>

      <div className="card">
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <form onSubmit={addSet}>
          <div className="field">
            <label htmlFor="exercise">Exercise</label>
            <select id="exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                  {ex.muscle_group ? ` · ${ex.muscle_group}` : ''}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 4, textAlign: 'right' }}>
              <button
                type="button"
                className="signout"
                style={{ fontSize: 12, padding: '4px 0' }}
                onClick={() => setShowCustomForm((v) => !v)}
              >
                {showCustomForm ? 'Cancel' : '+ Add your own'}
              </button>
            </div>
          </div>
          <div className="field row2">
            <div>
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight" type="number" inputMode="decimal" step="0.5" min="0"
                value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="60"
              />
            </div>
            <div>
              <label htmlFor="reps">Reps</label>
              <input
                id="reps" type="number" inputMode="numeric" step="1" min="1"
                value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8"
              />
            </div>
          </div>
          <div className="field">
            <button type="submit" className="ghost" style={{ width: '100%' }}>
              + Add set
            </button>
          </div>
        </form>

        {showCustomForm && (
          <form onSubmit={addCustomExercise} style={{ marginTop: 12 }}>
            <div className="field">
              <label htmlFor="custom-name">Exercise name</label>
              <input
                id="custom-name"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Cable Fly"
              />
            </div>
            <div className="field">
              <label htmlFor="custom-group">Muscle group (optional)</label>
              <input
                id="custom-group"
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="e.g. Chest"
              />
            </div>
            <div className="field">
              <button type="submit" className="ghost" disabled={customSaving} style={{ width: '100%' }}>
                {customSaving ? 'Adding…' : 'Add exercise'}
              </button>
            </div>
            {customError && <p className="error">{customError}</p>}
          </form>
        )}

        {draft.map((s, i) => (
          <div className="set-chip num" key={i}>
            <span style={{ fontWeight: 600 }}>{s.name}</span>
            <span style={{ color: 'var(--muted)' }}>
              {s.weight} kg × {s.reps}
            </span>
            <button className="x" onClick={() => removeSet(i)} aria-label="Remove set">
              ×
            </button>
          </div>
        ))}
      </div>

      {draft.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="primary" onClick={saveWorkout} disabled={saving}>
            {saving ? 'Saving…' : `Save workout · ${draft.length} set${draft.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
