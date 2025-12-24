import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const DriverLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>
        {/* Header - Fixed/Sticky */}
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content - with top padding to account for fixed header */}
        <main className="flex-1 overflow-auto pt-16">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DriverLayout
