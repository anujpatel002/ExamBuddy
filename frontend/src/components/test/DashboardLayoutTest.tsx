'use client';

import { useState } from 'react';

export default function DashboardLayoutTest() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen p-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold theme-text-primary">Dashboard Layout Test</h1>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Collapsed: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
          </button>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 md:hidden"
          >
            Toggle Mobile Sidebar: {sidebarOpen ? 'Open' : 'Closed'}
          </button>
        </div>

        {/* Layout Test Container */}
        <div 
          className={`dashboard-container min-h-[400px] border-2 border-dashed border-gray-400 rounded-lg transition-all duration-500 ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'}}
        >
          {/* Mock Sidebar */}
          <div className={`fixed inset-y-0 left-0 ${sidebarCollapsed ? 'w-16' : 'w-64'} sidebar glass-card backdrop-blur-xl bg-slate-800/50 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-500 ease-in-out z-30 border-r border-gray-600`}>
            <div className="p-4">
              <div className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>
                <h2 className="text-lg font-bold text-white">ExamBuddy</h2>
              </div>
            </div>
            <nav className="flex-1 p-2">
              <div className="space-y-2">
                {['Dashboard', 'Subjects', 'Profile'].map((item) => (
                  <div 
                    key={item}
                    className={`p-3 rounded-lg bg-white/5 text-white text-sm ${sidebarCollapsed ? 'text-center' : 'text-left'}`}
                  >
                    {sidebarCollapsed ? item[0] : item}
                  </div>
                ))}
              </div>
            </nav>
          </div>

          {/* Mock Main Content */}
          <div className="main-content">
            <div className="p-4 bg-white/5 text-white">
              <h3 className="text-sm font-semibold">Mock Navbar</h3>
            </div>
            <div className="content-wrapper">
              <div className="space-y-4">
                <div className="glass-card p-6 rounded-lg bg-white/10 text-white">
                  <h3 className="text-xl font-bold mb-2">Welcome Back!</h3>
                  <p>This is the main dashboard content area.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card p-4 rounded-lg bg-white/10 text-white">
                      <h4 className="font-semibold mb-2">Left Content</h4>
                      <p>Main content goes here</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-lg bg-white/10 text-white">
                    <h4 className="font-semibold mb-2">Sidebar Content</h4>
                    <p>Side content goes here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-10 md:hidden" />
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Current State:</strong></p>
          <p>Sidebar Collapsed: {sidebarCollapsed ? 'Yes' : 'No'}</p>
          <p>Mobile Sidebar Open: {sidebarOpen ? 'Yes' : 'No'}</p>
          <p>Expected Layout: {sidebarCollapsed ? 'Content should use calc(100vw - 4rem) width' : 'Content should use calc(100vw - 16rem) width'}</p>
        </div>
      </div>
    </div>
  );
}