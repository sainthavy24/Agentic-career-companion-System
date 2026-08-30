import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'
import { getCache, setCache } from '../lib/store.js'

const TEMPLATES = [
  { id: 'classic', name: 'Classic ATS', desc: 'Clean serif, recruiter-safe' },
  { id: 'modern', name: 'Modern', desc: 'Color accents, bold headings' },
  { id: 'compact', name: 'Compact', desc: 'Tight fit, more content' },
]

export default function ResumeBuilder() {
  const user = useUser()
  const [mode, setMode] = useState('jd') // 'jd' | 'job'
  const [jd, setJd] = useState('')
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [extraSkills, setExtraSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [notes, setNotes] = useState('')
  const [template, setTemplate] = useState('classic')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resume, setResume] = useState(getCache('resume_builder') || null)
  const [saved, setSaved] = useState([])
  const [showSaved, setShowSaved] = useState(false)

  // Load job postings for "select from Job Scout" mode
  useEffect(() => {
    apiGet('/api/v1/jobs?limit=50')
      .then(d => setJobs(Array.isArray(d) ? d : d?.jobs || []))
      .catch(() => setJobs([]))
  }, [])

  const loadSaved = async () => {
    if (!user) return
    try {
      const d = await apiPost('/api/v1/resume/saved', { user_id: user.id })
      setSaved(d?.resumes || [])
      setShowSaved(true)
    } catch {
      setSaved([])
      setShowSaved(true)
    }
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !extraSkills.includes(s)) setExtraSkills(prev => [...prev, s])
    setSkillInput('')
  }

  const buildResume = async () => {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      const body = {
        user_id: user.id,
        job_description: mode === 'jd' ? jd.trim() || null : null,
        job_id: mode === 'job' ? jobId || null : null,
        extra_skills: extraSkills,
        extra_notes: notes.trim() || null,
      }
      const d = await apiPost('/api/v1/resume/build', body)
      if (d?.resume) {
        setResume(d.resume)
        setCache('resume_builder', d.resume)
      } else {
        setError('AI could not generate the resume. Please try again.')
      }
    } catch (e) {
      setError('Failed to build resume. Check that the backend is running and try again.')
    } finally {
      setBusy(false)
    }
  }

  const downloadPdf = () => window.print()

  if (user === undefined) return null
  if (!user) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Resume Builder</h2>
        <p className="muted">Please sign in to build tailored resumes from your profile.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="topbar no-print">
        <div>
          <h1>Resume Builder</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            ✦ Generates a tailored resume from your profile, skills and the job you're targeting.
          </p>
        </div>
        <span className="modelbadge"><span className="livedotc" /> Gemini powered</span>
      </div>

      <div className="resumegrid no-print">
        {/* ============ Left: form ============ */}
        <div className="panel">
          <b style={{ fontSize: '14px' }}>1. Target job</b>
          <div style={{ display: 'flex', gap: '8px', margin: '10px 0' }}>
            <button className={`btn small ${mode === 'jd' ? '' : 'ghost'}`} onClick={() => setMode('jd')}>
              Paste description
            </button>
            <button className={`btn small ${mode === 'job' ? '' : 'ghost'}`} onClick={() => setMode('job')}>
              Pick from Job Scout
            </button>
          </div>

          {mode === 'jd' ? (
            <textarea
              className="input"
              rows={7}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Paste the job description here — or just type a role name like 'Data Analyst at fintech startup'. Leave empty for a general (master) resume."
              value={jd}
              onChange={e => setJd(e.target.value)}
            />
          ) : (
            <select className="input" style={{ width: '100%' }} value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">— Select a job posting —</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.company ? `— ${j.company}` : ''}
                </option>
              ))}
            </select>
          )}

          <div style={{ marginTop: '18px' }}>
            <b style={{ fontSize: '14px' }}>2. Extra skills for this resume</b>
            <p className="muted small" style={{ margin: '4px 0 8px' }}>
              Your profile skills are included automatically. Add anything extra relevant to this job.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="e.g. Docker"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
              />
              <button className="btn small" onClick={addSkill}>+ Add</button>
            </div>
            {extraSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {extraSkills.map(s => (
                  <span key={s} className="chip neu" style={{ cursor: 'pointer' }}
                    title="Click to remove"
                    onClick={() => setExtraSkills(prev => prev.filter(x => x !== s))}>
                    {s} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '18px' }}>
            <b style={{ fontSize: '14px' }}>3. Extra notes (optional)</b>
            <textarea
              className="input"
              rows={3}
              style={{ width: '100%', marginTop: '8px', resize: 'vertical' }}
              placeholder="e.g. Emphasize my leadership experience, mention my final-year project..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '18px' }}>
            <b style={{ fontSize: '14px' }}>4. Template</b>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`btn small ${template === t.id ? '' : 'ghost'}`}
                  title={t.desc}
                  onClick={() => setTemplate(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
            <button className="btn grad" onClick={buildResume} disabled={busy}>
              {busy ? '✦ Building resume…' : '✦ Build Resume'}
            </button>
            <button className="btn ghost" onClick={loadSaved}>My saved resumes</button>
          </div>
          {error && <p style={{ color: 'var(--bad)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* ============ Right: preview ============ */}
        <div>
          {resume ? (
            <div>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
                <button className="btn" onClick={downloadPdf}>⬇ Download PDF</button>
              </div>
              <ResumeSheet resume={resume} template={template} />
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
              <b>No resume yet</b>
              <p className="muted small" style={{ marginTop: '6px' }}>
                Fill the form and click <b>Build Resume</b> — your tailored resume preview will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Saved resumes modal */}
      {showSaved && (
        <div className="modal-overlay no-print" onClick={() => setShowSaved(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <b>My saved resumes</b>
              <button className="btn small ghost" onClick={() => setShowSaved(false)}>✕</button>
            </div>
            <div className="modal-body">
              {saved.length === 0 && <p className="muted small">No saved resumes yet.</p>}
              {saved.map(r => (
                <div key={r.id} className="editrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <b style={{ fontSize: '13px' }}>{r.category || 'Resume'}</b>
                    <p className="muted small" style={{ margin: 0 }}>
                      {r.type} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <button
                    className="btn small"
                    onClick={() => { setResume(r.content); setCache('resume_builder', r.content); setShowSaved(false) }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== The printable resume document ===== */
function ResumeSheet({ resume, template }) {
  const h = resume.header || {}
  const contact = [h.email, h.phone, h.location, h.linkedin].filter(Boolean)
  return (
    <div className={`resume-sheet tpl-${template}`}>
      <header className="rs-header">
        <h1>{h.name || 'Your Name'}</h1>
        {h.title && <div className="rs-title">{h.title}</div>}
        {contact.length > 0 && (
          <div className="rs-contact">
            {contact.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        )}
      </header>

      {resume.summary && (
        <section>
          <h2>Summary</h2>
          <p>{resume.summary}</p>
        </section>
      )}

      {Array.isArray(resume.skills) && resume.skills.length > 0 && (
        <section>
          <h2>Skills</h2>
          <div className="rs-skills">
            {resume.skills.map((s, i) => <span key={i}>{s}</span>)}
          </div>
        </section>
      )}

      {Array.isArray(resume.experience) && resume.experience.length > 0 && (
        <section>
          <h2>Experience</h2>
          {resume.experience.map((e, i) => (
            <div key={i} className="rs-item">
              <div className="rs-item-head">
                <b>{e.title}</b>
                <span className="rs-period">{e.period}</span>
              </div>
              {e.company && <div className="rs-company">{e.company}</div>}
              {Array.isArray(e.bullets) && (
                <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {Array.isArray(resume.education) && resume.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {resume.education.map((e, i) => (
            <div key={i} className="rs-item">
              <div className="rs-item-head">
                <b>{e.degree}</b>
                <span className="rs-period">{e.period}</span>
              </div>
              {e.school && <div className="rs-company">{e.school}</div>}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
