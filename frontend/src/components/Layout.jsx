import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import ChatbotWidget from './ChatbotWidget.jsx'
import AIAssistantDrawer from './AIAssistantDrawer.jsx'

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main"><Outlet /></main>
      <ChatbotWidget />
      <AIAssistantDrawer />
    </div>
  )
}
