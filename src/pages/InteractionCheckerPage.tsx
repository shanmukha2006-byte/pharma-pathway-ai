import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

const API = "http://localhost:8000/api";

interface Interaction {
  type: string;
  description: string;
  severity: string;
  recommendation: string;
}

interface InteractionPair {
  molecule_a: string;
  molecule_b: string;
  overall_severity: string;
  interactions: Interaction[];
  interaction_count: number;
}

interface InteractionResult {
  molecules_analyzed: number;
  interaction_pairs_found: number;
  overall_safety_assessment: string;
  warnings: string[];
  interactions: InteractionPair[];
  recommendation: string;
}

const getSeverityStyle = (severity: string) => {
  if (severity === "High") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (severity === "Medium") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  if (severity === "Low") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return "text-teal-400 bg-teal-400/10 border-teal-400/30";
};

const getSafetyIcon = (assessment: string) => {
  if (assessment === "Safe") return <CheckCircle size={20} className="text-teal-400" />;
  if (assessment.includes("High")) return <XCircle size={20} className="text-red-400" />;
  return <AlertTriangle size={20} className="text-amber-400" />;
};

export default function InteractionCheckerPage() {
  const [molecules, setMolecules] = useState([
    { smiles: "", name: "" },
    { smiles: "", name: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [error, setError] = useState("");

  const addMolecule = () => {
    if (molecules.length < 10) setMolecules([...molecules, { smiles: "", name: "" }]);
  };

  const removeMolecule = (i: number) => {
    if (molecules.length > 2) setMolecules(molecules.filter((_, idx) => idx !== i));
  };

  const updateMolecule = (i: number, field: "smiles" | "name", value: string) => {
    const updated = [...molecules];
    updated[i][field] = value;
    setMolecules(updated);
  };

  const checkInteractions = async () => {
    const valid = molecules.filter(m => m.smiles.trim());
    if (valid.length < 2) { setError("Enter at least 2 SMILES strings."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await axios.post(`${API}/interactions/check`, {
        smiles_list: valid.map(m => m.smiles.trim()),
        molecule_names: valid.map(m => m.name.trim() || m.smiles.trim().substring(0, 15))
      });
      setResult(res.data.result);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Interaction check failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <ShieldAlert size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Drug Interaction Checker</h1>
          <p className="text-sm text-slate-400">Analyze potential interactions between 2–10 compounds</p>
        </div>
      </div>

      {/* Molecule inputs */}
      <div className="p-5 rounded-xl bg-white/4 border border-white/8 mb-6">
        <div className="space-y-3 mb-4">
          {molecules.map((mol, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400 flex-shrink-0">{i + 1}</div>
              <input
                value={mol.smiles}
                onChange={e => updateMolecule(i, "smiles", e.target.value)}
                placeholder={`SMILES string for molecule ${i + 1}`}
                className="flex-1 px-3 py-2 rounded-lg bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-purple-500/50"
              />
              <input
                value={mol.name}
                onChange={e => updateMolecule(i, "name", e.target.value)}
                placeholder="Drug name (optional)"
                className="w-40 px-3 py-2 rounded-lg bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500/50"
              />
              {molecules.length > 2 && (
                <button onClick={() => removeMolecule(i)} className="p-2 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={addMolecule} disabled={molecules.length >= 10} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/12 text-slate-400 hover:text-slate-200 hover:bg-white/4 text-xs transition-colors disabled:opacity-40">
            <Plus size={12} /> Add Molecule
          </button>
          <button
            onClick={checkInteractions}
            disabled={loading}
            className="flex-1 py-2 rounded-lg font-medium text-sm text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : <><ShieldAlert size={14} />Check Interactions</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Safety banner */}
          <div className={`p-5 rounded-xl border mb-6 flex items-start gap-4 ${result.overall_safety_assessment === "Safe" ? "bg-teal-400/8 border-teal-400/25" : result.overall_safety_assessment.includes("High") ? "bg-red-500/8 border-red-500/25" : "bg-amber-400/8 border-amber-400/25"}`}>
            {getSafetyIcon(result.overall_safety_assessment)}
            <div>
              <div className="font-medium text-slate-200">{result.overall_safety_assessment}</div>
              <div className="text-sm text-slate-400 mt-1">{result.recommendation}</div>
              <div className="text-xs text-slate-500 mt-1">{result.molecules_analyzed} molecules analyzed — {result.interaction_pairs_found} interaction pair(s) found</div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mb-6 space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-sm text-red-400">
                  <XCircle size={14} className="flex-shrink-0" />{w}
                </div>
              ))}
            </div>
          )}

          {/* Interaction pairs */}
          {result.interactions.length === 0 ? (
            <div className="p-8 rounded-xl bg-teal-400/5 border border-teal-400/20 text-center">
              <CheckCircle size={32} className="text-teal-400 mx-auto mb-3" />
              <div className="text-slate-300 font-medium">No significant interactions detected</div>
              <div className="text-xs text-slate-500 mt-1">These compounds appear safe to use in combination based on structural analysis</div>
            </div>
          ) : (
            <div className="space-y-4">
              {result.interactions.map((pair, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-white/6">
                    <span className="text-sm font-medium text-slate-200">{pair.molecule_a}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-sm font-medium text-slate-200">{pair.molecule_b}</span>
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full border font-medium ${getSeverityStyle(pair.overall_severity)}`}>{pair.overall_severity} Risk</span>
                    <span className="text-xs text-slate-500">{pair.interaction_count} interaction{pair.interaction_count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {pair.interactions.map((inter, j) => (
                      <div key={j} className="p-3 rounded-lg bg-white/3 border border-white/6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getSeverityStyle(inter.severity)}`}>{inter.severity}</span>
                          <span className="text-xs font-medium text-slate-300">{inter.type}</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-1">{inter.description}</div>
                        <div className="text-xs text-teal-400">→ {inter.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert size={48} className="text-slate-600 mb-4" />
          <div className="text-slate-400 text-sm">Enter at least 2 SMILES strings to check for drug-drug interactions</div>
        </div>
      )}
    </motion.div>
  );
}