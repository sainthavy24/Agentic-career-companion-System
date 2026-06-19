import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useUser } from '../lib/useUser.js'
import DatePicker, { fmtDate } from '../components/DatePicker.jsx'

function Ic({ n }) {
  const p = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    work: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    cap: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
  }[n]
  return <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
}

const empty = {
  full_name: '', preferred_name: '', headline: '', dob: '', location: '', phone: '',
  contact_email: '', linkedin: '', bio: '', availability: 'Open to work',
  avatar: '', experiences: [], education: [],
}

function monthsBetween(start, end) {
  if (!start) return 0
  const P = v => new Date(v.length === 7 ? v + '-01' : v)
  const s = P(start)
  const e = end ? P(end) : new Date()
  let m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  return Math.max(0, m)
}
function totalYears(exps) {
  const tot = (exps || []).reduce((a, x) => a + monthsBetween(x.start, x.current ? '' : x.end), 0)
  return tot ? (tot / 12).toFixed(1) : ''
}
function expPeriod(x) {
  if (x.start) return `${fmtDate(x.start, true)} — ${x.current ? 'Present' : (fmtDate(x.end, true) || 'Present')}`
  return x.period || ''
}

export default function Profile() {
  const user = useUser()
  const [p, setP] = useState(empty)
  const [skills, setSkills] = useState([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(empty)
  const [sName, setSName] = useState('')
  const [sLevel, setSLevel] = useState(50)
  const [toast, setToast] = useState(null)

  function showToast(text, type = 'ok') { setToast({ text, type }); setTimeout(() => setToast(null), 3200) }
  function calcAge(dob) { if (!dob) return ''; const d = new Date(dob); if (isNaN(d)) return ''; const t = new Date(); let a = t.getFullYear() - d.getFullYear(); const m = t.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--; return a }

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) {
      const pr = data.prefs || {}
      setP({
        full_name: data.full_name || '', headline: data.target_role || '', location: data.location || '',
        preferred_name: pr.preferred_name || '', phone: pr.phone || '', contact_email: pr.contact_email || '',
        dob: pr.dob || '', linkedin: pr.linkedin || '', bio: pr.bio || '',
        availability: pr.availability || 'Open to work', avatar: pr.avatar || '',
        experiences: pr.experiences || [], education: pr.education || [],
      })
    }
    const { data: sk } = await supabase.from('skills').select('*').order('proficiency', { ascending: false })
    setSkills(sk || [])
  }
  useEffect(() => { if (user) load() }, [user])

  function startEdit() { setDraft({ ...p }); setEditing(true) }

  async function save() {
    const prefs = {
      preferred_name: draft.preferred_name, phone: draft.phone, contact_email: draft.contact_email,
      dob: draft.dob, linkedin: draft.linkedin, bio: draft.bio,
      years_exp: totalYears(draft.experiences), availability: draft.availability, avatar: draft.avatar,
      experiences: draft.experiences, education: draft.education,
    }
    const { error } = await supabase.from('profiles').upsert(
      { id: user.id, email: user.email, full_name: draft.full_name, location: draft.location, target_role: draft.headline, prefs },
      { onConflict: 'id' })
    if (error) { showToast(error.message, 'bad'); return }
    setP({ ...draft }); setEditing(false); showToast('Profile saved successfully')
  }

  function pickAvatar(e) {
    const f = e.target.files?.[0]; if (!f) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); const s = 256
      const sc = Math.min(s / img.width, s / img.height)
      c.width = img.width * sc; c.height = img.height * sc
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      setDraft(d => ({ ...d, avatar: c.toDataURL('image/jpeg', 0.85) }))
    }
    img.src = URL.createObjectURL(f)
  }

  const addExp = () => setDraft(d => ({ ...d, experiences: [...d.experiences, { title: '', company: '', start: '', end: '', current: false, desc: '' }] }))
  const setExp = (i, k, v) => setDraft(d => { const a = [...d.experiences]; a[i] = { ...a[i], [k]: v }; return { ...d, experiences: a } })
  const delExp = i => setDraft(d => ({ ...d, experiences: d.experiences.filter((_, j) => j !== i) }))
  const addEdu = () => setDraft(d => ({ ...d, education: [...d.education, { degree: '', school: '', start: '', end: '' }] }))
  const setEdu = (i, k, v) => setDraft(d => { const a = [...d.education]; a[i] = { ...a[i], [k]: v }; return { ...d, education: a } })
  const delEdu = i => setDraft(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))

  async function addSkill(e) {
    e.preventDefault(); const n = sName.trim(); if (!n) return
    const { error } = await supabase.from('skills').upsert({ user_id: user.id, name: n, proficiency: Number(sLevel) }, { onConflict: 'user_id,name' })
    if (error) { showToast(error.message, 'bad'); return }
    setSName(''); setSLevel(50); load(); showToast(`Added "${n}"`)
  }
  async function delSkill(id) { await supabase.from('skills').delete().eq('id', id); load() }

  const years = totalYears(p.experiences)
  const filled = [p.full_name, p.headline, p.location, p.bio, p.avatar, years, p.linkedin,
    p.experiences.length, p.education.length, skills.length].filter(Boolean).length
  const strength = Math.round((filled / 10) * 100)

  const Toast = () => toast && (
    <div className={`toast ${toast.type}`}>
      <span className="ticon">{toast.type === 'bad' ? '!' : <Ic n="check" />}</span>{toast.text}
    </div>
  )

  if (user === undefined) return <p className="muted">Loading...</p>
  if (user === null) return (
    <div>
      <div className="topbar"><h1>Profile</h1></div>
      <div className="panel"><p>Please <Link to="/login">sign in</Link> to manage your profile.</p></div>
    </div>
  )

  const initials = (p.full_name || user.email || '?').slice(0, 2).toUpperCase()
  const dispEmail = p.contact_email || user.email
  const draftYears = totalYears(draft.experiences)

  // ---------- EDIT MODE (modal) ----------
  if (editing) {
    const set = (k, v) => setDraft({ ...draft, [k]: v })
    return (
      <div className="modal-overlay" onClick={() => setEditing(false)}>
        <Toast />
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <div className="breadcrumb">Settings <span>›</span> Edit Profile</div>
              <h2 style={{ margin: 0 }}>Edit Profile</h2>
              <p className="muted small editsub">Update your public presence and professional information.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save Changes</button>
            </div>
          </div>
          <div className="modal-body">

            <div className="panel sect">
              <div className="secthead"><span className="sicon"><Ic n="user" /></span><b>Personal Information</b><span className="verified">● Verified Profile</span></div>
              <div className="photo-row">
                {draft.avatar ? <img src={draft.avatar} className="pavatar" alt="" /> : <span className="pavatar ph">{initials}</span>}
                <div>
                  <b>Profile Picture</b>
                  <p className="muted small" style={{ margin: '2px 0 8px' }}>We recommend an image of at least 400×400. JPG, PNG, WEBP.</p>
                  <label className="btn ghost small">Change Photo<input type="file" accept="image/*" hidden onChange={pickAvatar} /></label>
                  {draft.avatar && <button className="linkbad" onClick={() => set('avatar', '')}>Remove</button>}
                </div>
              </div>
              <hr className="sep" />
              <div className="formgrid">
                <label>Full Name<input value={draft.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" /></label>
                <label>Email Address<input value={draft.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder={user.email} /></label>
                <label>Preferred Name<input value={draft.preferred_name} onChange={e => set('preferred_name', e.target.value)} placeholder="What we call you" /></label>
                <label>Phone Number<input value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 123-4567" /></label>
                <label>Date of Birth<DatePicker value={draft.dob} onChange={v => set('dob', v)} placeholder="Select date of birth" /></label>
                <label>Location<input value={draft.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" /></label>
              </div>
            </div>

            <div className="panel sect">
              <div className="secthead"><span className="sicon"><Ic n="work" /></span><b>Professional Identity</b></div>
              <div className="formgrid">
                <label>Current Job Title<input value={draft.headline} onChange={e => set('headline', e.target.value)} placeholder="e.g. Senior Product Designer" /></label>
                <label>LinkedIn URL<input value={draft.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></label>
                <label>Availability<input value={draft.availability} onChange={e => set('availability', e.target.value)} /></label>
                <label>Years of Experience <span className="auto-tag">auto</span><input value={draftYears ? draftYears + ' yrs' : '—'} disabled /></label>
              </div>
              <label className="block">Professional Bio
                <textarea className="ta" value={draft.bio} onChange={e => set('bio', e.target.value)} placeholder="A short professional summary..." />
              </label>
            </div>

            <div className="panel sect">
              <div className="secthead"><span className="sicon"><Ic n="work" /></span><b>Work Experience</b><button className="btn ghost small" style={{ marginLeft: 'auto' }} onClick={addExp}>+ Add</button></div>
              <p className="muted small" style={{ marginTop: 0 }}>Add start &amp; end dates — total experience is calculated automatically.</p>
              {draft.experiences.map((x, i) => (
                <div key={i} className="editrow">
                  <input placeholder="Job title" value={x.title} onChange={e => setExp(i, 'title', e.target.value)} />
                  <input placeholder="Company" value={x.company} onChange={e => setExp(i, 'company', e.target.value)} />
                  <div className="datefield"><span className="dlabel">Start</span><DatePicker value={x.start} onChange={v => setExp(i, 'start', v)} placeholder="Start date" /></div>
                  <div className="datefield"><span className="dlabel">End</span>
                    {x.current ? <input disabled value="Present" /> : <DatePicker value={x.end} onChange={v => setExp(i, 'end', v)} placeholder="End date" />}
                  </div>
                  <label className="chkrow"><input type="checkbox" checked={!!x.current} onChange={e => setExp(i, 'current', e.target.checked)} /> I currently work here</label>
                  <textarea placeholder="What you did" value={x.desc} onChange={e => setExp(i, 'desc', e.target.value)} />
                  <button className="linkbad" onClick={() => delExp(i)}>Remove</button>
                </div>
              ))}
            </div>

            <div className="panel sect">
              <div className="secthead"><span className="sicon"><Ic n="cap" /></span><b>Education</b><button className="btn ghost small" style={{ marginLeft: 'auto' }} onClick={addEdu}>+ Add</button></div>
              {draft.education.map((x, i) => (
                <div key={i} className="editrow">
                  <input placeholder="Degree" value={x.degree} onChange={e => setEdu(i, 'degree', e.target.value)} />
                  <input placeholder="School / University" value={x.school} onChange={e => setEdu(i, 'school', e.target.value)} />
                  <div className="datefield"><span className="dlabel">Start</span><DatePicker value={x.start} onChange={v => setEdu(i, 'start', v)} placeholder="Start date" /></div>
                  <div className="datefield"><span className="dlabel">End</span><DatePicker value={x.end} onChange={v => setEdu(i, 'end', v)} placeholder="End date" /></div>
                  <button className="linkbad" onClick={() => delEdu(i)}>Remove</button>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ---------- VIEW MODE ----------
  return (
    <div>
      <Toast />
      <div className="topbar"><h1>Profile &amp; Skills</h1>
        <button className="btn" onClick={startEdit}>Edit Profile</button>
      </div>

      <div className="phead panel">
        {p.avatar ? <img src={p.avatar} className="pavatar lg" alt="" /> : <span className="pavatar lg ph">{initials}</span>}
        <div className="pinfo">
          <h2>{p.full_name || dispEmail.split('@')[0]}{p.preferred_name && <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}> ({p.preferred_name})</span>}</h2>
          {p.headline && <div className="phl">{p.headline}</div>}
          <div className="pmeta">
            {p.location && <span>📍 {p.location}</span>}
            {p.dob && <span>🎂 {calcAge(p.dob)} yrs</span>}
            {p.phone && <span>📞 {p.phone}</span>}
            <span>✉ {dispEmail}</span>
            {p.linkedin && <a href={p.linkedin.startsWith('http') ? p.linkedin : 'https://' + p.linkedin} target="_blank" rel="noreferrer">🔗 LinkedIn</a>}
          </div>
        </div>
        <div className="pstrength">
          <div className="ring" style={{ background: `conic-gradient(var(--primary) ${strength * 3.6}deg, #ede9fe 0deg)` }}>
            <span>{strength}%</span>
          </div>
          <small className="muted">Profile strength</small>
        </div>
      </div>

      <div className="pcols">
        <div className="pcol">
          <div className="panel">
            <h3>Professional summary</h3>
            <p className="muted" style={{ lineHeight: 1.6 }}>{p.bio || 'No summary yet. Click Edit Profile to add one.'}</p>
            <div className="ministats">
              <div><b>{years ? years + ' yrs' : '—'}</b><span className="muted small">Experience</span></div>
              <div><b style={{ color: 'var(--ok)' }}>● {p.availability}</b><span className="muted small">Availability</span></div>
            </div>
          </div>
          <div className="panel">
            <h3>Work experience</h3>
            {p.experiences.length === 0 ? <p className="muted small">No experience added yet.</p> : (
              <div className="timeline">
                {p.experiences.map((x, i) => (
                  <div className="tlitem" key={i}>
                    <div className="stagehead"><b>{x.title}</b><span className="muted small">{expPeriod(x)}</span></div>
                    <div className="phl small">{x.company}</div>
                    {x.desc && <p className="muted small" style={{ margin: '4px 0 0' }}>{x.desc}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel">
            <h3>Education</h3>
            {p.education.length === 0 ? <p className="muted small">No education added yet.</p> : p.education.map((x, i) => (
              <div className="tlitem" key={i}>
                <div className="stagehead"><b>{x.degree}</b><span className="muted small">{expPeriod(x)}</span></div>
                <div className="phl small">{x.school}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pcol">
          <div className="panel">
            <h3>Skills matrix ({skills.length})</h3>
            <form onSubmit={addSkill} className="skillform" style={{ marginBottom: 8 }}>
              <input placeholder="Add skill e.g. React" value={sName} onChange={e => setSName(e.target.value)} />
              <label className="muted small">{sLevel}%</label>
              <input type="range" min="0" max="100" value={sLevel} onChange={e => setSLevel(e.target.value)} />
              <button className="btn small" type="submit">Add</button>
            </form>
            {skills.length === 0 ? <p className="muted small">No skills yet.</p> : skills.map(s => (
              <div className="skrow" key={s.id}>
                <div className="skhead"><span>{s.name}</span>
                  <span className="muted small">{s.proficiency}% <button className="x" onClick={() => delSkill(s.id)} title="remove">&times;</button></span>
                </div>
                <div className="bar"><span style={{ width: s.proficiency + '%' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
