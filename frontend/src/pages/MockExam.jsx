import { useState, useEffect } from 'react'
import { apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function MockExam() {
  const user = useUser()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [activeIdx, setActiveIdx] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [emailStatus, setEmailStatus] = useState('') // '', 'sending', 'sent', 'error'
  const [examResultId, setExamResultId] = useState(null)
  const [showCertPrompt, setShowCertPrompt] = useState(false)

  const fetchExam = async () => {
    setLoading(true)
    setError(null)
    setAnswers({})
    setActiveIdx(0)
    setSubmitted(false)
    setScore(null)
    setSaveStatus('')
    setEmailStatus('')
    setExamResultId(null)
    setShowCertPrompt(false)
    try {
      const response = await apiPost('/api/v1/exam/generate', {
        user_id: user?.id || null,
      })
      if (response && Array.isArray(response.questions)) {
        setExam(response)
      } else {
        setError('Failed to generate exam questions. Please try again.')
      }
    } catch (err) {
      setError('Could not reach the exam server. Please verify the backend is active.')
    } finally {
      setLoading(false)
    }
  }

  // Load exam on mount
  useEffect(() => {
    fetchExam()
    // eslint-disable-next-line
  }, [user?.id])

  const selectOption = (qIdx, optIdx) => {
    setAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx,
    }))
  }

  const submitExam = async () => {
    if (!exam || !exam.questions) return

    let correct = 0
    exam.questions.forEach((q, idx) => {
      if (answers[idx] === q.answer_idx) {
        correct++
      }
    })

    const total = exam.questions.length
    const pct = Math.round((correct / total) * 100)
    
    setCorrectCount(correct)
    setScore(pct)
    setSubmitted(true)

    if (user) {
      setSubmitting(true)
      try {
        const response = await apiPost('/api/v1/exam/submit', {
          user_id: user.id,
          subject: exam.subject || 'Career Skill Assessment',
          score: pct,
          total_questions: total,
          correct_answers: correct,
        })
        setSaveStatus('✓ Score saved to your profile history!')
        if (response && response.result && response.result.id) {
          setExamResultId(response.result.id)
        }
      } catch (err) {
        setSaveStatus('⚠ Score could not be saved to your profile.')
      } finally {
        setSubmitting(false)
        // Ask the user whether to email the certificate
        if (user.email) setShowCertPrompt(true)
      }
    } else {
      setSaveStatus('Sign in to save your score and unlock certifications.')
    }
  }

  const emailCertificate = async () => {
    if (!user || !user.email) return
    setEmailStatus('sending')
    try {
      await apiPost('/api/v1/exam/email-certificate', {
        user_id: user.id,
        email: user.email,
        subject: exam?.subject || 'Career Skill Assessment',
        score: score,
        total_questions: exam?.questions?.length || 0,
        correct_answers: correctCount,
        exam_result_id: examResultId,
      })
      setEmailStatus('sent')
    } catch (err) {
      console.error(err)
      setEmailStatus('error')
    }
  }

  const isAllAnswered = () => {
    if (!exam || !exam.questions) return false
    return exam.questions.every((_, idx) => answers[idx] !== undefined)
  }

  if (loading) {
    return (
      <div className="assistant-loading-container" style={{ minHeight: '300px' }}>
        <div className="assistant-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <h2>Generating Mockup Exam...</h2>
        <p className="muted small">Gemini is writing a specialized skill assessment for your target role...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: 'var(--bad)' }}>Exam Error</h2>
        <p className="muted" style={{ margin: '12px 0 20px' }}>{error}</p>
        <button className="btn grad" onClick={fetchExam}>Try Again</button>
      </div>
    )
  }

  if (!exam) return null

  const questions = exam.questions || []
  const activeQ = questions[activeIdx]

  return (
    <div className="exam-layout">
      <div className="topbar">
        <div>
          <h1>Mockup Exam</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>✦ AI-generated multiple-choice questions assessing skills related to your target career role.</p>
        </div>
        <span className="modelbadge"><span className="livedotc" /> Assessment active</span>
      </div>

      {!submitted ? (
        // Test Answering Phase
        <div className="exam-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="muted small" style={{ fontWeight: 600 }}>Subject: <span style={{ color: 'var(--primary)' }}>{exam.subject}</span></span>
            <span className="muted small">Question <b>{activeIdx + 1}</b> of <b>{questions.length}</b></span>
          </div>

          <div className="bar big" style={{ margin: '0 0 24px' }}>
            <span style={{ width: `${((activeIdx + 1) / questions.length) * 100}%` }} />
          </div>

          {activeQ && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.45 }}>{activeQ.question}</h2>
              
              <div className="exam-options-list">
                {activeQ.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    className={`exam-option-btn ${answers[activeIdx] === oIdx ? 'selected' : ''}`}
                    onClick={() => selectOption(activeIdx, oIdx)}
                  >
                    <span className="exam-option-badge">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="exam-nav-btns">
            <button
              className="btn ghost"
              onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
            >
              ← Previous
            </button>

            {activeIdx < questions.length - 1 ? (
              <button
                className="btn"
                onClick={() => setActiveIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={answers[activeIdx] === undefined}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn grad"
                onClick={submitExam}
                disabled={!isAllAnswered() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>
      ) : (
        // Score & Explanations Review Phase
        <div className="exam-layout">
          {showCertPrompt && user && (
            <div className="overlay" onClick={() => setShowCertPrompt(false)}>
              <div className="overlaycard" onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ margin: '0 0 8px' }}>Congratulations!</h3>
                <p className="muted small" style={{ margin: '0 0 6px' }}>
                  You scored <b>{score}%</b> on this assessment.
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 18px' }}>
                  Would you like your Certificate of Achievement emailed to<br />
                  <b style={{ color: 'var(--primary)' }}>{user.email}</b>?
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    className="btn grad"
                    onClick={() => { setShowCertPrompt(false); emailCertificate() }}
                  >
                    ✉ Yes, send it
                  </button>
                  <button className="btn ghost" onClick={() => setShowCertPrompt(false)}>
                    No, thanks
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="exam-card" style={{ textAlign: 'center' }}>
            <div className="exam-result-header">
              <h2>Exam Completed!</h2>
              <div className="exam-score-badge">
                {score}%
              </div>
              <p style={{ fontWeight: 600, fontSize: '16px', margin: '8px 0' }}>
                You scored {correctCount} out of {questions.length} correct answers.
              </p>
              <p className="muted small" style={{ margin: '6px 0 16px' }}>{saveStatus}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn grad" onClick={fetchExam}>Retake Assessment</button>
                  {user ? (
                    <button
                      className="btn ghost"
                      onClick={emailCertificate}
                      disabled={emailStatus === 'sending' || emailStatus === 'sent'}
                    >
                      {emailStatus === 'sending' && '✉ Sending...'}
                      {emailStatus === 'sent' && '✓ Sent!'}
                      {emailStatus === 'error' && '⚠ Retry Sending'}
                      {emailStatus === '' && '✉ Email Certificate'}
                    </button>
                  ) : (
                    <span className="muted small" style={{ alignSelf: 'center' }}>Sign in to email your certificate.</span>
                  )}
                </div>
                {emailStatus === 'sent' && (
                  <p style={{ color: 'var(--ok)', fontSize: '13px', margin: '4px 0 0', fontWeight: 600 }}>
                    ✓ Certificate sent successfully to your email!
                  </p>
                )}
                {emailStatus === 'error' && (
                  <p style={{ color: 'var(--bad)', fontSize: '13px', margin: '4px 0 0', fontWeight: 600 }}>
                    ⚠ Failed to send certificate. Please check backend configuration or retry.
                  </p>
                )}
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '18px', margin: '14px 0 4px' }}>Review Questions</h2>
          <div>
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.answer_idx
              return (
                <div key={idx} className={`exam-review-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <b style={{ fontSize: '15px' }}>{idx + 1}. {q.question}</b>
                    <span className={`chip ${isCorrect ? 'ok' : 'miss'}`} style={{ margin: 0 }}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="exam-options-list" style={{ marginTop: '12px' }}>
                    {q.options.map((opt, oIdx) => {
                      let cls = ''
                      if (oIdx === q.answer_idx) cls = 'correct-option'
                      if (answers[idx] === oIdx && !isCorrect) cls = 'incorrect-option'

                      // Custom inline style colors to show review highlights without extra layout shifts
                      let style = { pointerEvents: 'none', background: 'var(--surface)' }
                      if (oIdx === q.answer_idx) {
                        style.background = '#d1fae5'
                        style.borderColor = '#34d399'
                      } else if (answers[idx] === oIdx) {
                        style.background = '#fee2e2'
                        style.borderColor = '#f87171'
                      }

                      return (
                        <div
                          key={oIdx}
                          className="exam-option-btn"
                          style={style}
                        >
                          <span className="exam-option-badge" style={{ background: 'rgba(0,0,0,0.06)' }}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span style={{ color: 'var(--text)' }}>{opt}</span>
                          {oIdx === q.answer_idx && <span style={{ marginLeft: 'auto', color: 'var(--ok)', fontWeight: 700 }}>✓ Correct Answer</span>}
                          {answers[idx] === oIdx && !isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--bad)', fontWeight: 700 }}>✗ Your Choice</span>}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div className="exam-explanation">
                      <b style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>AI Explanation:</b>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
