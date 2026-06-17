import { useState } from 'react'
import { apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function SkillGap() {
  const user = useUser()
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function analyze() {
    if (!text.trim()) { setMsg('Paste a job description first.'); return }
    setBusy(true); setMsg(''); setRes(null)
    try {
      const d = await apiPost('/api/v1/skill-gap/analyze', { text, user_id: user?.id })
      if (d.required) setRes(d)
      else setMsg(d.detail || 'Failed.')
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  return (
    <div>
      <div className="topbar"><h1>Skill Gap Analyzer</h1><span className="badge" style={{ background: '#7c3aed' }}>Model 2</span></div>
      <div className="panel">
        <p className="muted">Paste a job description — the <b>trained skill model (Model 2)</b> extracts required skills and compares with your profile.</p>
        <textarea className="ta" value={text} onChange={e => setText(e.target.value)} placeholder="Paste job description here..." />
        <button className="btn" disabled={busy} onClick={analyze}>{busy ? 'Analyzing...' : 'Analyze gap'}</button>
        {msg && <p className="msg">{msg}</p>}
      </div>
      {res && (
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div className="panel"><h3 style={{ color: '#059669' }}>You have</h3>
            {res.present.length ? res.present.map(s => <span key={s} className="chip ok">{s}</span>) : <span className="muted small">none matched</span>}
          </div>
          <div className="panel"><h3 style={{ color: '#dc2626' }}>Missing</h3>
            {res.missing.length ? res.missing.map(s => <span key={s} className="chip miss">{s}</span>) : <span className="muted small">none</span>}
          </div>
        </div>
      )}
    </div>
  )
}
