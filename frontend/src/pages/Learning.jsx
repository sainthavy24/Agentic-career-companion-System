import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { apiPost } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'

export default function Learning() {
  const user = useUser()
  const loc = useLocation()
  const [skill, setSkill] = useState('')
  const [steps, setSteps] = useState(null)
  const [done, setDone] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [learned, setLearned] = useState(false)

  async function plan(sk) {
    const target = (sk ?? skill).trim()
    if (!target) { setMsg('Enter a skill to learn.'); return }
    setBusy(true); setMsg(''); setSteps(null); setDone({}); setLearned(false)
    try {
      const d = await apiPost('/api/v1/learning/plan', { skill: target })
      if (Array.isArray(d.steps)) setSteps(d.steps)
      else setMsg(d.detail || 'Could not generate path.')
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  useEffect(() => {
    const s = loc.state?.skill
    if (s) { setSkill(s); plan(s) }
    // eslint-disable-next-line
  }, [])

  async function markLearned() {
    if (!user) { setMsg('Sign in to save this skill to your profile.'); return }
    if (!supabase) return
    const { error } = await supabase.from('skills')
      .upsert({ user_id: user.id, name: skill.trim(), proficiency: 60, source: 'learning' },
              { onConflict: 'user_id,name' })
    setMsg(error ? error.message : `"${skill}" added to your profile — your job matches & skill gaps will update.`)
    if (!error) setLearned(true)
  }

  const total = steps ? steps.length : 0
  const completed = Object.values(done).filter(Boolean).length

  return (
    <div>
      <div className="topbar"><h1>Learning Path</h1><span className="badge" style={{ background: '#0891b2' }}>AI</span></div>
      <div className="panel">
        <p className="muted">Enter a skill — Gemini builds an ordered free study path. Mark it learned to update your profile.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input className="goalinput" value={skill} onChange={e => setSkill(e.target.value)} placeholder="e.g. TypeScript" />
          <button className="btn" disabled={busy} onClick={() => plan()}>{busy ? 'Building...' : 'Build path'}</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>

      {steps && (
        <>
          <div className="status ok" style={{ margin: '14px 0' }}>Progress: {completed} / {total} steps</div>
          <div className="ladder-v">
            {steps.map((s, i) => (
              <div className="stagecard" key={i} style={{ opacity: done[i] ? 0.6 : 1 }}>
                <div className="stagehead">
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} />
                    <b>{i + 1}. {s.title}</b>
                  </label>
                  <span className="chip neu">{s.type}</span>
                </div>
                {s.note && <p className="muted small" style={{ margin: '4px 0 0 26px' }}>{s.note}
                  {' '}<a href={`https://www.google.com/search?q=${encodeURIComponent(s.title + ' ' + skill + ' free')}`} target="_blank" rel="noreferrer">find →</a>
                </p>}
              </div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 14, background: '#059669' }} disabled={learned} onClick={markLearned}>
            {learned ? 'Added to profile ✓' : `Mark "${skill}" as learned`}
          </button>
        </>
      )}
    </div>
  )
}
