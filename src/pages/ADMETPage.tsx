import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, XCircle, FlaskConical } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import axios from "axios";

const API = "http://localhost:8000/api";

interface ADMETData {
  absorption: { score: number; oral_bioavailability: string; caco2_permeability: string; pgp_substrate: string; hia: number };
  distribution: { score: number; vd: number; bbb_penetration: string; plasma_protein_binding: string; logd: number };
  metabolism: { score: number; cyp1a2_inhibitor: boolean; cyp2c9_inhibitor: boolean; cyp2d6_inhibitor: boolean; cyp3a4_inhibitor: boolean; half_life_hours: number };
  excretion: { score: number; renal_clearance: string; total_clearance: number; route: string };
  toxicity: {
    herg_cardiotoxicity: { risk: string; score: number };
    ames_mutagenicity: { risk: string; score: number };
    hepatotoxicity: { risk: string; score: number };
    overall_toxicity_score: number;
  };
  overall_admet_score: number;
  qed_score: number;
  drug_likeness: string;
  radar_data: { metric: string; value: number; fullMark: number }[];
}

const getRiskColor = (risk: string) => {
  if (risk === "Low" || risk === "Non-mutagenic") return "text-teal-400 bg-teal-400/10 border-teal-400/30";
  if (risk === "Medium" || risk === "Potentially mutagenic") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
};

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-teal-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-mono font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
    </div>
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${score}%`,
          background: score >= 70 ? "#0d9488" : score >= 40 ? "#f59e0b" : "#ef4444"
        }}
      />
    </div>
  </div>
);

const CYPBadge = ({ name, inhibitor }: { name: string; inhibitor: boolean }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${inhibitor ? "bg-amber-400/10 border-amber-400/30 text-amber-400" : "bg-teal-400/10 border-teal-400/30 text-teal-400"}`}>
    <span className="font-mono">{name}</span>
    <span>{inhibitor ? "Inhibitor" : "Non-inhibitor"}</span>
  </div>
);

export default function ADMETPage() {
  const [smiles, setSmiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ADMETData | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!smiles.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post(`${API}/admet/predict`, { smiles: smiles.trim(), molecule_id: "" });
      setResult(res.data.admet);
    } catch (e: any) {
      setError(e.response?.data?.detail || "ADMET analysis failed. Check your SMILES string.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
          <Activity size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">ADMET Prediction</h1>
          <p className="text-sm text-slate-400">Full clinical pharmacokinetic and toxicity analysis</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-6">
        <input
          value={smiles}
          onChange={e => setSmiles(e.target.value)}
          onKeyDown={e => e.key === "Enter" && analyze()}
          placeholder="Enter SMILES string... e.g. CC(=O)Oc1ccccc1C(=O)O"
          className="flex-1 px-4 py-3 rounded-xl bg-white/4 border border-white/12 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/6"
        />
        <button
          onClick={analyze}
          disabled={loading || !smiles.trim()}
          className="px-6 py-3 rounded-xl font-medium text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
        >
          {loading ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</span>
          ) : "Run ADMET"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <XCircle size={16} />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {/* Overall score banner */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className={`text-3xl font-bold font-mono mb-1 ${getScoreColor(result.overall_admet_score)}`}>{result.overall_admet_score.toFixed(1)}</div>
              <div className="text-xs text-slate-400">Overall ADMET Score</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className={`text-3xl font-bold font-mono mb-1 ${getScoreColor(result.qed_score)}`}>{result.qed_score.toFixed(1)}</div>
              <div className="text-xs text-slate-400">Drug-likeness (QED)</div>
            </div>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <div className={`text-2xl font-bold mb-1 ${result.drug_likeness === "Excellent" ? "text-teal-400" : result.drug_likeness === "Good" ? "text-purple-400" : "text-amber-400"}`}>{result.drug_likeness}</div>
              <div className="text-xs text-slate-400">Drug-likeness Rating</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Radar Chart */}
            <div className="p-5 rounded-xl bg-white/4 border border-white/8">
              <h3 className="text-sm font-medium text-slate-300 mb-4">ADMET Radar Profile</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={result.radar_data}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Radar name="ADMET" dataKey="value" stroke="#a855f7" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* ADME Scores */}
            <div className="p-5 rounded-xl bg-white/4 border border-white/8">
              <h3 className="text-sm font-medium text-slate-300 mb-4">ADME Breakdown</h3>
              <ScoreBar label={`Absorption — ${result.absorption.oral_bioavailability} oral bioavailability`} score={result.absorption.score} />
              <ScoreBar label={`Distribution — BBB: ${result.distribution.bbb_penetration}`} score={result.distribution.score} />
              <ScoreBar label={`Metabolism — t½ ${result.metabolism.half_life_hours}h`} score={result.metabolism.score} />
              <ScoreBar label={`Excretion — ${result.excretion.route} route`} score={result.excretion.score} />
              <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-500">VD:</span> <span className="text-slate-300 font-mono">{result.distribution.vd} L/kg</span></div>
                <div><span className="text-slate-500">PPB:</span> <span className="text-slate-300 font-mono">{result.distribution.plasma_protein_binding}</span></div>
                <div><span className="text-slate-500">HIA:</span> <span className="text-slate-300 font-mono">{result.absorption.hia.toFixed(1)}%</span></div>
                <div><span className="text-slate-500">LogD:</span> <span className="text-slate-300 font-mono">{result.distribution.logd}</span></div>
              </div>
            </div>
          </div>

          {/* Toxicity Panel */}
          <div className="p-5 rounded-xl bg-white/4 border border-white/8 mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" /> Toxicity Assessment
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "hERG Cardiotoxicity", ...result.toxicity.herg_cardiotoxicity },
                { label: "Ames Mutagenicity", risk: result.toxicity.ames_mutagenicity.risk, score: result.toxicity.ames_mutagenicity.score },
                { label: "Hepatotoxicity", ...result.toxicity.hepatotoxicity }
              ].map(t => (
                <div key={t.label} className="p-4 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-xs text-slate-400 mb-2">{t.label}</div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRiskColor(t.risk)}`}>{t.risk}</span>
                  <div className={`text-2xl font-bold font-mono mt-2 ${getScoreColor(t.score)}`}>{t.score}</div>
                  <div className="text-xs text-slate-500">Safety score</div>
                </div>
              ))}
            </div>
          </div>

          {/* CYP Inhibition */}
          <div className="p-5 rounded-xl bg-white/4 border border-white/8">
            <h3 className="text-sm font-medium text-slate-300 mb-4">CYP Enzyme Inhibition Profile</h3>
            <div className="grid grid-cols-5 gap-3">
              <CYPBadge name="CYP1A2" inhibitor={result.metabolism.cyp1a2_inhibitor} />
              <CYPBadge name="CYP2C9" inhibitor={result.metabolism.cyp2c9_inhibitor} />
              <CYPBadge name="CYP2C19" inhibitor={false} />
              <CYPBadge name="CYP2D6" inhibitor={result.metabolism.cyp2d6_inhibitor} />
              <CYPBadge name="CYP3A4" inhibitor={result.metabolism.cyp3a4_inhibitor} />
            </div>
          </div>
        </motion.div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical size={48} className="text-slate-600 mb-4" />
          <div className="text-slate-400 text-sm">Enter a SMILES string to run full ADMET prediction</div>
          <div className="text-slate-500 text-xs mt-2">Try: CC(=O)Oc1ccccc1C(=O)O (Aspirin)</div>
        </div>
      )}
    </motion.div>
  );
}
