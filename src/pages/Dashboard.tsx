import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, FlaskConical, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/AppCard';
import AppBadge from '@/components/ui/AppBadge';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import AppSkeleton from '@/components/ui/AppSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { getDashboardStats, getPathways } from '@/services/supabase';
import { analyzeMolecule } from '@/services/api';
import type { DashboardStats, Pathway, LipinskiResult } from '@/types';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / 1000, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);
  return <>{display}</>;
}

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [smiles, setSmiles] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LipinskiResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, p] = await Promise.all([getDashboardStats(), getPathways()]);
      setStats(s);
      setPathways(p.slice(0, 5));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAnalyze = async () => {
    if (!smiles.trim()) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setResult(null);
    try {
      const r = await analyzeMolecule(smiles.trim());
      setResult(r);
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed — API may be unavailable');
    } finally {
      setAnalyzing(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const statCards = [
    { label: 'Total Pathways', value: stats?.totalPathways || 0, icon: <GitBranch size={20} />, color: 'var(--purple)' },
    { label: 'Molecules Analyzed', value: stats?.moleculesAnalyzed || 0, icon: <FlaskConical size={20} />, color: 'var(--teal)' },
    { label: 'Pending Validations', value: stats?.pendingValidations || 0, icon: <AlertTriangle size={20} />, color: '#f59e0b' },
    { label: 'Avg Score', value: stats?.avgOptimizationScore || 0, icon: <TrendingUp size={20} />, color: '#22c55e' },
  ];

  const scaleVariant = (s: string) => s === 'LAB' ? 'success' : s === 'PILOT' ? 'warning' : 'purple';

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc) => (
          <Card key={sc.label} className="relative overflow-hidden hover:scale-[1.01] transition-transform">
            {loading ? (
              <div className="space-y-3">
                <AppSkeleton width="60%" height="14px" />
                <AppSkeleton width="40%" height="32px" />
              </div>
            ) : (
              <>
                <div className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${sc.color}20`, color: sc.color }}>
                  {sc.icon}
                </div>
                <p className="text-[var(--text-muted)] text-xs">{sc.label}</p>
                <p className="text-[var(--text-primary)] text-[32px] font-bold mt-1">
                  <AnimatedNumber value={sc.value} />
                </p>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pathways */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Pathways"
            headerAction={<Link to="/pathways" className="text-[var(--purple-light)] text-xs hover:underline">View all →</Link>}
          >
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <AppSkeleton key={i} height="40px" />)}</div>
            ) : pathways.length === 0 ? (
              <EmptyState title="No pathways yet" subtitle="Create your first pathway to get started" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {['ID', 'Scale', 'Score', 'Created'].map((h) => (
                        <th key={h} className="text-[var(--text-muted)] uppercase text-[11px] font-medium text-left py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pathways.map((p) => (
                      <tr key={p.pathway_id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)]">
                        <td className="py-2 px-3 font-mono text-[var(--text-muted)] text-xs">{p.pathway_id.slice(0, 8)}</td>
                        <td className="py-2 px-3"><AppBadge variant={scaleVariant(p.manufacturing_scale)}>{p.manufacturing_scale}</AppBadge></td>
                        <td className="py-2 px-3" style={{ color: p.final_optimization_score > 70 ? '#22c55e' : p.final_optimization_score > 40 ? '#f59e0b' : '#f87171' }}>
                          {p.final_optimization_score.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-muted)] text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Analysis */}
        <Card title="Quick Analysis" headerAction={<FlaskConical size={16} className="text-[var(--teal)]" />}>
          <div className="space-y-3">
            <AppInput
              placeholder="Enter SMILES string e.g. CCO"
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              className="font-mono"
            />
            <AppButton onClick={handleAnalyze} loading={analyzing} variant="secondary" className="w-full" style={{ borderColor: 'var(--teal)', color: 'var(--teal-light)' }}>
              Analyze
            </AppButton>
            {analyzeError && <p className="text-red-400 text-xs">{analyzeError}</p>}
            {result && (
              <div className="space-y-2 mt-2">
                <AppBadge variant={result.passes_filter ? 'success' : 'error'} size="md">
                  {result.passes_filter ? 'Passes Lipinski Filter' : 'Fails Lipinski Filter'}
                </AppBadge>
                <p className="text-[var(--text-secondary)] text-xs">
                  MW: {result.molecule.molecular_weight.toFixed(1)} Da · Violations: {result.molecule.lipinski_violations}
                </p>
                {!result.passes_filter && result.violations.length > 0 && (
                  <ul className="text-red-400 text-xs space-y-0.5">
                    {result.violations.map((v, i) => <li key={i}>• {v}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
