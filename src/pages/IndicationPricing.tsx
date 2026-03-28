import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '@/components/ui/AppCard';
import AppBadge from '@/components/ui/AppBadge';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import AppSkeleton from '@/components/ui/AppSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { getPricing, getPathways, getMolecules } from '@/services/supabase';
import { createPricing } from '@/services/api';
import { useToast } from '@/hooks/useAppToast';
import type { IndicationPricing as PricingType, Pathway, Molecule } from '@/types';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

type Scale = 'LAB' | 'PILOT' | 'INDUSTRIAL';

export default function IndicationPricingPage() {
  const toast = useToast();
  const [pricing, setPricing] = useState<PricingType[]>([]);
  const [pathways, setPathwaysData] = useState<Pathway[]>([]);
  const [moleculesData, setMoleculesData] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pathwayId, setPathwayId] = useState('');
  const [moleculeId, setMoleculeId] = useState('');
  const [indication, setIndication] = useState('');
  const [formScale, setFormScale] = useState<Scale>('LAB');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [pr, pw, mol] = await Promise.all([getPricing(), getPathways(), getMolecules()]);
      setPricing(pr);
      setPathwaysData(pw);
      setMoleculesData(mol);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathwayId || !moleculeId || !indication.trim()) {
      toast.warning('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await createPricing({ pathway_id: pathwayId, molecule_id: moleculeId, indication, manufacturing_scale: formScale });
      toast.success('Pricing analysis created');
      setIndication('');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create pricing');
    } finally { setSubmitting(false); }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const chartData = pricing.reduce<Record<string, Record<string, number>>>((acc, p) => {
    if (!acc[p.indication]) acc[p.indication] = {};
    acc[p.indication][p.manufacturing_scale] = (acc[p.indication][p.manufacturing_scale] || 0) + p.net_profit_estimate;
    return acc;
  }, {});

  const barData = Object.entries(chartData).map(([indication, scales]) => ({
    indication,
    LAB: scales.LAB || 0,
    PILOT: scales.PILOT || 0,
    INDUSTRIAL: scales.INDUSTRIAL || 0,
  }));

  const totalEntries = pricing.length;
  const avgPrice = pricing.length ? pricing.reduce((s, p) => s + p.value_based_price, 0) / pricing.length : 0;
  const highestMargin = pricing.length ? pricing.reduce((m, p) => p.net_profit_estimate > m.net_profit_estimate ? p : m, pricing[0])?.indication || '—' : '—';

  const scaleVariant = (s: string) => s === 'LAB' ? 'success' : s === 'PILOT' ? 'warning' : 'purple';
  const scales: Scale[] = ['LAB', 'PILOT', 'INDUSTRIAL'];

  return (
    <motion.div {...pageMotion} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card title="New Pricing Analysis">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Pathway</label>
                <select className="input-field text-sm" value={pathwayId} onChange={(e) => setPathwayId(e.target.value)}>
                  <option value="">Select pathway...</option>
                  {pathways.map((p) => (
                    <option key={p.pathway_id} value={p.pathway_id}>{p.pathway_id.slice(0, 8)} — {p.manufacturing_scale}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">Molecule</label>
                <select className="input-field text-sm" value={moleculeId} onChange={(e) => setMoleculeId(e.target.value)}>
                  <option value="">Select molecule...</option>
                  {moleculesData.map((m) => (
                    <option key={m.molecule_id} value={m.molecule_id}>{m.canonical_smiles.slice(0, 30)}</option>
                  ))}
                </select>
              </div>
              <AppInput label="Disease Indication" placeholder="e.g. Type 2 Diabetes" value={indication} onChange={(e) => setIndication(e.target.value)} />
              <div>
                <label className="text-[var(--text-secondary)] text-xs font-medium block mb-2">Manufacturing Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  {scales.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => setFormScale(s)}
                      className={`glass-card py-2 text-xs font-medium text-center transition-all ${
                        formScale === s ? 'border-[var(--purple)] border-2 bg-[rgba(124,58,237,0.08)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <AppButton type="submit" loading={submitting} className="w-full">Submit Analysis</AppButton>
            </form>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-[var(--text-muted)] text-xs">Total Entries</p>
              <p className="text-[var(--text-primary)] text-xl font-bold mt-1">{loading ? '—' : totalEntries}</p>
            </Card>
            <Card>
              <p className="text-[var(--text-muted)] text-xs">Highest Margin</p>
              <p className="text-[var(--text-primary)] text-sm font-medium mt-1 truncate">{loading ? '—' : highestMargin}</p>
            </Card>
            <Card>
              <p className="text-[var(--text-muted)] text-xs">Avg Price</p>
              <p className="text-[var(--text-primary)] text-xl font-bold mt-1">{loading ? '—' : `$${avgPrice.toFixed(0)}`}</p>
            </Card>
          </div>

          {/* Table */}
          <Card title="Pricing Results">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <AppSkeleton key={i} height="36px" />)}</div>
            ) : pricing.length === 0 ? (
              <EmptyState title="No pricing data" subtitle="Create your first pricing analysis" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {['Indication', 'Molecule', 'Scale', 'Price', 'Profit', 'Date'].map((h) => (
                        <th key={h} className="text-[var(--text-muted)] uppercase text-[11px] font-medium text-left py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((p) => (
                      <tr key={p.pricing_id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)]">
                        <td className="py-2 px-3 text-[var(--text-primary)]">{p.indication}</td>
                        <td className="py-2 px-3 font-mono text-xs text-[var(--text-muted)] max-w-[120px] truncate">{p.molecule?.canonical_smiles || '—'}</td>
                        <td className="py-2 px-3"><AppBadge variant={scaleVariant(p.manufacturing_scale)}>{p.manufacturing_scale}</AppBadge></td>
                        <td className="py-2 px-3 text-[var(--text-primary)] font-mono">${p.value_based_price.toLocaleString()}</td>
                        <td className="py-2 px-3 font-mono" style={{ color: p.net_profit_estimate > 0 ? '#22c55e' : '#f87171' }}>${p.net_profit_estimate.toLocaleString()}</td>
                        <td className="py-2 px-3 text-[var(--text-muted)] text-xs">{new Date(p.evaluated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Chart */}
          {barData.length > 0 && (
            <Card title="Net Profit by Indication">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="indication" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="LAB" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PILOT" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="INDUSTRIAL" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
