import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function sendLink(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Magic link: no passwords to store or handle.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        // username is stored in user metadata and read by the
        // handle_new_user() trigger to seed the profiles row.
        data: { username: username.trim() || email.split('@')[0] }
      }
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h1>Gym<span style={{ color: 'var(--accent)' }}>/</span>Tracker</h1>
        <p>Log your lifts, watch the numbers climb, and keep your crew honest.</p>
      </div>

      {sent ? (
        <div className="card">
          <strong>Check your email.</strong>
          <p className="note">
            We sent a sign-in link to {email}. Open it on this device to get in.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink}>
          <div className="field">
            <label htmlFor="username">Display name</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="What your friends call you"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <button className="primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <p className="note">No password. We email you a one-tap link each time.</p>
        </form>
      )}
    </div>
  )
}
