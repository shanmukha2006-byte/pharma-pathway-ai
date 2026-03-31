import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Zap, Download } from "lucide-react";
import axios from "axios";

const API = "https://pharma-pathway-ai-production.up.railway.app/api";

interface RetroStep {
  step_number: number;
  reaction_type: string;
  starting_material: string;
  reagents: string[];
  conditions: string;
  product: string;
  yield_estimate: number;
  e_factor: number;
  feasibility: string;
  notes: string;
}

interface RetroResult {
  steps: RetroStep[];
  total_steps: number;
  overall_feasibility: string;
  estimated_total_yield: number;
  key_challenges: string[];
  green_chemistry_score: number;
  reasoning: string;
  hallucination_risk_score: number;
  confidence: number;
  commercial_starting_materials: string[];
  estimated_cost_per_gram: number;
}

const getFeasibilityColor = (f: string) => {
  if (f === "high") return "text-teal-400 bg-teal-400/10 border-teal-400/30";
  if (f === "medium") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
};

const getRiskColor = (score: number) => {
  if (score < 0.3) return "text-teal-400";
  if (score < 0.6) return "text-amber-400";
  return "text-red-400";
};

function StepCard({ step, index }: { step: RetroStep; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-white/8 bg-white/3 overflow-hidden"
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
          {step.step_number}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-slate-200">{step.reaction_type}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{step.starting_material} → {step.product}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getFeasibilityColor(step.feasibility)}`}>{step.feasibility}</span>
          <span className="text-xs text-slate-400 font-mono">{step.yield_estimate}% yield</span>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/6">
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Reagents</div>
              <div className="flex flex-wrap gap-1">
                {step.reagents.map((r, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">{r}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Conditions</div>
              <div className="text-xs text-slate-300 font-mono bg-white/4 px-3 py-2 rounded-lg">{step.conditions}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">E-Factor</div>
              <div className={`text-sm font-mono font-bold ${step.e_factor < 5 ? "text-teal-400" : step.e_factor < 15 ? "text-amber-400" : "text-red-400"}`}>{step.e_factor}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Notes</div>
              <div className="text-xs text-slate-400">{step.notes}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function AIRetrosynthesisPage() {
  const [smiles, setSmiles] = useState("");
  const [indication, setIndication] = useState("");
  const [pathwayId, setPathwayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RetroResult | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!smiles.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(`${API}/ai/generate`, {
        smiles: smiles.trim(),
        target_indication: indication,
        pathway_id: pathwayId || null
      });
      setResult(res.data.result);
    } catch (e: any) {
      setError(e.response?.data?.detail || "AI retrosynthesis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
          <Brain size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">AI Retrosynthesis</h1>
          <p className="text-sm text-slate-400">GPT-4o powered synthesis pathway generation</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Zap size={12} className="text-purple-400" />
          <span className="text-xs text-purple-400 font-medium">Powered by GPT-4o</span>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-5 rounded-xl bg-white/4 border border-white/8 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Target Molecule (SMILES)</label>
            <input
              value={smiles}
              onChange={e => setSmiles(e.target.value)}
              placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
              className="w-full px-3 py-2.5 rounded-lg bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Therapeutic Indication (optional)</label>
            <input
              value={indication}
              onChange={e => setIndication(e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Pain Relief"
              className="w-full px-3 py-2.5 rounded-lg bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1.5 block">Link to Pathway ID (optional — auto-creates retrosynthesis log)</label>
          <input
            value={pathwayId}
            onChange={e => setPathwayId(e.target.value)}
            placeholder="Pathway UUID"
            className="w-full px-3 py-2.5 rounded-lg bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading || !smiles.trim()}
          className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating with GPT-4o...</>
          ) : (
            <><Brain size={16} />Generate Retrosynthesis Pathway</>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className="text-2xl font-bold text-purple-400 font-mono">{result.total_steps}</div>
              <div className="text-xs text-slate-400 mt-1">Synthesis Steps</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className="text-2xl font-bold text-teal-400 font-mono">{result.estimated_total_yield}%</div>
              <div className="text-xs text-slate-400 mt-1">Est. Total Yield</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className={`text-2xl font-bold font-mono ${getRiskColor(result.hallucination_risk_score)}`}>{(result.hallucination_risk_score * 100).toFixed(0)}%</div>
              <div className="text-xs text-slate-400 mt-1">Hallucination Risk</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className="text-2xl font-bold text-amber-400 font-mono">${result.estimated_cost_per_gram}</div>
              <div className="text-xs text-slate-400 mt-1">Est. Cost/gram</div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-purple-400" />
              <span className="text-sm font-medium text-purple-300">AI Reasoning</span>
              <span className="ml-auto text-xs text-slate-400">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
          </div>

          {/* Synthesis Steps */}
          <h3 className="text-sm font-medium text-slate-300 mb-3">Synthesis Pathway ({result.total_steps} steps)</h3>
          <div className="space-y-3 mb-6">
            {result.steps.map((step, i) => <StepCard key={i} step={step} index={i} />)}
          </div>

          {/* Key Challenges + Starting Materials */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-xl bg-white/4 border border-white/8">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" /> Key Challenges
              </h3>
              <div className="space-y-2">
                {result.key_challenges.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-xl bg-white/4 border border-white/8">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-teal-400" /> Commercial Starting Materials
              </h3>
              <div className="space-y-2">
                {result.commercial_starting_materials.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    {m}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/8">
                <span className="text-xs text-slate-500">Green Chemistry Score: </span>
                <span className="text-xs font-bold text-teal-400">{result.green_chemistry_score}/10</span>
              </div>
            </div>
          </div>

          {/* Risk warning */}
          {result.hallucination_risk_score > 0.5 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-400">High Hallucination Risk Detected</div>
                <div className="text-xs text-slate-400 mt-1">This pathway has a hallucination risk score of {(result.hallucination_risk_score * 100).toFixed(0)}%. Human expert validation is mandatory before proceeding to lab testing. This pathway cannot be exported without a verified human signature.</div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Brain size={48} className="text-slate-600 mb-4" />
          <div className="text-slate-400 text-sm">Enter a SMILES string to generate an AI-powered retrosynthesis pathway</div>
          <div className="text-slate-500 text-xs mt-2">GPT-4o will propose a complete multi-step synthesis route with reagents, conditions, and yield estimates</div>
        </div>
      )}
    </motion.div>
  );
}
