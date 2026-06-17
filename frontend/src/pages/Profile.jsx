import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'

export default function Profile() {
  const user = useUser()
  const [skills, setSkills] = useState([])
  const [name, setName] = useState('')
  const [prof, setProf] = useState(50)
  const [msg, setMsg] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('skills').select('*').order('created_at', { ascending: false })
    if (!error) setSkills(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    // upsert: new skill -> insert; existing skill -> update its level (no duplicate error)
    const { error } = await supabase.from('skills')
      .upsert({ user_id: user.id, name: n, proficiency: Number(prof) }, { onConflict: 'user_id,name' })
    if (error) { setMsg(error.message); return }
    setMsg(`Saved "${n}".`)
    setName(''); setProf(50)
    load()
  }

  async function remove(id) {
    await supabase.from('skills').delete().eq('id', id)
    load()
  }

  if (user === undefined) return <p className="muted">Loading...</p>
  if (user === null) return (
    <div>
      <div className="topbar"><h1>Profile</h1></div>
      <div className="panel"><p>Please <Link to="/login">sign in</Link> to manage your skills.</p></div>
    </div>
  )

  return (
    <div>
      <div className="topbar"><h1>Profile &amp; Skills</h1><span className="muted small">{user.email}</span></div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3>Add a skill</h3>
        <form onSubmit={add} className="skillform">
          <input placeholder="e.g. React" value={name} onChange={e => setName(e.target.value)} />
          <label className="muted small">level {prof}%</label>
          <input type="range" min="0" max="100" value={prof} onChange={e => setProf(e.target.value)} />
          <button className="btn" type="submit">Add</button>
        </form>
        {msg && <p className="msg">{msg}</p>}
        <p className="muted small" style={{ marginTop: 6 }}>Re-adding an existing skill just updates its level.</p>
      </div>

      <div className="panel">
        <h3>Your skills ({skills.length})</h3>
        {skills.length === 0 ? (
          <p className="muted">No skills yet. Add some above &mdash; these power your job matches and skill-gap analysis.</p>
        ) : (
          <div className="skillwrap">
            {skills.map(s => (
              <span key={s.id} className="skillchip">
                {s.name} <small>{s.proficiency}%</small>
                <button className="x" onClick={() => remove(s.id)} title="remove">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
