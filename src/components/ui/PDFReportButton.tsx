import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface PDFReportButtonProps {
  pathwayId: string;
  variant?: 'button' | 'icon';
  className?: string;
}

export default function PDFReportButton({ pathwayId, variant = 'button', className = '' }: PDFReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://pharma-pathway-ai-production.up.railway.app/api/reports/pathway/${pathwayId}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pathway_id: pathwayId, include_admet: true, include_retrosynthesis: true, include_pricing: true }) }
      );

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRPOIS_Pathway_${pathwayId.slice(0, 8)}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={downloadReport}
        disabled={loading}
        title="Download PDF Report"
        className={`p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-50 ${className}`}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
      </button>
    );
  }

  return (
    <button
      onClick={downloadReport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-white/12 text-slate-300 hover:text-white hover:bg-white/4 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <><Loader2 size={14} className="animate-spin" /> Generating PDF...</>
      ) : (
        <><FileDown size={14} /> Export PDF Report</>
      )}
    </button>
  );
}