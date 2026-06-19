import { useState, useRef } from 'react'
import { apiPost, apiUpload } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'
import { supabase } from '../lib/supabase.js'

const MAX_Q = 5

export default function Interview() {
  const user = useUser()
  const [role, setRole] = useState('')
  const [started, setStarted] = useState(false)
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState([])
  const [transcript, setTranscript] = useState('')
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
  async function getSkills() {
    if (!user || !supabase) return []
    const { data } = await supabase.from('skills').select('name')
    return (data || []).map(s => s.name)
  }

  async function start() {
    if (!role.trim()) { setMsg('Enter the role you are interviewing for.'); return }
    setBusy(true); setMsg(''); setFb(null); setHistory([]); setTranscript('')
    try {
      const skills = await getSkills()
      const d = await apiPost('/api/v1/interview/question', { role, history: [], skills })
      if (d.question) { setQuestion(d.question); setStarted(true); speak(d.question) }
      else setMsg(d.detail || 'Could not start.')
    } catch { setMsg('Request failed (backend running? Groq key set?).') }
    finally { setBusy(false) }
  }

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
          const ans = d.text || '(could not transcribe)'
          setTranscript(ans)
          await advance(ans)
        } catch { setMsg('Transcription failed.') } finally { setBusy(false) }
      }
      recRef.current = rec; rec.start(); setRecording(true)
    } catch { setMsg('Mic access denied or unavailable.') }
  }
  function stop() { if (recRef.current && recording) { recRef.current.stop(); setRecording(false) } }

  async function advance(answer) {
    const nh = [...history, { q: question, a: answer }]
    setHistory(nh)
    if (nh.length >= MAX_Q) { setQuestion(''); return }
    const skills = await getSkills()
    const d = await apiPost('/api/v1/interview/question', { role, history: nh, skills })
    if (d.question) { setQuestion(d.question); setTranscript(''); speak(d.question) }
  }

  async function getFeedback() {
    setBusy(true); setMsg('')
    try { setFb(await apiPost('/api/v1/interview/feedback', { role, history })) }
    catch { setMsg('Feedback failed.') } finally { setBusy(false) }
  }

  if (!started) {
    return (
      <div>
        <div className="topbar"><h1>Mock Interview</h1><span className="badge" style={{ background: '#db2777' }}>voice</span></div>
        <div className="panel">
          <p className="muted">Spoken practice interview. The AI asks questions aloud; you answer with your mic (Groq Whisper transcribes). {MAX_Q} questions, then feedback.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <input className="goalinput" value={role} onChange={e => setRole(e.target.value)} placeholder="Role, e.g. Frontend Engineer" />
            <button className="btn" disabled={busy} onClick={start}>{busy ? 'Starting...' : 'Start interview'}</button>
          </div>
          {msg && <p className="msg">{msg}</p>}
        </div>
      </div>
    )
  }

  const finished = history.length >= MAX_Q

  return (
    <div>
      <div className="topbar"><h1>Mock Interview</h1><span className="chip neu">{history.length} / {MAX_Q}</span></div>

      {!finished && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <div className={`voice ${recording ? 'ring' : ''}`}>{recording ? '...' : 'Q'}</div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0' }}>{question}</p>
          <button className="btn ghost small" onClick={() => speak(question)}>Replay voice</button>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!recording
              ? <button className="btn" disabled={busy} onClick={record}>{busy ? 'Processing...' : 'Record answer'}</button>
              : <button className="btn" style={{ background: '#dc2626' }} onClick={stop}>Stop &amp; submit</button>}
            <button className="btn ghost" style={{ borderColor: '#fca5a5', color: '#dc2626' }} onClick={() => setPanic(true)}>Panic</button>
          </div>
          {transcript && <div className="status ok" style={{ marginTop: 12, textAlign: 'left' }}>You said: {transcript}</div>}
          {msg && <p className="msg">{msg}</p>}
        </div>
      )}

      {finished && !fb && (
        <div className="panel">
          <p>Interview complete ({MAX_Q} questions).</p>
          <button className="btn" disabled={busy} onClick={getFeedback}>{busy ? 'Analyzing...' : 'Get feedback'}</button>
          {msg && <p className="msg">{msg}</p>}
        </div>
      )}

      {fb && (
        <div className="panel">
          <h3>Feedback {fb.score != null && <span className="chip ok">Score: {fb.score}/10</span>}</h3>
          <p>{fb.summary}</p>
          {fb.tips && fb.tips.length > 0 && <ul>{fb.tips.map((t, i) => <li key={i} className="muted">{t}</li>)}</ul>}
        </div>
      )}

      {panic && (
        <div className="overlay" onClick={() => setPanic(false)}>
          <div className="overlaycard" onClick={e => e.stopPropagation()}>
            <h3>Take a breath</h3>
            <div className="breathe" />
            <p className="muted">Breathe in 4s... hold 4s... out 4s. You've got this.</p>
            <button className="btn" onClick={() => setPanic(false)}>Resume</button>
          </div>
        </div>
      )}
    </div>
  )
}
