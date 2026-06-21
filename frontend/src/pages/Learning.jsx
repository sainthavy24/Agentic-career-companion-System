import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { apiPost } from '../lib/api.js'
import { getCache, setCache } from '../lib/store.js'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'

export default function Learning() {
  const user = useUser()
  const loc = useLocation()
  const c0 = getCache('learning') || {}
  const [skill, setSkill] = useState(c0.skill || '')
  const [steps, setSteps] = useState(c0.steps || null)
  const [done, setDone] = useState(c0.done || {})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [learned, setLearned] = useState(c0.learned || false)
  useEffect(() => { setCache('learning', { skill, steps, done, learned }) }, [skill, steps, done, learned])

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

  function resourceUrl(s) {
    // 1) use the real link Gemini returned, if valid
    if (s.url && /^https?:\/\//i.test(s.url)) return s.url
    const title = encodeURIComponent(s.title || '')
    const sk = encodeURIComponent(skill || '')
    const q = encodeURIComponent(`${s.title} ${skill} tutorial`)
    const p = (s.provider || '').toLowerCase()
    // 2) provider-aware fallback
    if (p.includes('freecodecamp')) return `https://www.freecodecamp.org/news/search/?query=${title}`
    if (p.includes('mdn') || p.includes('mozilla')) return `https://developer.mozilla.org/en-US/search?q=${sk}`
    if (p.includes('roadmap')) return `https://roadmap.sh/${sk}`
    if (p.includes('coursera')) return `https://www.coursera.org/search?query=${sk}`
    if (p.includes('khan')) return `https://www.khanacademy.org/search?page_search_query=${sk}`
    if (p.includes('udemy')) return `https://www.udemy.com/courses/search/?q=${sk}`
    if (p.includes('github')) return `https://github.com/search?q=${sk}&type=repositories`
    if (p.includes('youtube')) return `https://www.youtube.com/results?search_query=${q}`
    // 3) type-aware fallback (so it's not always YouTube)
    if (s.type === 'docs') return `https://devdocs.io/#q=${sk}`
    if (s.type === 'course') return `https://www.freecodecamp.org/news/search/?query=${title}`
    if (s.type === 'project') return `https://github.com/search?q=${sk}&type=repositories`
    return `https://www.youtube.com/results?search_query=${q}`
  }

  const pct = total ? Math.round((completed / total) * 100) : 0
  const TYPE = { course: '#4f46e5', video: '#db2777', docs: '#ea580c', project: '#059669' }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Learning Path</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>✦ Gemini builds an ordered free study path. Mark it learned to update your profile.</p>
        </div>
        <span className="modelbadge"><span className="livedotc" /> AI status: active</span>
      </div>

      <div className="panel">
        <label className="muted small" style={{ fontWeight: 600 }}>Enter a skill</label>
        <div className="learninput">
          <div className="li-field">
            <input value={skill} onChange={e => setSkill(e.target.value)} placeholder="e.g. TypeScript, Engineering, Data Analysis" />
            {skill && <button className="li-clear" onClick={() => setSkill('')} title="clear">×</button>}
          </div>
          <button className="btn grad" disabled={busy} onClick={() => plan()}>{busy ? 'Building…' : '🚀 Build path'}</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>

      {steps && (
        <>
          <div className="progresshead">
            <span className="muted small">Progress: <b>{completed} / {total}</b> steps</span>
            <span className="muted small">{pct}% Complete</span>
          </div>
          <div className="bar big"><span style={{ width: pct + '%' }} /></div>

          <div className="lpsteps">
            {steps.map((s, i) => (
              <div className={`lpcard ${done[i] ? 'done' : ''}`} key={i}>
                <label className="lpcheck">
                  <input type="checkbox" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} />
                </label>
                <div className="lpbody">
                  <div className="lptop">
                    <b>{i + 1}. {s.title}</b>
                    {s.type && <span className="typebadge" style={{ color: TYPE[s.type] || '#64748b', background: (TYPE[s.type] || '#64748b') + '18' }}>{s.type}</span>}
                  </div>
                  {s.note && <p className="muted small" style={{ margin: '4px 0 0' }}>{s.note}</p>}
                </div>
                <a className="btn ghost small lpfind" href={resourceUrl(s)} target="_blank" rel="noreferrer">Find resources →</a>
              </div>
            ))}
          </div>

          <button className="btn lpmark" disabled={learned} onClick={markLearned}>
            {learned ? '✓ Added to profile' : `✓ Mark "${skill}" as learned`}
          </button>
        </>
      )}
    </div>
  )
}
