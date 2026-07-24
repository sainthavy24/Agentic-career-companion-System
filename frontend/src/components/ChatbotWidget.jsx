import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function ChatbotWidget() {
  const user = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: 'Hi! I am your PathCompanion chatbot. Ask me anything about your career roadmap, target roles, active learning plans, or resume categories!',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, busy, isOpen])

  const suggestions = [
    'What is my career target role?',
    'What skills do I have?',
    'What are my missing skills?',
    'Show my learning plans & progress',
  ]

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim()
    if (!text) return

    if (!textToSend) setInput('')

    const updatedMessages = [...messages, { role: 'user', content: text }]
    setMessages(updatedMessages)
    setBusy(true)

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await apiPost('/api/v1/chat', {
        message: text,
        user_id: user?.id || null,
        history: historyPayload,
      })

      if (response && response.response) {
        setMessages([
          ...updatedMessages,
          { role: 'model', content: response.response },
        ])
      } else {
        setMessages([
          ...updatedMessages,
          { role: 'model', content: 'Received empty response. Please try again.' },
        ])
      }
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'model', content: 'Connection error. Is the backend server running?' },
      ])
    } finally {
      setBusy(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="chat-widget-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle AI Chatbot"
      >
        {isOpen ? (
          // Close Icon
          <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Speech Bubble Icon
          <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="chat-widget-panel">
          {/* Header */}
          <div className="chat-widget-header">
            <div>
              <b>PathCompanion Bot</b>
              <div style={{ fontSize: '10px', opacity: 0.85 }}>
                {user ? `Active: ${user.email}` : 'General Mode'}
              </div>
            </div>
            <button className="chat-widget-close" onClick={() => setIsOpen(false)}>
              &times;
            </button>
          </div>

          {/* Messages Feed */}
          <div className="chat-widget-messages">
            {messages.map((m, idx) => (
              <div className={`chat-widget-msg ${m.role === 'user' ? 'user' : 'bot'}`} key={idx}>
                <div className="chat-widget-avatar">
                  {m.role === 'user' ? 'ME' : 'AI'}
                </div>
                <div className="chat-widget-bubble">
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="chat-widget-msg bot">
                <div className="chat-widget-avatar">AI</div>
                <div className="chat-widget-typing">
                  <span className="chat-dot"></span>
                  <span className="chat-dot"></span>
                  <span className="chat-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Suggestions */}
          <div className="chat-widget-input-container">
            <div className="chat-widget-suggestions">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="chat-widget-sug-btn"
                  onClick={() => handleSend(s)}
                  disabled={busy}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="chat-widget-input-form">
              <input
                type="text"
                className="chat-widget-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={busy}
              />
              <button
                className="btn grad small"
                onClick={() => handleSend()}
                disabled={busy || !input.trim()}
                style={{ padding: '8px 14px' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
