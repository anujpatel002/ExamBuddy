'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggleButton from '../ui/ThemeToggleButton';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/study-room', label: 'Study Rooms', icon: FiUsers },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Admin Panel', icon: FiHome },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    // This sidebar is fixed on mobile (below md) and part of the flex layout on desktop (md and up)
    <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 z-30`}>
      <div className="p-4 text-2xl font-bold">ExamBuddy</div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
              <link.icon className="mr-3 h-6 w-6" />
              {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-700 flex justify-between items-center">
        <button onClick={logout} className="flex-1 flex items-center px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700/50">
          <FiLogOut className="mr-3 h-6 w-6" />
          <span>Logout</span>
        </button>
        <ThemeToggleButton />
      </div>
    </aside>
  );
};

export default Sidebar;