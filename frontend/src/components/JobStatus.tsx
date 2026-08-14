"use client";

import { CheckCircle, AlertCircle, Loader2, Download, XCircle } from "lucide-react";
import { JobState } from "@/hooks/useJobListener";
import { useState } from "react";

interface JobStatusProps {
  jobId: string;
  jobState: JobState | null;
}

export function JobStatus({ jobId, jobState }: JobStatusProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST'
      });
      if (!res.ok) {
        console.error("Failed to cancel job");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const isProcessing = jobState?.status === 'queued' || jobState?.status === 'processing' || !jobState?.status;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-8 relative overflow-hidden group mt-6">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-blue-500 opacity-50"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span className="bg-accent-500/20 text-accent-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">
            <Loader2 size={16} className={isProcessing ? "animate-spin" : ""} />
          </span>
          Job Status Pipeline
        </h2>
        
        {isProcessing && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Cancel Job
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className={`p-3 rounded-xl relative ${
            jobState?.status === 'failed' || jobState?.status === 'cancelled' ? 'bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 
            jobState?.status === 'completed' ? 'bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 
            'bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
          }`}>
            {jobState?.status === 'completed' ? <CheckCircle size={28} data-testid="status-completed" /> : 
             (jobState?.status === 'failed' || jobState?.status === 'cancelled') ? <AlertCircle size={28} data-testid="status-failed" /> : 
             <Loader2 size={28} className="animate-spin" data-testid="status-loading" />}
          </div>
          <div>
            <p className="font-bold text-lg text-gray-100 capitalize" data-testid="status-text">{jobState?.status || 'Queued'}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {jobId}</p>
          </div>
        </div>

        {jobState?.status === 'completed' && (
          <div className="mt-2 p-5 bg-black/30 rounded-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-5">
              <div className="bg-white/5 px-4 py-3 rounded-xl flex-1 mr-3 border border-white/5 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Processed Rows</p>
                <p className="font-bold text-2xl text-accent-400">{jobState.processed_rows}</p>
              </div>
              <div className="bg-white/5 px-4 py-3 rounded-xl flex-1 ml-3 border border-white/5 text-center">
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Processing Time</p>
                <p className="font-bold text-2xl text-blue-400">{jobState.duration_seconds}s</p>
              </div>
            </div>
            {jobState.download_url && (
              <a 
                href={jobState.download_url} 
                target="_blank" 
                rel="noreferrer"
                className="group relative flex items-center justify-center gap-2 w-full overflow-hidden rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 py-3.5 px-4 font-bold transition-all duration-300 border border-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              >
                <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                Download Clean Dataset
              </a>
            )}
          </div>
        )}

        {(jobState?.status === 'failed' || jobState?.status === 'cancelled') && (
          <div className="mt-2 p-5 bg-red-500/5 text-red-300 rounded-2xl border border-red-500/20 text-sm overflow-auto animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 font-semibold text-red-400">
              <AlertCircle size={16} />
              <span>Pipeline Error Details</span>
            </div>
            <p className="font-mono bg-red-950/30 p-3 rounded-lg border border-red-500/10">{jobState.error_message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
