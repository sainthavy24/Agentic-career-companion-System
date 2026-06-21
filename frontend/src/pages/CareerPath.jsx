import { useState, useEffect } from 'react'
import { apiPost } from '../lib/api.js'
import { getCache, setCache } from '../lib/store.js'
import { useUser } from '../lib/useUser.js'

export default function CareerPath() {
  const user = useUser()
  const c0 = getCache('career') || {}
  const [goal, setGoal] = useState(c0.goal || '')
  const [stages, setStages] = useState(c0.stages || null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { setCache('career', { goal, stages }) }, [goal, stages])

  async function plan() {
    if (!goal.trim()) { setMsg('Enter a target role or career goal.'); return }
    setBusy(true); setMsg(''); setStages(null)
    try {
      const d = await apiPost('/api/v1/career/plan', { goal, user_id: user?.id })
      if (Array.isArray(d.stages)) setStages(d.stages)
      else setMsg(d.detail || 'Could not generate path.')
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  return (
    <div>
      <div className="topbar"><h1>Career Path Planner</h1><span className="badge" style={{ background: '#ea580c' }}>AI</span></div>
      <div className="panel">
        <p className="muted">Enter a target role — Gemini maps a step-by-step progression ladder using your skills.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input className="goalinput" value={goal} onChange={e => setGoal(e.target.value)}
                 placeholder="e.g. Senior Frontend Engineer" />
          <button className="btn" disabled={busy} onClick={plan}>{busy ? 'Planning...' : 'Plan my path'}</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>

      {stages && (
        <div className="ladder-v">
          {stages.map((s, i) => (
            <div className="stagecard" key={i}>
              <div className="stagehead">
                <b>{i + 1}. {s.stage}</b>
                {s.duration && <span className="chip neu">{s.duration}</span>}
              </div>
              <div style={{ margin: '6px 0' }}>
                {(s.skills || []).map(k => <span key={k} className="chip ok">{k}</span>)}
              </div>
              {s.tip && <p className="muted small">Tip: {s.tip}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
