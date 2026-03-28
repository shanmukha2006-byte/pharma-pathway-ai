import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/molecules': 'Molecule Explorer',
  '/pathways': 'Pathways',
  '/pathways/new': 'New Pathway',
  '/retrosynthesis': 'Retrosynthesis Log',
  '/pricing': 'Indication Pricing',
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'PRPOIS';

  const initials = (user?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-[rgba(10,10,15,0.8)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <h1 className="text-[var(--text-primary)] font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          <Bell size={18} />
        </button>
        <span className="text-[var(--text-muted)] text-sm hidden sm:block">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--purple-light)] flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>
      </div>
    </header>
  );
}
