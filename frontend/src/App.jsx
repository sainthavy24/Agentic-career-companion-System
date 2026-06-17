import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Jobs from './pages/Jobs.jsx'
import SkillGap from './pages/SkillGap.jsx'
import Resume from './pages/Resume.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/skill-gap" element={<SkillGap />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/learning" element={<Placeholder title="Learning Path" color="#0891b2" phase="Phase 6" desc="Ordered free resources per missing skill; marking complete triggers the cascade." />} />
          <Route path="/interview" element={<Placeholder title="Mock Interview" color="#db2777" phase="Phase 6" desc="Voice interview, panic control, feedback report." />} />
          <Route path="/career" element={<Placeholder title="Career Path" color="#ea580c" phase="Phase 7" desc="Progression ladder with per-stage skills and timeline." />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
