import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'

function Icon({ name }) {
  const p = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    profile: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    jobs: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    skillgap: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    learning: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
    interview: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>,
    career: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    exam: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    builder: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  }[name]
  return <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
}

const groups = [
  { title: null, links: [{ to: '/', icon: 'dashboard', label: 'Dashboard', end: true }, { to: '/profile', icon: 'profile', label: 'Profile & Skills' }] },
  {
    title: 'Agents', links: [
      { to: '/jobs', icon: 'jobs', label: 'Job Scout' },
      { to: '/skill-gap', icon: 'skillgap', label: 'Skill Gap' },
      { to: '/resume', icon: 'resume', label: 'Resume' },
      { to: '/resume-builder', icon: 'builder', label: 'Resume Builder' },
      { to: '/learning', icon: 'learning', label: 'Learning' },
      { to: '/career', icon: 'career', label: 'Career Path' },
      { to: '/interview', icon: 'interview', label: 'Interview' },
      { to: '/exam', icon: 'exam', label: 'Mock Exam' },
    ],
  },
]

export default function Sidebar() {
  const user = useUser()
  const nav = useNavigate()
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : ''

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    nav('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand"><span className="logo">P</span><div><b>PathCompanion</b><small>AI career companion</small></div></div>
      <nav className="nav">
        {groups.map((g, gi) => (
          <div key={gi} className="navgroup">
            {g.title && <div className="navsection">{g.title}</div>}
            {g.links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
                <Icon name={l.icon} />{l.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {user ? (
        <div className="userbox">
          <span className="uavatar">{initials}</span>
          <span className="uemail" title={user.email}>{user.email}</span>
          <button className="signout" onClick={signOut} title="Sign out"><Icon name="logout" /></button>
        </div>
      ) : (
        <NavLink to="/login" className="navlink login">Sign in</NavLink>
      )}
    </aside>
  )
}
