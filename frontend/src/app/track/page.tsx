"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useJobListener, JobState } from "@/hooks/useJobListener";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, Cpu, Sparkles, FileCheck2, Loader2, XCircle } from "lucide-react";

const STEPS = [
  { id: 'queued', title: 'Job Queued', description: 'File uploaded and waiting in queue', icon: UploadCloud },
  { id: 'processing', title: 'Initializing Pipeline', description: 'Reading file and preparing batches', icon: Cpu },
  { id: 'processing_chunks', title: 'AI Transformation', description: 'Extracting and cleaning data with AI', icon: Sparkles },
  { id: 'completed', title: 'Ready for Download', description: 'Your structured dataset is ready', icon: FileCheck2 },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId") || "";
  const jobState = useJobListener(jobId);

  // Fallback Polling (in case Firebase onSnapshot is blocked)
  const [fallbackData, setFallbackData] = useState<JobState | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleProcessJob = async () => {
    if (!currentState?.file_path || !currentState?.file_name) return;
    
    try {
      setIsProcessing(true);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const payload = {
        file_path: currentState.file_path,
        file_name: currentState.file_name,
        target_schema: currentState.target_schema || {},
        email: currentState.email || "",
        role: currentState.role || "guest",
        plan: currentState.plan || "free",
        user_id: currentState.user_id || "",
        is_preview: false
      };
      
      const res = await fetch(`${BACKEND_URL}/api/v1/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/track?jobId=${data.job_id}`);
      } else {
        alert("Failed to start full job.");
      }
    } catch (e) {
      console.error(e);
      alert("Error starting job.");
    } finally {
      setIsProcessing(false);
    }
  };
  
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
  
  useEffect(() => {
    if (jobState?.status === "completed" || jobState?.status === "failed") return;
    
    const interval = setInterval(async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${BACKEND_URL}/api/v1/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setFallbackData(data);
        }
      } catch {
        // ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId, jobState?.status]);

  const currentState = jobState || fallbackData;
  const status = String(currentState?.status || "queued");
  const isPreview = searchParams.get("preview") === "true" || !!currentState?.is_preview;
  
  const totalChunks = Number(currentState?.total_chunks) || 0;
  const completedChunks = Number(currentState?.completed_chunks) || 0;
  const progressPercent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  // Determine current step index
  let currentStepIndex = 0;
  if (status === 'processing') currentStepIndex = 1;
  else if (status === 'processing_chunks') currentStepIndex = 2;
  else if (status === 'completed') currentStepIndex = 3;
  else if (status === 'failed') {
    // If it failed, we keep the index at wherever it was (approx)
    if (progressPercent > 0) currentStepIndex = 2;
    else currentStepIndex = 1;
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center overflow-hidden p-6">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-2xl z-10 relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-blue-500 opacity-70"></div>
        
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group w-max"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <header className="mb-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-100">
              Job Status Pipeline
            </h1>
            {isPreview && (
              <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                PREVIEW
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-gray-400 mb-4">
            Tracking ID: <span className="text-gray-300">{jobId}</span>
          </p>
          {(status === 'queued' || status === 'processing' || status === 'processing_chunks') && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors text-sm font-bold disabled:opacity-50"
            >
              {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Cancel Job
            </button>
          )}
        </header>

        {/* TIMELINE OR PREVIEW TABLE */}
        {isPreview ? (
          <div className="relative mb-12">
            {status !== 'completed' && status !== 'failed' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in">
                <Loader2 className="animate-spin text-accent-500" size={48} />
                <p className="text-gray-400 font-medium text-lg">Fetching Data Preview...</p>
                <p className="text-sm text-gray-500">Extracting raw rows from your uploaded file</p>
              </div>
            )}
            {status === 'failed' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-red-400 animate-in fade-in bg-red-950/20 rounded-xl border border-red-500/20">
                <AlertCircle size={48} />
                <p className="font-bold">Preview generation failed</p>
                <p className="text-sm opacity-80 max-w-md text-center">{currentState?.error_message}</p>
              </div>
            )}
            {status === 'completed' && currentState?.preview_data && (
              <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#f9fafb] text-gray-800 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                <table className="w-full text-sm text-left border-collapse font-mono">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b-2 border-gray-300">
                    <tr>
                      {(currentState.preview_columns || Object.keys(currentState.preview_data[0] || {})).map(key => (
                        <th key={key} className="px-4 py-2 border-r border-gray-300 font-bold tracking-wider whitespace-nowrap last:border-r-0">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentState.preview_data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-200 last:border-0 hover:bg-blue-50 transition-colors">
                        {(currentState.preview_columns || Object.keys(row)).map((colName, j) => {
                          const val = row[colName];
                          return (
                            <td key={j} className="px-4 py-2 border-r border-gray-200 max-w-[300px] truncate last:border-r-0">
                              {val !== null && val !== undefined ? String(val) : <span className="text-gray-400 italic">null</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="relative mb-12">
            {/* Vertical Connecting Line */}
            <div className="absolute left-[27px] top-4 bottom-8 w-0.5 bg-white/5"></div>
            
            <div className="flex flex-col gap-8">
              {STEPS.map((step, index) => {
                const isCompleted = currentStepIndex > index || status === 'completed';
                const isActive = currentStepIndex === index && status !== 'failed' && status !== 'completed';
                const isFailedAtThisStep = status === 'failed' && currentStepIndex === index;
                const Icon = step.icon;

                return (
                  <div key={step.id} className={`relative flex gap-6 items-start ${isActive ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-40'}`}>
                    {/* Status Node */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                          : isFailedAtThisStep
                          ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                          : isActive
                          ? 'bg-accent-500/20 border-accent-500/50 text-accent-400 shadow-[0_0_30px_rgba(139,92,246,0.4)]'
                          : 'bg-black/40 border-white/10 text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={24} /> : isFailedAtThisStep ? <AlertCircle size={24} /> : <Icon size={24} className={isActive ? 'animate-pulse' : ''} />}
                      </div>
                      {/* Active Pulsating Ring */}
                      {isActive && (
                        <div className="absolute inset-0 border-2 border-accent-500/50 rounded-2xl animate-ping opacity-20 pointer-events-none"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow pt-2">
                      <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-gray-200' : isFailedAtThisStep ? 'text-red-400' : isActive ? 'text-accent-400' : 'text-gray-500'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-400">{step.description}</p>

                      {/* Progress Bar for active chunks step */}
                      {isActive && step.id === 'processing_chunks' && (
                        <div className="mt-4 bg-black/30 p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mapping Batches</span>
                            <span className="text-sm font-bold text-accent-400">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-black/50 rounded-full h-2 border border-white/5 overflow-hidden mb-2">
                            <div 
                              className="bg-gradient-to-r from-accent-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <p className="text-right text-xs text-gray-500 font-mono">
                            {completedChunks} / {totalChunks} chunks mapped
                          </p>
                        </div>
                      )}

                      {/* Error details */}
                      {isFailedAtThisStep && (
                        <div className="mt-4 p-4 bg-red-950/40 text-red-300 rounded-xl border border-red-500/20 animate-in fade-in">
                          <p className="font-mono text-xs break-words">
                            {String(currentState?.error_message || "Unknown error occurred during processing.")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPLETION AREA */}
        {status === "completed" && (!!currentState?.download_url || isPreview) && (
          <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="bg-black/30 p-4 rounded-2xl flex-1 border border-white/5 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Rows Processed</p>
                <p className="text-3xl font-bold text-accent-400">{Number(currentState?.processed_rows) || "N/A"}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl flex-1 border border-white/5 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Total Time</p>
                <p className="text-3xl font-bold text-blue-400">{Number(currentState?.duration_seconds) || "N/A"}s</p>
              </div>
            </div>
            
            {!isPreview && (
              <a 
                href={String(currentState?.download_url)} 
                target="_blank" 
                rel="noreferrer"
                className="group relative flex items-center justify-center gap-2 w-full overflow-hidden rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 py-4 px-4 font-bold transition-all duration-300 border border-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] active:scale-[0.98] mb-4"
              >
                <Download size={22} className="group-hover:-translate-y-1 transition-transform" />
                Download Clean Dataset
              </a>
            )}
            
            {isPreview && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleProcessJob}
                  disabled={isProcessing}
                  className="group relative flex items-center justify-center gap-2 w-full overflow-hidden rounded-xl bg-accent-500 hover:bg-accent-600 text-white py-4 px-4 font-bold transition-all duration-300 border border-accent-400 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                  {isProcessing ? (
                    <><Loader2 size={22} className="animate-spin" /> Starting Job...</>
                  ) : (
                    <><Sparkles size={22} className="group-hover:scale-110 transition-transform" /> Process Job</>
                  )}
                </button>
                <button 
                  onClick={() => router.push("/")}
                  className="group relative flex items-center justify-center gap-2 w-full overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 py-4 px-4 font-bold transition-all duration-300 border border-white/10 active:scale-[0.98]"
                >
                  <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-white"><RefreshCw className="animate-spin text-accent-500" size={32} /></div>}>
      <TrackContent />
    </Suspense>
  );
}
