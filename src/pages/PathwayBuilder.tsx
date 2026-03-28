import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Beaker, Factory, Building2, Plus, Trash2, Thermometer, Gauge, Leaf, DollarSign,
  Check, Rocket, ChevronUp, ChevronDown,
} from 'lucide-react';
import Card from '@/components/ui/AppCard';
import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import AppBadge from '@/components/ui/AppBadge';
import { createPathway } from '@/services/api';
import { useToast } from '@/hooks/useAppToast';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

type Scale = 'LAB' | 'PILOT' | 'INDUSTRIAL';
type MolRole = 'REACTANT' | 'PRODUCT' | 'CATALYST' | 'SOLVENT';

interface StepMol { id: string; smiles: string; role: MolRole; quantity: number; }
interface Step {
  id: string; temp: number; pressure: number; eFactor: number; cost: number;
  solvent: string; molecules: StepMol[];
}

const newMol = (): StepMol => ({ id: crypto.randomUUID(), smiles: '', role: 'REACTANT', quantity: 0 });
const newStep = (): Step => ({
  id: crypto.randomUUID(), temp: 25, pressure: 1, eFactor: 0, cost: 0,
  solvent: '', molecules: [newMol()],
});

export default function PathwayBuilder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [scale, setScale] = useState<Scale | ''>('');
  const [profileName, setProfileName] = useState('');
  const [weights, setWeights] = useState({ yield: 25, safety: 25, economics: 25, green: 25 });
  const [steps, setSteps] = useState<Step[]>([newStep()]);
  const [submitting, setSubmitting] = useState(false);

  const totalWeight = weights.yield + weights.safety + weights.economics + weights.green;

  const updateStep = useCallback((id: string, updates: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const moveStep = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= steps.length) return;
    const copy = [...steps];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setSteps(copy);
  };

  const score = Math.round(
    (weights.yield * 0.75 + weights.safety * 0.8 + weights.economics * 0.6 + weights.green * 0.7) / (totalWeight || 1) * 100
  ) / 100 * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createPathway({
        manufacturing_scale: scale,
        weight_profile: { profile_name: profileName, ...weights },
        steps: steps.map((s, i) => ({
          step_order: i + 1,
          temperature_celsius: s.temp,
          pressure_bar: s.pressure,
          e_factor: s.eFactor,
          projected_hardware_cost: s.cost,
          solvent: s.solvent,
          molecules: s.molecules.map((m) => ({ smiles: m.smiles, role: m.role, quantity_grams: m.quantity })),
        })),
      });
      toast.success('Pathway created successfully');
      navigate('/pathways');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create pathway');
    } finally {
      setSubmitting(false);
    }
  };

  const scaleOptions: { value: Scale; label: string; icon: typeof Beaker; desc: string; cost: string }[] = [
    { value: 'LAB', label: 'Laboratory', icon: Beaker, desc: 'Gram scale', cost: 'Est. $500 hardware' },
    { value: 'PILOT', label: 'Pilot Plant', icon: Factory, desc: 'Kilogram scale', cost: 'Est. $50,000 hardware' },
    { value: 'INDUSTRIAL', label: 'Industrial', icon: Building2, desc: 'Tonne scale', cost: 'Est. $5M hardware' },
  ];

  const weightSliders: { key: keyof typeof weights; label: string; color: string }[] = [
    { key: 'yield', label: 'Reaction Yield', color: '#f59e0b' },
    { key: 'safety', label: 'Thermodynamic Safety', color: '#22c55e' },
    { key: 'economics', label: 'Economic Feasibility', color: '#3b82f6' },
    { key: 'green', label: 'Green Chemistry', color: 'var(--teal)' },
  ];

  return (
    <motion.div {...pageMotion} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {['Configuration', 'Reaction Steps', 'Review & Submit'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              i < step ? 'bg-[var(--teal)] text-white' :
              i === step ? 'bg-[var(--purple)] text-white' :
              'border border-[var(--border-input)] text-[var(--text-muted)]'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-px bg-[var(--border-subtle)]" />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-6">
          <Card title="Manufacturing Scale">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scaleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScale(opt.value)}
                  className={`glass-card p-5 text-center transition-all ${scale === opt.value ? 'border-[var(--purple)] border-2 bg-[rgba(124,58,237,0.08)]' : ''}`}
                >
                  <opt.icon size={24} className="mx-auto mb-2 text-[var(--purple-light)]" />
                  <p className="text-[var(--text-primary)] font-medium text-sm">{opt.label}</p>
                  <p className="text-[var(--text-muted)] text-xs">{opt.desc}</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-1">{opt.cost}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card title="MCDA Weight Profile">
            <AppInput label="Profile Name" placeholder="My Weight Profile" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mb-4" />
            <div className="space-y-4">
              {weightSliders.map((ws) => (
                <div key={ws.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">{ws.label}</span>
                    <AppBadge variant="gray">{weights[ws.key]}%</AppBadge>
                  </div>
                  <input
                    type="range" min={0} max={100}
                    value={weights[ws.key]}
                    onChange={(e) => setWeights({ ...weights, [ws.key]: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: ws.color }}
                  />
                </div>
              ))}
            </div>
            <p className={`text-sm mt-3 ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total: {totalWeight}% {totalWeight === 100 && <Check size={14} className="inline" />}
            </p>
          </Card>

          <div className="flex justify-end">
            <AppButton onClick={() => setStep(1)} disabled={!scale || totalWeight !== 100}>Next</AppButton>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AppButton variant="secondary" icon={<Plus size={14} />} onClick={() => setSteps([...steps, newStep()])}>
              Add Reaction Step
            </AppButton>
          </div>

          {steps.map((s, idx) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[var(--text-primary)] font-semibold text-sm">Step {idx + 1}</h4>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveStep(idx, -1)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronUp size={14} /></button>
                  <button onClick={() => moveStep(idx, 1)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronDown size={14} /></button>
                  <button onClick={() => setSteps(steps.filter((x) => x.id !== s.id))} className="p-1 text-[var(--text-muted)] hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <AppInput label="Temperature (°C)" type="number" value={s.temp} onChange={(e) => updateStep(s.id, { temp: Number(e.target.value) })} icon={<Thermometer size={14} />} />
                <AppInput label="Pressure (bar)" type="number" value={s.pressure} onChange={(e) => updateStep(s.id, { pressure: Number(e.target.value) })} icon={<Gauge size={14} />} />
                <AppInput label="E-Factor" type="number" value={s.eFactor} onChange={(e) => updateStep(s.id, { eFactor: Number(e.target.value) })} icon={<Leaf size={14} />} />
                <AppInput label="Projected Cost ($)" type="number" value={s.cost} onChange={(e) => updateStep(s.id, { cost: Number(e.target.value) })} icon={<DollarSign size={14} />} />
              </div>
              <AppInput label="Solvent" placeholder="e.g. Ethanol" value={s.solvent} onChange={(e) => updateStep(s.id, { solvent: e.target.value })} className="mb-3" />

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)] text-xs font-medium">Molecules</span>
                  <button onClick={() => updateStep(s.id, { molecules: [...s.molecules, newMol()] })} className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">+ Add Molecule</button>
                </div>
                {s.molecules.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 mb-2">
                    <input className="input-field font-mono text-xs flex-1" placeholder="SMILES" value={m.smiles}
                      onChange={(e) => updateStep(s.id, { molecules: s.molecules.map((x) => x.id === m.id ? { ...x, smiles: e.target.value } : x) })} />
                    <select className="input-field text-xs w-28"
                      value={m.role}
                      onChange={(e) => updateStep(s.id, { molecules: s.molecules.map((x) => x.id === m.id ? { ...x, role: e.target.value as MolRole } : x) })}>
                      <option value="REACTANT">Reactant</option>
                      <option value="PRODUCT">Product</option>
                      <option value="CATALYST">Catalyst</option>
                      <option value="SOLVENT">Solvent</option>
                    </select>
                    <input className="input-field text-xs w-20" type="number" placeholder="g" value={m.quantity}
                      onChange={(e) => updateStep(s.id, { molecules: s.molecules.map((x) => x.id === m.id ? { ...x, quantity: Number(e.target.value) } : x) })} />
                    <button onClick={() => updateStep(s.id, { molecules: s.molecules.filter((x) => x.id !== m.id) })} className="text-[var(--text-muted)] hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <div className="flex justify-between">
            <AppButton variant="ghost" onClick={() => setStep(0)}>Back</AppButton>
            <AppButton onClick={() => setStep(2)} disabled={steps.length === 0}>Next</AppButton>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Summary">
              <div className="space-y-3">
                <div><span className="text-[var(--text-muted)] text-xs">Scale</span><br /><AppBadge variant="purple" size="md">{scale}</AppBadge></div>
                <div><span className="text-[var(--text-muted)] text-xs">Profile</span><br /><span className="text-[var(--text-primary)] text-sm">{profileName || 'Default'}</span></div>
                <div><span className="text-[var(--text-muted)] text-xs">Steps</span><br /><span className="text-[var(--text-primary)] text-sm">{steps.length}</span></div>
                <div><span className="text-[var(--text-muted)] text-xs">Total Molecules</span><br /><span className="text-[var(--text-primary)] text-sm">{steps.reduce((a, s) => a + s.molecules.length, 0)}</span></div>
              </div>
            </Card>

            <Card className="flex flex-col items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <motion.circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#f87171'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - score / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  transform="rotate(-90 80 80)"
                />
                <text x="80" y="80" textAnchor="middle" dominantBaseline="central" className="fill-[var(--text-primary)] text-3xl font-bold">{Math.round(score)}</text>
              </svg>
              <p className="text-[var(--text-muted)] text-xs mt-2">Optimization Score</p>
            </Card>

            <Card title="MCDA Weights">
              <div className="space-y-3">
                {weightSliders.map((ws) => (
                  <div key={ws.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">{ws.label}</span>
                      <span className="text-[var(--text-muted)]">{weights[ws.key]}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${weights[ws.key]}%`, background: ws.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex justify-between">
            <AppButton variant="ghost" onClick={() => setStep(1)}>Back</AppButton>
            <AppButton loading={submitting} onClick={handleSubmit} icon={<Rocket size={16} />} className="px-8">
              Submit Pathway
            </AppButton>
          </div>
        </div>
      )}
    </motion.div>
  );
}
