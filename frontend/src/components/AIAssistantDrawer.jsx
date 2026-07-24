import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function AIAssistantDrawer() {
  const user = useUser()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTips = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiPost('/api/v1/assistant/tips', {
        page_path: location.pathname,
        user_id: user?.id || null,
      })
      if (response && Array.isArray(response.tips)) {
        setTips(response.tips)
      } else {
        setTips(['Add some profile details to unlock personalized, AI-generated page recommendations.'])
      }
    } catch (err) {
      setError('Could not reach the AI guide server. Make sure the backend is active.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when drawer is opened or location path changes while drawer is open
  useEffect(() => {
    if (isOpen) {
      fetchTips()
    }
  }, [location.pathname, isOpen, user?.id])

  // Map path to a friendly name for the drawer title
  const getPageTitle = (pathname) => {
    const path = pathname.toLowerCase()
    if (path === '/' || path === '/dashboard') return 'Dashboard'
    if (path === '/profile') return 'Profile & Skills'
    if (path === '/jobs') return 'Job Scout'
    if (path === '/skill-gap') return 'Skill Gap'
    if (path === '/resume') return 'Resume'
    if (path === '/learning') return 'Learning Path'
    if (path === '/career') return 'Career Path'
    if (path === '/interview') return 'Mock Interview'
    return 'PathCompanion Guide'
  }

  return (
    <>
      {/* Drawer Toggle Floating Button (Lightbulb) */}
      <button 
        className="assistant-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle AI Page Guide"
      >
        <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>


      {/* Slide-out Drawer Panel */}
      <div className={`assistant-drawer ${isOpen ? 'open' : ''}`}>
        <div className="assistant-drawer-header">
          <b>
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Page Guide: {getPageTitle(location.pathname)}
          </b>
          <button className="assistant-drawer-close" onClick={() => setIsOpen(false)}>
            &times;
          </button>
        </div>

        <div className="assistant-drawer-body">
          {loading ? (
            <div className="assistant-loading-container">
              <div className="assistant-spinner"></div>
              <span>Generating page suggestions...</span>
            </div>
          ) : error ? (
            <div className="emptybox" style={{ color: 'var(--bad)', borderColor: 'rgba(220,38,38,0.2)' }}>
              {error}
            </div>
          ) : tips.length > 0 ? (
            tips.map((tip, idx) => (
              <div className="assistant-tip-card" key={idx}>
                <span className="assistant-tip-num">{idx + 1}</span>
                <div>{tip}</div>
              </div>
            ))
          ) : (
            <div className="emptybox">
              No suggestions available for this page.
            </div>
          )}

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <p className="muted small" style={{ margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
              Tips are dynamically generated using Gemini based on your live database context and target career goal.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
