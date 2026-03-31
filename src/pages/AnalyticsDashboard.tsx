import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, FlaskConical, GitBranch, AlertTriangle, Award, Leaf } from 'lucide-react';
import { getPathways, getMolecules, getRetrosynthesisLogs } from '@/services/supabase';
import type { Pathway, Molecule, RetrosynthesisLog } from '@/types';
import AppSkeleton from '@/components/ui/AppSkeleton';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const PURPLE = '#a855f7';
const TEAL   = '#14b8a6';
const AMBER  = '#f59e0b';
const RED    = '#f87171';
const GREEN  = '#22c55e';

const tooltipStyle = {
  contentStyle: {
    background: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    fontSize: 12,
    color: '#f1f5f9'
  }
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="p-5 rounded-xl bg-white/4 border border-white/8 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-slate-300 mb-3">{children}</h2>;
}

export default function AnalyticsDashboard() {
  const [pathways, setPathways]   = useState<Pathway[]>([]);
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [logs, setLogs]           = useState<RetrosynthesisLog[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, m, l] = await Promise.all([getPathways(), getMolecules(), getRetrosynthesisLogs()]);
        setPathways(p); setMolecules(m); setLogs(l);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived data ─────────────────────────────────────────────

  // Pathway scores over time (last 10)
  const scoreTimeline = [...pathways]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-10)
    .map((p, i) => ({
      name: `P${i + 1}`,
      score: Number(p.final_optimization_score.toFixed(1)),
      yield: Number(p.total_yield.toFixed(1))
    }));

  // Scale distribution
  const scaleCounts = { LAB: 0, PILOT: 0, INDUSTRIAL: 0 };
  pathways.forEach(p => { scaleCounts[p.manufacturing_scale as keyof typeof scaleCounts]++ });
  const scaleData = [
    { name: 'LAB',        value: scaleCounts.LAB,        color: TEAL },
    { name: 'PILOT',      value: scaleCounts.PILOT,      color: AMBER },
    { name: 'INDUSTRIAL', value: scaleCounts.INDUSTRIAL, color: PURPLE },
  ].filter(d => d.value > 0);

  // Lipinski pass/fail
  const passCount = molecules.filter(m => m.lipinski_violations === 0).length;
  const failCount = molecules.length - passCount;
  const lipinskiData = [
    { name: 'Pass', value: passCount, color: GREEN },
    { name: 'Fail', value: failCount, color: RED },
  ].filter(d => d.value > 0);

  // MW distribution buckets
  const mwBuckets: Record<string, number> = { '<200': 0, '200–300': 0, '300–400': 0, '400–500': 0, '>500': 0 };
  molecules.forEach(m => {
    const mw = m.molecular_weight;
    if (mw < 200) mwBuckets['<200']++;
    else if (mw < 300) mwBuckets['200–300']++;
    else if (mw < 400) mwBuckets['300–400']++;
    else if (mw < 500) mwBuckets['400–500']++;
    else mwBuckets['>500']++;
  });
  const mwData = Object.entries(mwBuckets).map(([range, count]) => ({ range, count }));

  // AI model usage
  const modelCounts: Record<string, number> = {};
  logs.forEach(l => {
    const name = l.ai_model?.model_name || 'Unknown';
    modelCounts[name] = (modelCounts[name] || 0) + 1;
  });
  const modelData = Object.entries(modelCounts).map(([model, count]) => ({ model, count }));

  // Hallucination risk distribution
  const riskBuckets = { Low: 0, Medium: 0, High: 0 };
  logs.forEach(l => {
    if (l.hallucination_risk_score < 0.3) riskBuckets.Low++;
    else if (l.hallucination_risk_score < 0.6) riskBuckets.Medium++;
    else riskBuckets.High++;
  });
  const riskData = [
    { name: 'Low',    value: riskBuckets.Low,    color: GREEN },
    { name: 'Medium', value: riskBuckets.Medium, color: AMBER },
    { name: 'High',   value: riskBuckets.High,   color: RED },
  ].filter(d => d.value > 0);

  // Summary stats
  const avgScore = pathways.length
    ? (pathways.reduce((s, p) => s + p.final_optimization_score, 0) / pathways.length).toFixed(1)
    : '—';
  const validatedCount  = logs.filter(l => l.human_validated).length;
  const pendingCount    = logs.filter(l => !l.human_validated).length;

  // MCDA radar average
  const radarData = [
    { metric: 'Yield',       value: pathways.length ? Math.min(100, pathways.reduce((s, p) => s + p.total_yield, 0) / pathways.length) : 0 },
    { metric: 'Safety',      value: logs.length ? Math.round((1 - logs.reduce((s, l) => s + l.hallucination_risk_score, 0) / logs.length) * 100) : 0 },
    { metric: 'Economics',   value: pathways.length ? Math.min(100, avgScore === '—' ? 0 : Number(avgScore)) : 0 },
    { metric: 'Green Chem',  value: molecules.length ? Math.round((passCount / Math.max(molecules.length, 1)) * 100) : 0 },
    { metric: 'Compliance',  value: logs.length ? Math.round((validatedCount / Math.max(logs.length, 1)) * 100) : 0 },
    { metric: 'Throughput',  value: Math.min(100, pathways.length * 10) },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <AppSkeleton key={i} height="80px" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <AppSkeleton key={i} height="260px" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div {...pageMotion} className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${PURPLE}20` }}>
          <TrendingUp size={20} style={{ color: PURPLE }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400">Platform-wide research intelligence</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={GitBranch}    label="Total Pathways"      value={pathways.length}   color={PURPLE} />
        <StatCard icon={FlaskConical} label="Molecules Analyzed"  value={molecules.length}  color={TEAL}   />
        <StatCard icon={Award}        label="Avg Optimization"    value={avgScore}           color={GREEN}  />
        <StatCard icon={AlertTriangle} label="Pending Validations" value={pendingCount}      color={AMBER}  />
      </div>

      {/* Row 1: Score timeline + MCDA radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>Pathway Optimization Scores Over Time</SectionTitle>
          {scoreTimeline.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No pathway data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreTimeline}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="score" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE, r: 3 }} name="Score" />
                <Line type="monotone" dataKey="yield" stroke={TEAL} strokeWidth={2} dot={{ fill: TEAL, r: 3 }} name="Yield %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>Platform Performance Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar dataKey="value" stroke={PURPLE} fill={PURPLE} fillOpacity={0.25} strokeWidth={2} />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Scale distribution + Lipinski pass/fail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>Pathway Scale Distribution</SectionTitle>
          {scaleData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No pathways yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={scaleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                  {scaleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>Lipinski Filter Results</SectionTitle>
          {lipinskiData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No molecules yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={lipinskiData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {lipinskiData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: GREEN }}>{passCount}</div>
                  <div className="text-xs text-slate-500">Pass</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: RED }}>{failCount}</div>
                  <div className="text-xs text-slate-500">Fail</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-300">
                    {molecules.length ? Math.round((passCount / molecules.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-slate-500">Pass Rate</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: MW distribution + AI risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>Molecular Weight Distribution</SectionTitle>
          {molecules.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No molecules yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mwData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill={TEAL} radius={[4, 4, 0, 0]} name="Molecules" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>AI Hallucination Risk Distribution</SectionTitle>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No retrosynthesis logs yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={riskData} layout="vertical">
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={55} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Logs">
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-4 pt-4 border-t border-white/6">
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: GREEN }}>{riskBuckets.Low}</div>
                  <div className="text-xs text-slate-500">Low Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: AMBER }}>{riskBuckets.Medium}</div>
                  <div className="text-xs text-slate-500">Medium Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: RED }}>{riskBuckets.High}</div>
                  <div className="text-xs text-slate-500">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-300">{validatedCount}</div>
                  <div className="text-xs text-slate-500">Validated</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 4: AI model usage */}
      {modelData.length > 0 && (
        <div className="p-5 rounded-xl bg-white/4 border border-white/8">
          <SectionTitle>AI Model Usage</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={modelData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="model" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} name="Runs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Green chemistry summary */}
      <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={16} className="text-teal-400" />
          <h2 className="text-sm font-semibold text-teal-300">Green Chemistry Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-400">{molecules.length}</div>
            <div className="text-xs text-slate-500 mt-1">Total Molecules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{passCount}</div>
            <div className="text-xs text-slate-500 mt-1">Lipinski Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{pathways.length}</div>
            <div className="text-xs text-slate-500 mt-1">Synthesis Routes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {molecules.length ? Math.round((passCount / molecules.length) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Drug-likeness Rate</div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}