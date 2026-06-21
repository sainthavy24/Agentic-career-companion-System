import { useState, useRef } from 'react'
import { apiPost, apiUpload } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'
import { supabase } from '../lib/supabase.js'

const MAX_Q = 5
const VERDICT = { strong: '#059669', okay: '#ea580c', weak: '#dc2626' }

export default function Interview() {
  const user = useUser()
  const [role, setRole] = useState('')
  const [started, setStarted] = useState(false)
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState([])
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [lastAns, setLastAns] = useState('')
  const [coach, setCoach] = useState(null)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [panic, setPanic] = useState(false)
  const [fb, setFb] = useState(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])

  function speak(t) {
    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)) } catch {}
  }
  function coachText(c) {
    const p = []
    if (c.verdict) p.push(`That answer was ${c.verdict}.`)
    if (c.reaction) p.push(c.reaction)
    if (c.good) p.push(`What you did well: ${c.good}.`)
    if (c.improve) p.push(`To improve: ${c.improve}.`)
    if (c.model_answer) p.push(`Here is a strong example answer. ${c.model_answer}`)
    return p.join(' ')
  }
  async function getSkills() {
    if (!user || !supabase) return []
    const { data } = await supabase.from('skills').select('name')
    return (data || []).map(s => s.name)
  }

  async function start() {
    if (!role.trim()) { setMsg('Enter the role you are interviewing for.'); return }
    setBusy(true); setMsg(''); setFb(null); setHistory([]); setTranscript(''); setCoach(null); setTyped('')
    try {
      const skills = await getSkills()
      const d = await apiPost('/api/v1/interview/question', { role, history: [], skills })
      if (d.question) { setQuestion(d.question); setStarted(true); speak(d.question) }
      else setMsg(d.detail || 'Could not start.')
    } catch { setMsg('Request failed (backend running? Groq key set?).') }
    finally { setBusy(false) }
  }

  // record voice -> transcribe -> coach
  async function record() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => chunksRef.current.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData(); fd.append('file', blob, 'answer.webm')
        setBusy(true)
        try {
          const d = await apiUpload('/api/v1/interview/transcribe', fd)
          await submitAnswer(d.text || '(could not transcribe)')
        } catch { setMsg('Transcription failed.') } finally { setBusy(false) }
      }
      recRef.current = rec; rec.start(); setRecording(true)
    } catch { setMsg('Mic access denied or unavailable.') }
  }
  function stop() { if (recRef.current && recording) { recRef.current.stop(); setRecording(false) } }

  // shared path for voice + typed answers
  async function submitAnswer(ans) {
    setTranscript(ans); setLastAns(ans); setCoach(null); setMsg(''); setBusy(true)
    try {
      const c = await apiPost('/api/v1/interview/coach', { role, question, answer: ans })
      setCoach(c); speak(coachText(c))
    } catch { setMsg('Could not score that answer.') } finally { setBusy(false) }
  }
  async function submitTyped() {
    if (!typed.trim()) { setMsg('Type your answer first.'); return }
    await submitAnswer(typed.trim())
  }

  // move to next question after seeing coaching
  async function next() {
    const nh = [...history, { q: question, a: lastAns }]
    setHistory(nh); setCoach(null); setTranscript(''); setTyped('')
    if (nh.length >= MAX_Q) { setQuestion(''); return }
    setBusy(true)
    try {
      const skills = await getSkills()
      const d = await apiPost('/api/v1/interview/question', { role, history: nh, skills })
      if (d.question) { setQuestion(d.question); speak(d.question) }
    } catch { setMsg('Could not load next question.') } finally { setBusy(false) }
  }

  async function getFeedback() {
    setBusy(true); setMsg('')
    try { setFb(await apiPost('/api/v1/interview/feedback', { role, history })) }
    catch { setMsg('Feedback failed.') } finally { setBusy(false) }
  }

  // ---------- START SCREEN ----------
  if (!started) {
    return (
      <div>
        <div className="topbar">
          <div><h1>Mock Interview</h1><p className="muted small" style={{ margin: '4px 0 0' }}>Practice with an AI interviewer that reacts to every answer and shows you how to answer better.</p></div>
          <span className="badge" style={{ background: '#db2777' }}>AI coach</span>
        </div>
        <div className="panel">
          <p className="muted">{MAX_Q} questions, tailored to your role &amp; skills. After each answer you get instant coaching — a score, what to improve, and a model answer. Answer by voice or by typing.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <input className="goalinput" value={role} onChange={e => setRole(e.target.value)} placeholder="Role, e.g. Frontend Engineer" />
            <button className="btn" disabled={busy} onClick={start}>{busy ? 'Starting…' : 'Start interview'}</button>
          </div>
          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>
    )
  }

  const finished = history.length >= MAX_Q
  const vColor = coach ? (VERDICT[coach.verdict] || '#64748b') : '#64748b'

  return (
    <div>
      <div className="topbar"><h1>Mock Interview</h1><span className="chip neu">{history.length} / {MAX_Q}</span></div>

      {!finished && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className={`voice ${recording ? 'ring' : ''}`}>{recording ? '🎙' : 'Q'}</div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0' }}>{question}</p>
          <button className="btn ghost small" onClick={() => speak(question)}>🔊 Replay voice</button>

          {!coach && (
            <>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!recording
                  ? <button className="btn" disabled={busy} onClick={record}>{busy ? 'Scoring…' : '🎙 Record answer'}</button>
                  : <button className="btn" style={{ background: '#dc2626' }} onClick={stop}>■ Stop &amp; submit</button>}
                <button className="btn ghost" style={{ borderColor: '#fca5a5', color: '#dc2626' }} onClick={() => setPanic(true)}>Panic</button>
              </div>
              <div style={{ marginTop: 12, textAlign: 'left' }}>
                <textarea className="ta" style={{ minHeight: 80 }} value={typed} onChange={e => setTyped(e.target.value)} placeholder="…or type your answer here" />
                <button className="btn ghost" disabled={busy} onClick={submitTyped}>Submit typed answer</button>
              </div>
            </>
          )}

          {transcript && <div className="status ok" style={{ marginTop: 12, textAlign: 'left' }}><b>Your answer:</b> {transcript}</div>}
          {busy && !coach && <p className="muted small" style={{ marginTop: 10 }}>Coach is reviewing your answer…</p>}
          {msg && <p className="msg">{msg}</p>}
        </div>
      )}

      {/* per-answer coaching card */}
      {coach && !finished && (
        <div className="panel coachcard" style={{ borderLeft: `4px solid ${vColor}`, marginTop: 14, textAlign: 'left' }}>
          <div className="stagehead">
            <h3 style={{ margin: 0, textTransform: 'capitalize', color: vColor }}>{coach.verdict || 'Feedback'}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {coach.score != null && <span className="chip" style={{ background: vColor + '18', color: vColor, border: `1px solid ${vColor}55`, margin: 0 }}>Score {coach.score}/10</span>}
              <button className="btn ghost small" onClick={() => speak(coachText(coach))}>🔊 Replay</button>
            </div>
          </div>
          {coach.reaction && <p style={{ margin: '8px 0', fontWeight: 600 }}>{coach.reaction}</p>}
          {coach.good && <p className="muted small" style={{ margin: '4px 0' }}>✅ <b>Good:</b> {coach.good}</p>}
          {coach.improve && <p className="muted small" style={{ margin: '4px 0' }}>⚠️ <b>Improve:</b> {coach.improve}</p>}
          {coach.model_answer && (
            <div className="modelans">
              <span className="recolabel">Model answer</span>
              <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>{coach.model_answer}</p>
            </div>
          )}
          <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={next}>
            {history.length + 1 >= MAX_Q ? 'Finish & get summary →' : 'Next question →'}
          </button>
        </div>
      )}

      {finished && !fb && (
        <div className="panel">
          <p>Interview complete — {MAX_Q} questions answered. Get your overall summary.</p>
          <button className="btn" disabled={busy} onClick={getFeedback}>{busy ? 'Analyzing…' : 'Get overall feedback'}</button>
          {msg && <p className="msg">{msg}</p>}
        </div>
      )}

      {fb && (
        <div className="panel accent-purple">
          <div className="stagehead"><h3 style={{ margin: 0 }}>Overall feedback</h3>{fb.score != null && <span className="chip ok">Score: {fb.score}/10</span>}</div>
          <p>{fb.summary}</p>
          {fb.tips && fb.tips.length > 0 && <ul>{fb.tips.map((t, i) => <li key={i} className="muted">{t}</li>)}</ul>}
          <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => { setStarted(false); setHistory([]); setFb(null); setCoach(null) }}>Practice again</button>
        </div>
      )}

      {panic && (
        <div className="overlay" onClick={() => setPanic(false)}>
          <div className="overlaycard" onClick={e => e.stopPropagation()}>
            <h3>Take a breath</h3>
            <div className="breathe" />
            <p className="muted">Breathe in 4s… hold 4s… out 4s. You've got this.</p>
            <button className="btn" onClick={() => setPanic(false)}>Resume</button>
          </div>
        </div>
      )}
    </div>
  )
}
