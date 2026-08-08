"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobListener } from "@/hooks/useJobListener";
import { ArrowLeft, Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const jobState = useJobListener(jobId);

  // Fallback Polling (in case Firebase onSnapshot is blocked)
  const [fallbackData, setFallbackData] = useState<Record<string, unknown> | null>(null);
  
  useEffect(() => {
    if (jobState?.status === "completed" || jobState?.status === "failed") return;
    
    // Periodically hit the backend just to be safe
    const interval = setInterval(async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setFallbackData(data);
        }
      } catch (_) {
        // ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId, jobState?.status]);

  const currentState = jobState || fallbackData;
  const status = currentState?.status || "queued";

  const totalChunks = currentState?.total_chunks || 0;
  const completedChunks = currentState?.completed_chunks || 0;
  const progressPercent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  return (
    <main className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center overflow-hidden p-6">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-2xl z-10 relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-blue-500 opacity-70"></div>
        
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group w-max"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <header className="mb-10 text-center flex flex-col items-center">
          <div className={`p-4 rounded-full mb-6 border relative ${
            status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
            status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
            'bg-accent-500/10 text-accent-400 border-accent-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
          }`}>
            {status === 'completed' ? <CheckCircle size={40} /> :
             status === 'failed' ? <AlertCircle size={40} /> :
             <RefreshCw size={40} className="animate-spin" />}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-100 mb-2 capitalize">
            {status.replace("_", " ")}
          </h1>
          <p className="text-sm font-mono text-gray-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            ID: {jobId}
          </p>
        </header>

        {(status === "processing" || status === "processing_chunks" || status === "queued") && (
          <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-gray-300">
                {status === "processing_chunks" ? "Processing Batches..." : "Initializing Pipeline..."}
              </span>
              <span className="text-xl font-bold text-accent-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-accent-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {totalChunks > 0 && (
              <p className="text-center text-xs text-gray-500 mt-3 font-mono">
                {completedChunks} / {totalChunks} chunks mapped
              </p>
            )}
          </div>
        )}

        {status === "completed" && currentState?.download_url && (
          <div className="mt-8 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex gap-4 mb-2">
              <div className="bg-black/30 p-4 rounded-2xl flex-1 border border-white/5 text-center">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Processed Rows</p>
                <p className="text-2xl font-bold text-accent-400">{currentState.processed_rows || "N/A"}</p>
              </div>
            </div>
            
            <a 
              href={currentState.download_url} 
              target="_blank" 
              rel="noreferrer"
              className="group relative flex items-center justify-center gap-2 w-full overflow-hidden rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 py-4 px-4 font-bold transition-all duration-300 border border-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]"
            >
              <Download size={22} className="group-hover:-translate-y-1 transition-transform" />
              Download Clean Dataset
            </a>
          </div>
        )}

        {status === "failed" && (
          <div className="mt-8 p-6 bg-red-500/10 text-red-300 rounded-2xl border border-red-500/20 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle size={18} /> Error Details
            </h3>
            <p className="font-mono text-sm bg-red-950/40 p-4 rounded-xl border border-red-500/10 break-words">
              {currentState?.error_message || "Unknown error occurred"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
