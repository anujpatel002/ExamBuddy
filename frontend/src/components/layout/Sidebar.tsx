'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiLogOut, FiUser, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggleButton from '../ui/ThemeToggleButton';
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
    { href: '/study-room', label: 'Study Rooms', icon: FiUsers },
    { href: '/pricing', label: 'Pricing', icon: FiStar },
    { href: '/profile', label: 'Profile', icon: FiUser },
  ];

  const links = (user?.role === 'admin' || user?.role === 'sub-admin')
    ? [...studentLinks, { href: '/admin', label: '👑 Admin Panel', icon: FiUsers }]
    : studentLinks;

  return (
    <aside className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out md:translate-x-0 z-30`}>
      <div className="p-3 md:p-4">
        <div className={`text-xl md:text-2xl font-bold ${isCollapsed ? 'hidden' : 'block'}`}>ExamBuddy</div>
      </div>
      <nav className="flex-1 px-2 py-2 md:py-4 space-y-1 md:space-y-2">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3 md:px-4'} py-2 md:py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href ? 'bg-gray-700' : 'hover:bg-gray-700/50'} group relative`}>
              <link.icon className={`h-5 md:h-6 w-5 md:w-6 ${isCollapsed ? '' : 'mr-2 md:mr-3'}`} />
              <span className={`text-sm md:text-base ${isCollapsed ? 'hidden' : 'block'}`}>{link.label}</span>
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-700 flex flex-col gap-2">
        <button onClick={logout} className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3 md:px-4'} py-2 rounded-md text-sm font-medium hover:bg-gray-700/50 group relative`}>
          <FiLogOut className={`h-5 md:h-6 w-5 md:w-6 ${isCollapsed ? '' : 'mr-2 md:mr-3'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Logout</span>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;