import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../lib/api.js'
import { useUser } from '../lib/useUser.js'

export default function Chatbot() {
  const user = useUser()
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: 'Hi! I am your PathCompanion AI assistant. I can guide you on your career path, analyze your skills, recommend learning material, or give resume advice. How can I help you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to the bottom of the message container on update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, busy])

  const suggestions = [
    'What is my career target role?',
    'What skills do I currently have?',
    'What are my missing skills?',
    'Show my learning plans & progress',
  ]

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim()
    if (!text) return

    // Clear input if sending from text input
    if (!textToSend) setInput('')

    const updatedMessages = [...messages, { role: 'user', content: text }]
    setMessages(updatedMessages)
    setBusy(true)

    try {
      // Map frontend format to backend expectations
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
          { role: 'model', content: 'Oops! I received an empty response. Please try again.' },
        ])
      }
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'model', content: 'Sorry, I couldn\'t connect to the backend server. Please verify the backend is running.' },
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
    <div>
      <div className="topbar">
        <div>
          <h1>AI Career Assistant</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>✦ Conversational companion trained on your career timeline, skills, and learning progress.</p>
        </div>
        <span className="modelbadge"><span className="livedotc" /> AI status: active</span>
      </div>

      <div className="chat-layout">
        <div className="chat-header">
          <span style={{ fontWeight: 600, fontSize: '14px' }}>PathCompanion Chat</span>
          <span className="muted small">{user ? `Signed in as ${user.email}` : 'Unsigned (General Mode)'}</span>
        </div>

        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`} key={idx}>
              <div className="chat-avatar">
                {m.role === 'user' ? 'ME' : 'AI'}
              </div>
              <div className="chat-bubble">
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="chat-msg bot">
              <div className="chat-avatar">AI</div>
              <div className="chat-typing">
                <span className="chat-dot"></span>
                <span className="chat-dot"></span>
                <span className="chat-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-suggestions">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                className="chat-sug-btn"
                onClick={() => handleSend(s)}
                disabled={busy}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your skills, resume, or goals..."
              disabled={busy}
            />
            <button
              className="btn grad"
              onClick={() => handleSend()}
              disabled={busy || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
