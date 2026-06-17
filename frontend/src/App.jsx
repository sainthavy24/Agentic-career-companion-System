import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Placeholder title="Job Scout" color="#2563eb" phase="Phase 2" desc="Aggregated jobs with semantic match %, matched and missing skills." />} />
          <Route path="/skill-gap" element={<Placeholder title="Skill Gap Analyzer" color="#7c3aed" phase="Phase 4" desc="Present vs missing skills, powered by the trained skill-extraction model." />} />
          <Route path="/learning" element={<Placeholder title="Learning Path" color="#0891b2" phase="Phase 5" desc="Ordered free resources per missing skill; marking complete triggers the cascade." />} />
          <Route path="/resume" element={<Placeholder title="Resume Architect" color="#059669" phase="Phase 5" desc="Upload/parse, classifier category, ATS-tailored resume per job." />} />
          <Route path="/interview" element={<Placeholder title="Mock Interview" color="#db2777" phase="Phase 6" desc="Voice interview, panic control, feedback report." />} />
          <Route path="/career" element={<Placeholder title="Career Path" color="#ea580c" phase="Phase 7" desc="Progression ladder with per-stage skills and timeline." />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
