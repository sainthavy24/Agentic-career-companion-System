import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

const COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#ea580c', '#db2777']
function colorFor(s) { let h = 0; for (const c of (s || '?')) h = (h * 31 + c.charCodeAt(0)) % COLORS.length; return COLORS[h] }
function ago(d) { if (!d) return ''; const s = (Date.now() - new Date(d).getTime()) / 1000; if (s < 3600) return Math.max(1, Math.floor(s / 60)) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago' }

export default function Jobs() {
  const user = useUser()
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [matching, setMatching] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [withMatch, setWithMatch] = useState(false)
  const [sort, setSort] = useState('score')
  const [visible, setVisible] = useState(5)

  async function loadJobs() {
    try { const d = await apiGet('/api/v1/jobs'); setJobs(d.jobs || []) }
    catch { setMsg('Could not load jobs. Is the backend running on :8000?') }
  }
  async function loadMatches() {
    if (!user) return
    try { const d = await apiGet(`/api/v1/jobs/matches?user_id=${user.id}`); setMatches(d.matches || []) } catch { }
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
      if (d.detail) setMsg('Matching failed: ' + d.detail)
      else { setMsg(d.note || `Ranked ${d.matched} jobs for your skills.`); await loadMatches() }
    } catch { setMsg('Matching failed. (Check the Gemini key in backend/.env.)') }
    finally { setMatching(false) }
  }

  const base = matches.length
    ? matches.map(m => ({ score: m.score, matched: m.matched_skills || [], missing: m.missing_skills || [], created: m.created_at, job: m.job_postings || {} }))
    : jobs.map(j => ({ score: null, matched: [], missing: [], created: j.posted_at, job: j }))

  const filtered = base.filter(x => {
    const j = x.job
    const isRemote = j.remote || /remote/i.test(j.location || '')
    if (remoteOnly && !isRemote) return false
    if (withMatch && x.score == null) return false
    if (search) {
      const q = search.toLowerCase()
      if (!((j.title || '').toLowerCase().includes(q) || (j.company || '').toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q))) return false
    }
    return true
  })
  filtered.sort((a, b) => sort === 'score' ? (b.score ?? -1) - (a.score ?? -1) : new Date(b.job.posted_at || 0) - new Date(a.job.posted_at || 0))
  const shown = filtered.slice(0, visible)
  const clear = () => { setSearch(''); setRemoteOnly(false); setWithMatch(false) }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Job Scout</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            <span className="livedotc" /> AI agent is active:&nbsp;
            {matches.length ? <b>{matches.length} matches</b> : `${jobs.length} jobs`} ready for your profile
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" disabled={syncing} onClick={sync}>{syncing ? 'Syncing…' : '↻ Sync Jobs'}</button>
          <button className="btn" disabled={matching} onClick={findMatches}>{matching ? 'Matching…' : '✦ Find my matches'}</button>
        </div>
      </div>

      {msg && <div className="status ok" style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="searchbar">
        <span className="si">🔍</span>
        <input placeholder="Search jobs, companies, or locations…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="sortsel" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="score">Sort by: Match Score</option>
          <option value="recent">Sort by: Most Recent</option>
        </select>
      </div>

      <div className="joblayout">
        <aside className="filters">
          <div className="panel">
            <div className="stagehead"><h3 style={{ margin: 0 }}>Filters</h3><button className="linkbtn" onClick={clear}>Clear all</button></div>
            <label className="fcheck"><input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} /> Remote only</label>
            <label className="fcheck"><input type="checkbox" checked={withMatch} onChange={e => setWithMatch(e.target.checked)} /> Scored matches only</label>
            <p className="muted small" style={{ marginTop: 12 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="reco" style={{ marginTop: 14, display: 'block' }}>
            <span className="recolabel">Resume intelligence</span>
            <p className="muted small" style={{ margin: '6px 0 10px' }}>More skills on your profile → better match scores.</p>
            <Link to="/profile" className="agentgo" style={{ color: 'var(--primary)' }}>Update profile →</Link>
          </div>
        </aside>

        <div className="joblist">
          {shown.length === 0 && <div className="panel"><p className="muted">No jobs to show. Click <b>Sync Jobs</b>, then <b>Find my matches</b>.</p></div>}
          {shown.map((x, i) => {
            const j = x.job
            const isRemote = j.remote || /remote/i.test(j.location || '')
            return (
              <div className="jobcard rich" key={j.id || i}>
                <span className="jlogo" style={{ background: colorFor(j.company) }}>{(j.company || '?').slice(0, 1).toUpperCase()}</span>
                <div className="jbody">
                  <div className="jtop">
                    <div>
                      <b className="jtitle">{j.title}</b>
                      <div className="muted small">{j.company} · {j.location}{j.posted_at && <> · {ago(j.posted_at)}</>}</div>
                    </div>
                    {x.score != null && <span className="matchpill">{Math.round(x.score)}% match</span>}
                  </div>
                  <div className="jchips">
                    {isRemote && <span className="chip neu">Remote</span>}
                    {x.matched.slice(0, 5).map(s => <span key={s} className="chip ok">{s}</span>)}
                    {x.missing.slice(0, 3).map(s => <span key={s} className="chip miss">{s}</span>)}
                  </div>
                  {j.description && <p className="jobdesc">{j.description.slice(0, 180)}{j.description.length > 180 ? '…' : ''}</p>}
                  <div style={{ marginTop: 10 }}>
                    <a href={j.url} target="_blank" rel="noreferrer" className="btn small">View Details ↗</a>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length > 0 && (
            <div className="loadmore">
              <p className="muted small">Showing {shown.length} of {filtered.length}{matches.length ? ' matches' : ' jobs'}</p>
              {visible < filtered.length && <button className="btn ghost" onClick={() => setVisible(v => v + 5)}>Load more</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
