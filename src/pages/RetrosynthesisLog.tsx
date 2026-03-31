import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/AppCard';
import AppBadge from '@/components/ui/AppBadge';
import AppButton from '@/components/ui/AppButton';
import AppSkeleton from '@/components/ui/AppSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/AppModal';
import PDFReportButton from '@/components/ui/PDFReportButton';
import { getRetrosynthesisLogs } from '@/services/supabase';
import { validateLog } from '@/services/api';
import { useToast } from '@/hooks/useAppToast';
import type { RetrosynthesisLog as RetroLog } from '@/types';

const pageMotion = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

function riskColor(score: number) {
  if (score < 0.3) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Low' };
  if (score < 0.6) return { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Medium' };
  return { bg: 'bg-red-500', text: 'text-red-400', label: 'High' };
}

function riskTextColor(score: number) {
  if (score < 0.3) return '#4ade80';
  if (score < 0.6) return '#fbbf24';
  return '#f87171';
}

export default function RetrosynthesisLogPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<RetroLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalLog, setModalLog] = useState<RetroLog | null>(null);
  const [notes, setNotes] = useState('');
  const [validating, setValidating] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try { setLogs(await getRetrosynthesisLogs()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = logs.filter((l) => !l.human_validated).length;

  const handleValidate = async () => {
    if (!modalLog || notes.length < 10) return;
    setValidating(true);
    try {
      await validateLog(modalLog.log_id, notes);
      toast.success('Validation confirmed');
      setModalLog(null);
      setNotes('');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div {...pageMotion} className="space-y-6">

      {/* Warning banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl p-4 bg-[rgba(245,158,11,0.1)] border border-amber-500/30">
          <AlertTriangle className="text-amber-400 flex-shrink-0" size={20} />
          <p className="text-amber-200 text-sm">
            {pendingCount} pathway(s) require human validation before they can be exported to lab testing
          </p>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <AppSkeleton key={i} height="40px" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No retrosynthesis logs"
            subtitle="Logs will appear when pathways are analyzed by AI models"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Log ID', 'Pathway', 'AI Model', 'Risk Score', 'Threshold', 'Status', 'Report', 'Actions'].map((h) => (
                    <th key={h} className="text-[var(--text-muted)] uppercase text-[11px] font-medium text-left py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const risk = riskColor(log.hallucination_risk_score);
                  return (
                    <tr key={log.log_id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)]">

                      {/* Log ID */}
                      <td className="py-2 px-3 font-mono text-xs text-[var(--text-muted)]">
                        {log.log_id.slice(0, 8)}
                      </td>

                      {/* Pathway ID */}
                      <td className="py-2 px-3 font-mono text-xs text-[var(--purple-light)]">
                        {log.pathway_id.slice(0, 8)}
                      </td>

                      {/* AI Model */}
                      <td className="py-2 px-3">
                        <span className="text-[var(--text-primary)] font-medium text-xs">
                          {log.ai_model?.model_name || '—'}
                        </span>
                        {log.ai_model?.version && (
                          <AppBadge variant="gray" className="ml-1">{log.ai_model.version}</AppBadge>
                        )}
                      </td>

                      {/* Risk Score */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
                            <div
                              className={`h-full rounded-full ${risk.bg}`}
                              style={{ width: `${log.hallucination_risk_score * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${risk.text}`}>
                            {log.hallucination_risk_score.toFixed(2)}
                          </span>
                          <span className={`text-xs ${risk.text}`}>
                            {risk.label}
                          </span>
                        </div>
                      </td>

                      {/* Threshold */}
                      <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                        {log.risk_threshold.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        {log.human_validated ? (
                          <AppBadge variant="success">
                            <CheckCircle size={10} className="mr-1" />Validated
                          </AppBadge>
                        ) : (
                          <AppBadge variant="warning">Pending Review</AppBadge>
                        )}
                      </td>

                      {/* PDF Report */}
                      <td className="py-2 px-3">
                        <PDFReportButton pathwayId={log.pathway_id} variant="icon" />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3">
                        <AppButton
                          variant="secondary"
                          size="sm"
                          disabled={log.human_validated}
                          onClick={() => { setModalLog(log); setNotes(''); }}
                          style={!log.human_validated
                            ? { borderColor: 'var(--teal)', color: 'var(--teal-light)' }
                            : {}
                          }
                        >
                          Validate
                        </AppButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Validation Modal */}
      <Modal open={!!modalLog} onClose={() => setModalLog(null)} title="Human Validation Sign-off">
        {modalLog && (
          <div className="space-y-4">
            <p className="text-[var(--text-muted)] text-xs font-mono">
              Pathway: {modalLog.pathway_id}
            </p>

            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold"
                style={{ color: riskTextColor(modalLog.hallucination_risk_score) }}
              >
                {modalLog.hallucination_risk_score.toFixed(2)}
              </span>
              <span className="text-[var(--text-muted)] text-sm">Hallucination Risk Score</span>
            </div>

            {modalLog.hallucination_risk_score > modalLog.risk_threshold && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={12} />
                  This pathway exceeds the risk threshold of {modalLog.risk_threshold.toFixed(2)}
                </p>
              </div>
            )}

            <div>
              <label className="text-[var(--text-secondary)] text-xs font-medium block mb-1.5">
                Validation Notes (min 10 characters)
              </label>
              <textarea
                className="input-field min-h-[80px] resize-none w-full"
                placeholder="Describe your validation findings and confirm the pathway is safe to proceed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {notes.length > 0 && notes.length < 10 && (
                <p className="text-red-400 text-xs mt-1">
                  {10 - notes.length} more characters required
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <AppButton
                variant="ghost"
                onClick={() => setModalLog(null)}
                className="flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                loading={validating}
                disabled={notes.length < 10}
                onClick={handleValidate}
                icon={<Shield size={14} />}
                className="flex-1"
              >
                Confirm Validation
              </AppButton>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}