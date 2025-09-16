'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiLogOut, FiUser, FiStar, FiChevronLeft, FiChevronRight, FiBookmark, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/subjects', label: 'My Subjects', icon: FiStar },
    { href: '#', label: 'NotebookLM', icon: FiBook, comingSoon: true },
    { href: '/pinned-questions', label: 'Pinned Questions', icon: FiBookmark },
    { href: '/study-room', label: 'Study Rooms', icon: FiUsers },
    { href: '/pricing', label: 'Pricing', icon: FiStar },
    { href: '/profile', label: 'Profile', icon: FiUser },
  ];

  const links = (user?.role === 'admin' || user?.role === 'sub-admin')
    ? [...studentLinks, { href: '/admin', label: '👑 Admin Panel', icon: FiUsers }]
    : studentLinks;

  return (
    <aside className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-16' : 'w-64'} sidebar glass-card backdrop-blur-xl theme-bg-secondary flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-500 ease-in-out z-30 theme-border border-r`}>
      <div className="p-6">
        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
          <h1 className="text-2xl font-bold theme-text-primary">ExamBuddy</h1>
          <p className="text-xs theme-text-muted mt-1">AI-Powered Learning</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-2">
        {links.map((link, index) => {
          if (link.comingSoon) {
            return (
              <button key={link.href} onClick={() => toast('🚀 Feature coming soon!')} className={`sidebar-item stagger-item flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:theme-bg-tertiary hover:backdrop-blur-sm group relative w-full text-left`} style={{animationDelay: `${index * 0.1}s`}}>
                <link.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} theme-text-secondary`} />
                <span className={`${isCollapsed ? 'hidden' : 'block'} theme-text-secondary`}>{link.label}</span>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 glass-card backdrop-blur-sm theme-text-primary text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
              </button>
            );
          }
          return (
            <Link key={link.href} href={link.href} className={`sidebar-item stagger-item flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-300 ${pathname === link.href ? 'active bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg' : 'hover:theme-bg-tertiary hover:backdrop-blur-sm'} group relative`} style={{animationDelay: `${index * 0.1}s`}}>
                <link.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${pathname === link.href ? 'text-blue-400' : 'theme-text-secondary'}`} />
                <span className={`${isCollapsed ? 'hidden' : 'block'} ${pathname === link.href ? 'theme-text-primary font-semibold' : 'theme-text-secondary'}`}>{link.label}</span>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 glass-card backdrop-blur-sm theme-text-primary text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t theme-border">
        <button onClick={logout} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium hover:bg-red-500/20 hover:border hover:border-red-500/30 transition-all duration-300 group relative theme-text-secondary hover:text-red-400`}>
          <FiLogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Logout</span>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 glass-card backdrop-blur-sm theme-text-primary text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;