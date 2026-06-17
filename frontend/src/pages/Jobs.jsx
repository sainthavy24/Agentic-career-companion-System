import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function Jobs() {
  const user = useUser()
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [matching, setMatching] = useState(false)
  const [msg, setMsg] = useState('')

  async function loadJobs() {
    try { const d = await apiGet('/api/v1/jobs'); setJobs(d.jobs || []) }
    catch { setMsg('Could not load jobs. Is the backend running on :8000?') }
  }
  async function loadMatches() {
    if (!user) return
    try { const d = await apiGet(`/api/v1/jobs/matches?user_id=${user.id}`); setMatches(d.matches || []) }
    catch { /* ignore */ }
  }

  useEffect(() => { loadJobs() }, [])
  useEffect(() => { if (user) loadMatches() }, [user])

  async function sync() {
    setSyncing(true); setMsg('')
    try { const d = await apiPost('/api/v1/jobs/sync'); setMsg(`Synced ${d.synced} jobs.`); await loadJobs() }
    catch { setMsg('Sync failed.') } finally { setSyncing(false) }
  }

  async function findMatches() {
    if (!user) { setMsg('Sign in and add skills (Profile) first.'); return }
    setMatching(true); setMsg('')
    try {
      const d = await apiPost('/api/v1/jobs/match', { user_id: user.id })
      if (d.detail) { setMsg('Matching failed: ' + d.detail) }
      else { setMsg(d.note ? d.note : `Ranked ${d.matched} jobs for your skills.`); await loadMatches() }
    } catch { setMsg('Matching failed. (Check the Gemini key in backend/.env.)') }
    finally { setMatching(false) }
  }

  const showMatches = matches.length > 0
  const list = showMatches
    ? matches
    : jobs.map(j => ({ score: null, matched_skills: [], job_postings: j }))

  return (
    <div>
      <div className="topbar">
        <h1>Job Scout</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" disabled={syncing} onClick={sync}>{syncing ? 'Syncing...' : 'Sync jobs'}</button>
          <button className="btn" disabled={matching} onClick={findMatches}>{matching ? 'Matching...' : 'Find my matches'}</button>
        </div>
      </div>

      {msg && <div className="status ok" style={{ marginBottom: 14 }}>{msg}</div>}
      {showMatches && <p className="muted small" style={{ marginTop: 0 }}>Ranked for your skills (highest match first).</p>}

      <div className="joblist">
        {list.map((m, i) => {
          const j = m.job_postings || m
          return (
            <div className="jobcard" key={j.id || i}>
              <div className="jobhead">
                <b>{j.title}</b>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {m.score != null && <span className="chip ok">{m.score}% match</span>}
                  <a href={j.url} target="_blank" rel="noreferrer" className="btn ghost small">View</a>
                </div>
              </div>
              <div className="muted small">{j.company} &middot; {j.location}</div>
              {m.matched_skills && m.matched_skills.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {m.matched_skills.map(s => <span key={s} className="chip ok">{s}</span>)}
                </div>
              )}
              <p className="jobdesc">{j.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
