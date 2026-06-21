import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api.js'
import { getCache, setCache } from '../lib/store.js'
import { useUser } from '../lib/useUser.js'

const FOCUS = {
  'Information Technology': 'Software, web & cloud systems',
  'Engineering': 'Software lifecycle & systems',
  'Design': 'UI / UX & product design',
  'Art/Creative': 'Creative & visual production',
  'Quality Assurance': 'Testing & quality processes',
  'Analyst': 'Data analysis & reporting',
  'Research': 'Investigation & evaluation',
  'Project Management': 'Agile planning & delivery',
  'Management': 'Leadership & operations',
  'Marketing': 'Campaigns, SEO & content',
  'Sales': 'Selling & pipeline',
  'Business Development': 'Partnerships & growth',
  'Finance': 'Financial analysis',
  'Accounting/Auditing': 'Accounts, audit & tax',
  'Human Resources': 'Hiring & people ops',
  'Customer Service': 'Support & success',
  'Consulting': 'Advisory & strategy',
  'Legal': 'Compliance & contracts',
  'Education': 'Teaching & curriculum',
  'Training': 'Coaching & enablement',
  'Administrative': 'Coordination & admin',
  'Manufacturing': 'Production & supply chain',
  'Health Care Provider': 'Clinical & patient care',
  'General Business': 'Business operations',
}
const fd = c => FOCUS[c] || 'Core skills for this domain'

export default function SkillGap() {
  const user = useUser()
  const loc = useLocation()
  const nav = useNavigate()
  const c0 = getCache('skillgap') || {}
  const [text, setText] = useState(c0.text || '')
  const [from, setFrom] = useState(c0.from || '')
  const [res, setRes] = useState(c0.res || null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [dismiss, setDismiss] = useState(c0.dismiss || false)
  useEffect(() => { setCache('skillgap', { text, from, res, dismiss }) }, [text, from, res, dismiss])

  async function analyze(t, ttl) {
    const jd = (t ?? text)
    const title = ttl ?? from
    if (!jd.trim() && !title) { setMsg('Paste a job description first.'); return }
    setBusy(true); setMsg(''); setRes(null); setDismiss(false)
    try {
      const d = await apiPost('/api/v1/skill-gap/analyze', { text: jd, title: title || undefined, user_id: user?.id })
      if (d.required !== undefined) setRes(d)
      else setMsg(d.detail || 'Failed.')
    } catch { setMsg('Request failed (is the backend running?).') }
    finally { setBusy(false) }
  }

  useEffect(() => {
    const jd = loc.state?.jd
    if (jd || loc.state?.title) { setText(jd || ''); setFrom(loc.state.title || ''); analyze(jd || '', loc.state.title || '') }
    // eslint-disable-next-line
  }, [])

  const required = res?.required || []
  const present = res?.present || []
  const missing = res?.missing || []
  const total = required.length
  const readiness = total ? Math.round((present.length / total) * 100) : 0
  const empty = res && total === 0

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Bridge the Gap</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>AI-powered analysis to identify and prioritise your career growth areas.</p>
        </div>
        <span className="modelbadge"><span className="livedotc" /> Model 2 · Active</span>
      </div>

      <div className="sgtop">
        <div className="panel accent-indigo">
          <div className="stagehead" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Job Description</h3>
            {from && <span className="chip ok" style={{ margin: 0 }}>Loaded: {from}</span>}
          </div>
          <textarea className="ta" value={text} onChange={e => setText(e.target.value)} placeholder="Paste a job description here, or open one from Job Scout..." />
          {res && !empty && <div style={{ margin: '4px 0 10px' }}>{required.map(s => <span key={s} className="chip neu">{s}</span>)}</div>}
          <button className="btn" disabled={busy} onClick={() => analyze()}>{busy ? 'Analyzing…' : 'Analyze gap'}</button>
          {msg && <p className="msg">{msg}</p>}
          {empty && <p className="muted small" style={{ marginTop: 10 }}>Model 2 didn't detect clear focus areas. Try a more detailed description.</p>}
        </div>

        <div className="panel readycard accent-indigo">
          <h3 style={{ marginTop: 0 }}>Market Readiness</h3>
          {res && !empty ? (
            <>
              <div className="ring" style={{ background: `conic-gradient(var(--primary) ${readiness * 3.6}deg, #ede9fe 0deg)` }}>
                <span>{readiness}%</span>
              </div>
              <p className="muted small" style={{ textAlign: 'center', margin: '12px 0 0' }}>
                {missing.length
                  ? <>Your profile is missing <b>{missing.length}</b> of <b>{total}</b> core domains for this role.</>
                  : <>You cover all <b>{total}</b> core domains for this role. 🎉</>}
              </p>
            </>
          ) : <p className="muted small">Run an analysis to see how ready your profile is for the role.</p>}
        </div>
      </div>

      {res && !empty && (
        <>
          <div className="sgcols">
            <div className="panel accent-green">
              <div className="stagehead"><h3 style={{ margin: 0, color: '#059669' }}>You cover ({present.length})</h3><span className="okdot">✓</span></div>
              {present.length ? present.map(s => (
                <div className="coverrow" key={s}>
                  <div><b>{s}</b><span className="muted small">{fd(s)}</span></div>
                  <span className="chip ok" style={{ margin: 0 }}>Covered</span>
                </div>
              )) : <div className="emptybox">Your current skills don't cover these areas yet.</div>}
            </div>

            <div className="panel accent-purple">
              <div className="stagehead"><h3 style={{ margin: 0, color: 'var(--primary)' }}>Gaps ({missing.length})</h3></div>
              {missing.length ? missing.map(s => (
                <div className="gaprow" key={s}>
                  <div><b>{s}</b><span className="muted small">Focus: {fd(s)}</span></div>
                  <button className="btn ghost small" onClick={() => nav('/learning', { state: { skill: s } })}>Learn →</button>
                </div>
              )) : <div className="emptybox">No gaps — great fit! 🎉</div>}
            </div>
          </div>

          {!dismiss && (
            <div className="insight">
              <div className="insight-body">
                <div className="stagehead" style={{ marginBottom: 8 }}>
                  <b style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="sparkle">✦</span> AI Skill Scout Insight</b>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  {missing.length
                    ? <>You already cover <b>{present.length}</b> of <b>{total}</b> focus areas{present.length ? <> ({present.join(', ')})</> : ''}. Your biggest gap is <b>{missing[0]}</b> — closing it would raise your readiness for this role. Start with a free, structured learning path.</>
                    : <>Strong fit — your profile covers all <b>{total}</b> focus areas this role emphasises. Keep your skills sharp and apply with confidence.</>}
                </p>
                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {missing.length > 0 && <button className="btn" onClick={() => nav('/learning', { state: { skill: missing[0] } })}>View Learning Path</button>}
                  <button className="btn ghost" onClick={() => setDismiss(true)}>Dismiss</button>
                </div>
              </div>
            </div>
          )}

          {user && res.user_categories?.length > 0 && (
            <p className="muted small" style={{ marginTop: 12 }}>Your profile maps to: {res.user_categories.join(', ')}.</p>
          )}
        </>
      )}
    </div>
  )
}
