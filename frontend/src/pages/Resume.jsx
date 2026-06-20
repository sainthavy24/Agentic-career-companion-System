import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiPost, apiUpload } from '../lib/api.js'

const CAT_DESC = {
  'ENGINEERING': 'Strong technical profile detected for software & engineering roles.',
  'INFORMATION-TECHNOLOGY': 'Strong IT & systems profile detected.',
  'DESIGNER': 'Creative & product-design profile detected.',
  'DATA-SCIENCE': 'Analytical & data-science profile detected.',
  'HR': 'People & human-resources profile detected.',
  'FINANCE': 'Finance & analytical profile detected.',
  'SALES': 'Sales & business-development profile detected.',
  'BUSINESS-DEVELOPMENT': 'Growth & partnerships profile detected.',
  'ACCOUNTANT': 'Accounting & audit profile detected.',
}
const TIPS = [
  'Keep it to 1–2 pages and lead bullets with action verbs.',
  'Quantify impact with metrics (e.g. “cut load time 40%”).',
  'Include a clear Skills section with relevant keywords.',
  'Tailor keywords to the role you are targeting.',
]

export default function Resume() {
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const fileRef = useRef(null)

  function showError(d) { setMsg(typeof d === 'string' ? d : (d?.detail || 'Failed.')) }

  async function classifyText() {
    if (!text.trim()) { setMsg('Upload a resume file or paste text first.'); return }
    setBusy(true); setMsg(''); setRes(null)
    try {
      const d = await apiPost('/api/v1/resume/classify', { text })
      if (d.category) setRes(d); else showError(d)
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  async function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setFileName(f.name); setBusy(true); setMsg(''); setRes(null)
    try {
      const fd = new FormData(); fd.append('file', f)
      const d = await apiUpload('/api/v1/resume/classify-file', fd)
      if (d.category) { setRes(d); setText(d.preview || '') } else showError(d)
    } catch { setMsg('Upload failed (is the backend running?).') }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  function clearFile() { setFileName(''); setRes(null); setText('') }

  const top = res?.top || []
  const conf = top.length ? Math.round((top[0].prob || 0) * 100) : 0
  const cat = res ? res.category.replace(/-/g, ' ') : ''
  const desc = res ? (CAT_DESC[res.category] || 'Best-fit professional track detected by the trained Model 1 classifier.') : ''
  const strengths = res?.strengths || []

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Resume Architect</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Use the trained Model 1 engine to identify your professional profile and find matching roles.</p>
        </div>
        <span className="badge" style={{ background: '#059669' }}>Model 1</span>
      </div>

      <div className="resumegrid">
        <div className="leftcol">
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Analyze Resume</h3>
            <label className="dropzone">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" hidden onChange={onFile} />
              <span className="dzicon">⬆</span>
              <b>Drag and drop, or click to upload</b>
              <span className="muted small">PDF, DOCX, TXT or image · up to 10MB</span>
            </label>
            {fileName && <div className="filechip"><span>📄 {fileName}</span><button onClick={clearFile} title="remove">×</button></div>}
            <button className="btn grad full" disabled={busy} onClick={classifyText}>{busy ? 'Analyzing…' : 'Classify Resume'}</button>
            <button className="linkbtn" style={{ marginTop: 8 }} onClick={() => setShowPaste(s => !s)}>{showPaste ? 'Hide text box' : 'or paste text instead'}</button>
            {showPaste && <textarea className="ta" value={text} onChange={e => setText(e.target.value)} placeholder="Paste resume text here..." />}
            {msg && <p className="msg">{msg}</p>}
          </div>

          {res && (
            <Link to="/jobs" className="career-card">
              <div>
                <span className="cc-label">Career Opportunity</span>
                <b>Your resume reads as {cat}.</b>
                <span className="cc-sub">View matching roles</span>
              </div>
              <span className="cc-arrow">→</span>
            </Link>
          )}
        </div>

        <div className="panel resultcard">
          <div className="stagehead">
            <div><h3 style={{ margin: 0 }}>Analysis Results</h3><span className="muted small">Top predicted career track</span></div>
            {res && <span className="modelbadge"><span className="livedotc" /> AI processing complete</span>}
          </div>

          {res ? (
            <>
              <div className="confring" style={{ background: `conic-gradient(var(--primary) ${conf * 3.6}deg, #ede9fe 0deg)` }}>
                <div className="confinner"><b>{conf}%</b><small>CONFIDENCE</small></div>
              </div>
              <div className="bigcat center">{cat}</div>
              <p className="muted center" style={{ maxWidth: 340, margin: '4px auto 0' }}>{desc}</p>
              {top.length > 1 && (
                <>
                  <hr className="sep" style={{ margin: '18px 0 12px' }} />
                  <p className="muted small" style={{ margin: '0 0 8px' }}>Secondary match breakdown</p>
                  {top.slice(1).map(t => (
                    <div className="skrow" key={t.category}>
                      <div className="skhead"><span>{t.category.replace(/-/g, ' ')}</span><span className="muted small">{Math.round((t.prob || 0) * 100)}%</span></div>
                      <div className="bar"><span style={{ width: `${Math.round((t.prob || 0) * 100)}%` }} /></div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : <div className="emptybox" style={{ padding: 40 }}>Upload a resume and classify to see your predicted career track and confidence.</div>}
        </div>
      </div>

      {res && (
        <div className="resumecards3">
          <div className="icard purple">
            <b>Key Strengths</b>
            {strengths.length ? <ul>{strengths.slice(0, 6).map(s => <li key={s}>{s}</li>)}</ul>
              : <p className="muted small">No specific skills detected — add a Skills section to your resume.</p>}
          </div>
          <div className="icard teal">
            <b>Career Track Fit</b>
            <p style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>{cat}</p>
            <p className="muted small" style={{ margin: 0 }}>{conf}% Model 1 confidence · <Link to="/jobs">explore roles →</Link></p>
          </div>
          <div className="icard orange">
            <b>Resume Tips</b>
            <ul>{TIPS.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  )
}
