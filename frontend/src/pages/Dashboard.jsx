import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'

function Icon({ name }) {
  const p = {
    skills: <><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>,
    matches: <><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 0 0 0-7.65z" /></>,
    strength: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
    jobs: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    skillgap: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
    learning: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    career: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    interview: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  }[name]
  return <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
}

const AGENTS = [
  { to: '/jobs', icon: 'jobs', title: 'Job Scout', desc: 'Find and rank live job postings against your current skill set with AI-powered matching.', color: '#4f46e5', badge: 'Active agent' },
  { to: '/skill-gap', icon: 'skillgap', title: 'Skill Gap Analyzer', desc: 'Compare your profile to a target role and surface the missing skills, powered by Model 2.', color: '#7c3aed' },
  { to: '/resume', icon: 'resume', title: 'Resume Architect', desc: 'Predict your resume category with a trained NLP classifier (Model 1).', color: '#059669' },
  { to: '/learning', icon: 'learning', title: 'Learning Path', desc: 'Generate a free, ordered curriculum of resources to bridge your skill gaps.', color: '#0891b2' },
  { to: '/career', icon: 'career', title: 'Career Path', desc: 'Map a strategic, step-by-step ladder from where you are to your goal role.', color: '#ea580c' },
  { to: '/interview', icon: 'interview', title: 'Mock Interview', desc: 'Practice voice interviews and get instant AI feedback on content and a score.', color: '#db2777' },
]

export default function Dashboard() {
  const user = useUser()
  const [status, setStatus] = useState('checking')
  const [skills, setSkills] = useState(0)
  const [matches, setMatches] = useState(0)
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    apiGet('/api/v1/db-check')
      .then(d => setStatus(d.connected ? 'connected' : 'not connected'))
      .catch(() => setStatus('backend offline'))
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    supabase.from('skills').select('proficiency').then(({ data }) => {
      const arr = data || []
      setSkills(arr.length)
      if (arr.length) setStrength(Math.round(arr.reduce((a, s) => a + (s.proficiency || 0), 0) / arr.length))
    })
    apiGet(`/api/v1/jobs/matches?user_id=${user.id}`).then(d => setMatches((d.matches || []).length)).catch(() => {})
  }, [user])

  const name = user?.email ? user.email.split('@')[0] : 'there'

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1>Hi, {name} 👋</h1>
            <span className={`statuspill ${status === 'connected' ? 'ok' : 'bad'}`}>
              <span className="pilldot" /> {status === 'connected' ? 'System online' : status}
            </span>
          </div>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Your AI career &amp; talent companion.</p>
        </div>
        <Link to="/profile" className="iconbtn" title="Profile & settings"><Icon name="settings" /></Link>
      </div>

      <div className="statgrid">
        <div className="statcard">
          <span className="staticon" style={{ background: '#eef2ff', color: '#4f46e5' }}><Icon name="skills" /></span>
          <div><b className="num">{skills}</b><span className="muted small">skills in profile</span></div>
        </div>
        <div className="statcard">
          <span className="staticon" style={{ background: '#f3e8ff', color: '#7c3aed' }}><Icon name="matches" /></span>
          <div><b className="num">{matches}</b><span className="muted small">job matches</span></div>
        </div>
        <div className="statcard">
          <div style={{ flex: 1 }}>
            <b className="num">{strength}%</b><span className="muted small"> profile strength</span>
            <div className="bar"><span style={{ width: strength + '%' }} /></div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="status" style={{ marginBottom: 18 }}>
          <Link to="/login">Sign in</Link> to save skills and unlock personalized matches.
        </div>
      )}

      <h3 className="sectiontitle">Your agents</h3>
      <div className="agentgrid">
        {AGENTS.map(a => (
          <Link to={a.to} key={a.to} className="agentcard">
            <div className="agenttop">
              <span className="agenticon" style={{ background: a.color + '14', color: a.color }}><Icon name={a.icon} /></span>
              {a.badge && <span className="agentbadge">{a.badge}</span>}
            </div>
            <b>{a.title}</b>
            <span className="muted small adesc">{a.desc}</span>
            <span className="agentgo" style={{ color: a.color }}>Open →</span>
          </Link>
        ))}
      </div>

      <div className="reco">
        <div>
          <span className="recolabel">Recommended next step</span>
          <h3 style={{ margin: '4px 0 2px' }}>Close your biggest skill gap</h3>
          <p className="muted small" style={{ margin: 0 }}>Run the Skill Gap Analyzer on a target role, then build a learning path for what's missing.</p>
        </div>
        <Link to="/skill-gap" className="btn">Analyze a role →</Link>
      </div>
    </div>
  )
}
