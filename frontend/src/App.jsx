import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Jobs from './pages/Jobs.jsx'
import SkillGap from './pages/SkillGap.jsx'
import Resume from './pages/Resume.jsx'
import CareerPath from './pages/CareerPath.jsx'
import Learning from './pages/Learning.jsx'
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
          <Route path="/career" element={<CareerPath />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/interview" element={<Placeholder title="Mock Interview" color="#db2777" phase="Phase 8" desc="Voice interview, panic control, feedback report." />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
