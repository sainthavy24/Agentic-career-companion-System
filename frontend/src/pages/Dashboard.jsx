import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'

export default function Dashboard() {
  const [status, setStatus] = useState('checking...')
  useEffect(() => {
    apiGet('/api/v1/db-check')
      .then(d => setStatus(d.connected ? 'connected' : 'not connected'))
      .catch(() => setStatus('backend offline'))
  }, [])
  return (
    <div>
      <div className="topbar"><h1>Dashboard</h1><div className="avatar" /></div>
      <div className={`status ${status === 'connected' ? 'ok' : 'bad'}`}>
        Backend + Database: <b>{status}</b>
      </div>
      <div className="cards">
        <div className="card"><b className="num">0</b><span>job matches</span></div>
        <div className="card"><b className="num">0</b><span>skill gaps</span></div>
        <div className="card"><b className="num">&mdash;</b><span>profile strength</span></div>
      </div>
      <div className="panel">
        <h3>Welcome</h3>
        <p className="muted">Phase 1 foundation is live. Each module in the sidebar fills in over the coming phases.</p>
      </div>
    </div>
  )
}
