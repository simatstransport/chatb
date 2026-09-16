import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageSquare, Shield, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const role = profile.role;

  const getLinks = () => {
    switch (role) {
      case 'client':
        return [
          { name: 'Find Finishers', path: '/client', icon: Users },
          // In a full app, we might have a list of all active conversations here or on the dashboard
        ];
      case 'finisher':
        return [
          { name: 'Dashboard', path: '/finisher', icon: Home },
          { name: 'Admin Chat', path: '/chat/admin-finisher', icon: Shield, isSpecial: true },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: Home },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex flex-col items-center border-b border-gray-800">
        <img src="/asclogo.jpg" alt="Decochat" className="w-16 h-16 mb-2 object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        <h1 className="text-xl font-bold text-white tracking-wider">DECOCHAT</h1>
        <div className="mt-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-xl font-bold text-white mb-2">
            {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
          </div>
          <p className="text-sm font-semibold text-gray-200">{profile.username}</p>
          <span className="text-xs text-primary-400 mt-1 uppercase tracking-wider">{role}</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-900/30 text-primary-400 border border-primary-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${link.isSpecial ? 'mt-8 border border-gray-700' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={signOut}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
