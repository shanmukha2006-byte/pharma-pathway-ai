import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Card from '@/components/ui/AppCard';
import AppBadge from '@/components/ui/AppBadge';
import AppButton from '@/components/ui/AppButton';
import AppSkeleton from '@/components/ui/AppSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import PDFReportButton from '@/components/ui/PDFReportButton';
import { getPathways } from '@/services/supabase';
import type { Pathway } from '@/types';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

type ScaleFilter = 'ALL' | 'LAB' | 'PILOT' | 'INDUSTRIAL';

export default function PathwayList() {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scaleFilter, setScaleFilter] = useState<ScaleFilter>('ALL');
  const [minScore, setMinScore] = useState(0);

  const load = async () => {
    setLoading(true); setError('');
    try { setPathways(await getPathways()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = pathways.filter((p) => {
    if (scaleFilter !== 'ALL' && p.manufacturing_scale !== scaleFilter) return false;
    if (p.final_optimization_score < minScore) return false;
    return true;
  });

  const scaleVariant = (s: string) => s === 'LAB' ? 'success' : s === 'PILOT' ? 'warning' : 'purple';
  const scales: ScaleFilter[] = ['ALL', 'LAB', 'PILOT', 'INDUSTRIAL'];

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {scales.map((s) => (
            <button
              key={s}
              onClick={() => setScaleFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                scaleFilter === s
                  ? 'bg-[var(--purple)] text-white'
                  : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-[var(--text-muted)] text-xs">Min Score: {minScore}</span>
            <input
              type="range" min={0} max={100} value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 h-1 appearance-none rounded-full"
              style={{ accentColor: 'var(--purple)' }}
            />
          </div>
        </div>
        <Link to="/pathways/new">
          <AppButton icon={<Plus size={14} />}>New Pathway</AppButton>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <AppSkeleton key={i} height="40px" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No pathways found"
            subtitle="Create your first pathway to get started"
            action={
              <Link to="/pathways/new">
                <AppButton size="sm" icon={<Plus size={14} />}>Create Pathway</AppButton>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['ID', 'Version', 'Scale', 'Score', 'Created', 'Report'].map((h) => (
                    <th key={h} className="text-[var(--text-muted)] uppercase text-[11px] font-medium text-left py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.pathway_id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="py-2 px-3 font-mono text-xs text-[var(--text-muted)]">
                      {p.pathway_id.slice(0, 8)}
                    </td>
                    <td className="py-2 px-3">
                      <AppBadge variant="gray">v{p.version}</AppBadge>
                    </td>
                    <td className="py-2 px-3">
                      <AppBadge variant={scaleVariant(p.manufacturing_scale)}>
                        {p.manufacturing_scale}
                      </AppBadge>
                    </td>
                    <td
                      className="py-2 px-3 font-medium"
                      style={{
                        color: p.final_optimization_score > 70
                          ? '#22c55e'
                          : p.final_optimization_score > 40
                          ? '#f59e0b'
                          : '#f87171'
                      }}
                    >
                      {p.final_optimization_score.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <PDFReportButton pathwayId={p.pathway_id} variant="icon" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}