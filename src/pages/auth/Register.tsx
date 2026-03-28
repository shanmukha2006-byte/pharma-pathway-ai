import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Building2, Microscope, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RESEARCHER' | 'ADMIN'>('RESEARCHER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password) { setError('Please fill in all required fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, password, fullName, institution, role);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card w-full max-w-[420px] p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Account</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Join PRPOIS Research Platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AppInput label="Full Name" placeholder="Dr. Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={<User size={16} />} />
          <AppInput label="Institution" placeholder="MIT, Stanford, etc." value={institution} onChange={(e) => setInstitution(e.target.value)} icon={<Building2 size={16} />} />
          <AppInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} />
          <AppInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div>
            <label className="block text-[var(--text-secondary)] text-xs font-medium mb-2">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('RESEARCHER')}
                className={`glass-card p-4 text-center transition-all ${role === 'RESEARCHER' ? 'border-[var(--purple)] border-2 bg-[rgba(124,58,237,0.08)]' : ''}`}
              >
                <Microscope size={20} className="mx-auto mb-2 text-[var(--teal-light)]" />
                <p className="text-[var(--text-primary)] text-sm font-medium">Researcher</p>
                <p className="text-[var(--text-muted)] text-[10px] mt-0.5">Analyze pathways and molecules</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`glass-card p-4 text-center transition-all ${role === 'ADMIN' ? 'border-[var(--purple)] border-2 bg-[rgba(124,58,237,0.08)]' : ''}`}
              >
                <Shield size={20} className="mx-auto mb-2 text-[var(--purple-light)]" />
                <p className="text-[var(--text-primary)] text-sm font-medium">Administrator</p>
                <p className="text-[var(--text-muted)] text-[10px] mt-0.5">Full system access</p>
              </button>
            </div>
          </div>

          <AppButton type="submit" loading={loading} className="w-full">
            Create Account
          </AppButton>
        </form>

        <p className="text-center text-[var(--text-muted)] text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--purple-light)] hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
