import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function handle(mode) {
    setMsg('')
    if (!supabase) {
      setMsg('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env, then restart "npm run dev".')
      return
    }
    if (!email || !pw) { setMsg('Enter an email and password first.'); return }
    setBusy(true)
    try {
      if (mode === 'up') {
        const { error } = await supabase.auth.signUp({ email, password: pw })
        setMsg(error ? error.message : 'Account created. Check your email to confirm, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) { setMsg(error.message) } else { nav('/') }
      }
    } catch (e) {
      setMsg(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="authcard">
        <div className="brand center"><span className="logo">P</span><b>PathCompanion AI</b></div>
        <h2>Sign in</h2>
        <form onSubmit={e => e.preventDefault()}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          <button type="button" className="btn" disabled={busy} onClick={() => handle('in')}>
            {busy ? 'Please wait...' : 'Sign in'}
          </button>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => handle('up')}>
            Create account
          </button>
        </form>
        {msg && <p className="msg">{msg}</p>}
        <Link to="/" className="muted small">&larr; Back to app</Link>
      </div>
    </div>
  )
}
