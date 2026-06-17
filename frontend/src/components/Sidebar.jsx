import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/jobs', label: 'Job Scout' },
  { to: '/skill-gap', label: 'Skill Gap' },
  { to: '/learning', label: 'Learning' },
  { to: '/resume', label: 'Resume' },
  { to: '/interview', label: 'Interview' },
  { to: '/career', label: 'Career Path' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="logo">P</span><div><b>PathCompanion</b><small>AI career companion</small></div></div>
      <nav className="nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            <span className="dot" />{l.label}
          </NavLink>
        ))}
      </nav>
      <NavLink to="/login" className="navlink login">Sign in</NavLink>
    </aside>
  )
}
