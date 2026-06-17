import { useState } from 'react'
import { apiPost } from '../lib/api.js'

export default function Resume() {
  const [text, setText] = useState('')
  const [cat, setCat] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function classify() {
    if (!text.trim()) { setMsg('Paste some resume text first.'); return }
    setBusy(true); setMsg(''); setCat(null)
    try {
      const d = await apiPost('/api/v1/resume/classify', { text })
      if (d.category) setCat(d.category)
      else setMsg(d.detail || 'Failed.')
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  return (
    <div>
      <div className="topbar"><h1>Resume Architect</h1><span className="badge" style={{ background: '#059669' }}>Model 1</span></div>
      <div className="panel">
        <p className="muted">Paste your resume text — the <b>trained classifier (Model 1)</b> predicts its job category.</p>
        <textarea className="ta" value={text} onChange={e => setText(e.target.value)} placeholder="Paste resume text here..." />
        <button className="btn" disabled={busy} onClick={classify}>{busy ? 'Analyzing...' : 'Classify resume'}</button>
        {cat && <div className="status ok" style={{ marginTop: 12 }}>Predicted category: <b>{cat}</b></div>}
        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  )
}
