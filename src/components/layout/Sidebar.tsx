import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, GitBranch, Brain, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Molecules', icon: FlaskConical, path: '/molecules' },
  { label: 'Pathways', icon: GitBranch, path: '/pathways' },
  { label: 'Retrosynthesis', icon: Brain, path: '/retrosynthesis' },
  { label: 'Pricing', icon: DollarSign, path: '/pricing' },
];

export default function Sidebar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-[var(--sidebar-bg)] border-r border-[var(--border-subtle)] z-40">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--purple)]" />
            <span className="text-[var(--text-primary)] font-bold text-lg tracking-tight">PRPOIS</span>
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-1 pl-4">Research Platform</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-[rgba(124,58,237,0.15)] text-[var(--purple-light)] border-l-2 border-[var(--purple)]'
                    : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--purple-light)] flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-primary)] text-[13px] font-medium truncate">
                {profile?.full_name || user?.email}
              </p>
              <span className={user?.role === 'ADMIN' ? 'badge-info' : 'badge-success'}>
                {user?.role || 'RESEARCHER'}
              </span>
            </div>
            <button onClick={logout} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--sidebar-bg)] border-t border-[var(--border-subtle)] flex items-center justify-around z-40">
        {navItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${
                active ? 'text-[var(--purple-light)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
