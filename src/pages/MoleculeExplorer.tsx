import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle, XCircle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/AppCard';
import AppBadge from '@/components/ui/AppBadge';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import AppSkeleton from '@/components/ui/AppSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { getMolecules } from '@/services/supabase';
import { analyzeMolecule } from '@/services/api';
import type { Molecule, LipinskiResult } from '@/types';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function MoleculeExplorer() {
  const [smiles, setSmiles] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LipinskiResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      setMolecules(await getMolecules());
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleAnalyze = async () => {
    if (!smiles.trim()) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setResult(null);
    try {
      setResult(await analyzeMolecule(smiles.trim()));
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const propColor = (ok: boolean) => ok ? 'success' : 'error';

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Search bar */}
      <Card>
        <div className="flex gap-3">
          <div className="flex-1">
            <AppInput
              placeholder="Enter SMILES string..."
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              className="font-mono text-base"
              icon={<FlaskConical size={16} />}
            />
          </div>
          <AppButton onClick={handleAnalyze} loading={analyzing} icon={<FlaskConical size={16} />}>
            Analyze
          </AppButton>
        </div>
        {analyzeError && <p className="text-red-400 text-sm mt-3">{analyzeError}</p>}
      </Card>

      {/* Skeleton while analyzing */}
      {analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <AppSkeleton key={i} height="60px" />)}</div></Card>
          <Card><AppSkeleton height="300px" /></Card>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Property cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Molecular Weight', value: `${result.molecule.molecular_weight.toFixed(1)} Da`, ok: result.molecule.molecular_weight < 500 },
                { label: 'LogP', value: result.molecule.log_p.toFixed(2), ok: result.molecule.log_p <= 5 },
                { label: 'TPSA', value: `${result.molecule.tpsa.toFixed(1)} Å²`, ok: result.molecule.tpsa < 140 },
                { label: 'Lipinski Violations', value: String(result.molecule.lipinski_violations), ok: result.molecule.lipinski_violations === 0 },
              ].map((p) => (
                <Card key={p.label}>
                  <p className="text-[var(--text-muted)] text-xs">{p.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[var(--text-primary)] text-lg font-semibold font-mono">{p.value}</span>
                    <AppBadge variant={propColor(p.ok)}>{p.ok ? 'Pass' : 'Fail'}</AppBadge>
                  </div>
                </Card>
              ))}
            </div>

            {/* Lipinski banner */}
            <div className={`rounded-xl p-4 border ${result.passes_filter ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center gap-3">
                {result.passes_filter ? <CheckCircle className="text-green-400" size={24} /> : <XCircle className="text-red-400" size={24} />}
                <div>
                  <p className="text-[var(--text-primary)] font-medium">
                    {result.passes_filter ? 'Passes Lipinski Rule of 5' : 'Fails Lipinski Rule of 5'}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">
                    {result.passes_filter ? 'Molecule is eligible for oral bioavailability testing' : 'Review violations below'}
                  </p>
                </div>
              </div>
              {!result.passes_filter && result.violations.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {result.violations.map((v, i) => <li key={i} className="text-red-400 text-xs">• {v}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* Radar chart */}
          <Card title="Bioavailability Radar">
            {result.radar_data && result.radar_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={result.radar_data}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="var(--teal)" fill="var(--purple)" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No radar data" subtitle="Radar data not available for this molecule" />
            )}
          </Card>
        </div>
      )}

      {/* History */}
      <Card title="Analysis History">
        {historyLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <AppSkeleton key={i} height="36px" />)}</div>
        ) : historyError ? (
          <ErrorState message={historyError} onRetry={loadHistory} />
        ) : molecules.length === 0 ? (
          <EmptyState title="No molecules analyzed" subtitle="Run your first analysis above" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['SMILES', 'IUPAC Name', 'MW', 'Violations', 'Date'].map((h) => (
                    <th key={h} className="text-[var(--text-muted)] uppercase text-[11px] font-medium text-left py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {molecules.map((m) => (
                  <tr key={m.molecule_id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="py-2 px-3 font-mono text-xs text-[var(--text-secondary)] max-w-[200px] truncate">{m.canonical_smiles}</td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">{m.iupac_name || '—'}</td>
                    <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{m.molecular_weight.toFixed(1)}</td>
                    <td className="py-2 px-3">
                      <AppBadge variant={m.lipinski_violations === 0 ? 'success' : 'error'}>{m.lipinski_violations}</AppBadge>
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-xs">{new Date(m.ingested_at).toLocaleDateString()}</td>
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
