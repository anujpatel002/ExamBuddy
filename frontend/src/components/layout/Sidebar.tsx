'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiLogOut, FiUser, FiStar } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggleButton from '../ui/ThemeToggleButton';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
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
    <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 z-30`}>
      <div className="p-3 md:p-4 text-xl md:text-2xl font-bold">ExamBuddy</div>
      <nav className="flex-1 px-2 py-2 md:py-4 space-y-1 md:space-y-2">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`flex items-center px-3 md:px-4 py-2 md:py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
              <link.icon className="mr-2 md:mr-3 h-5 md:h-6 w-5 md:w-6" />
              <span className="text-sm md:text-base">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
        <button onClick={logout} className="flex items-center justify-center md:justify-start px-3 md:px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700/50">
          <FiLogOut className="mr-2 md:mr-3 h-5 md:h-6 w-5 md:w-6" />
          <span>Logout</span>
        </button>
        <div className="flex justify-center">
          <ThemeToggleButton />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;