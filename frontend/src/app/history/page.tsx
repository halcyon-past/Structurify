"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserHistory, HistoryJob } from "@/hooks/useUserHistory";
import { FileText, Clock, CheckCircle, AlertCircle, Loader2, ChevronDown, Download, Hash, Info } from "lucide-react";
import Link from "next/link";

function JobCard({ job }: { job: HistoryJob }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { color: "text-green-500", bg: "bg-green-500/10", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]", icon: <CheckCircle size={24} /> };
      case "failed":
      case "cancelled":
        return { color: "text-red-500", bg: "bg-red-500/10", shadow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]", icon: <AlertCircle size={24} /> };
      case "queued":
      case "processing":
      case "processing_chunks":
      default:
        return { color: "text-blue-500", bg: "bg-blue-500/10", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]", icon: <Loader2 size={24} className="animate-spin" /> };
    }
  };

  const config = getStatusConfig(job.status);
  const dateStr = new Date(job.created_at).toLocaleString();

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden group transition-all duration-300 hover:border-white/20 mb-4">
      <div 
        className="p-5 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl relative ${config.bg} ${config.color} ${config.shadow}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-100 flex items-center gap-2">
              {job.file_name}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {job.job_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-300 capitalize">{job.status}</p>
            <p className="text-xs text-gray-500">{dateStr}</p>
          </div>
          <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Info size={16} /> Job Metadata
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-500 uppercase">Role</p>
                <p className="text-sm text-gray-200 capitalize font-medium">{job.role || 'N/A'}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-500 uppercase">Plan</p>
                <p className="text-sm text-gray-200 capitalize font-medium">{job.plan || 'N/A'}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-500 uppercase">Total Chunks</p>
                <p className="text-sm text-gray-200 font-medium">{job.total_chunks || 'N/A'}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-gray-500 uppercase">Last Updated</p>
                <p className="text-sm text-gray-200 font-medium truncate">
                  {job.updated_at ? new Date(job.updated_at).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {job.status === "completed" && (
              <>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <Hash size={20} className="text-accent-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Processed Rows</p>
                    <p className="font-bold text-xl text-gray-100">{job.processed_rows || 0}</p>
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <Clock size={20} className="text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Processing Time</p>
                    <p className="font-bold text-xl text-gray-100">{job.duration_seconds || 0}s</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {(job.status === "failed" || job.status === "cancelled") && job.error_message && (
            <div className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm font-mono">
              <strong>Error:</strong> {job.error_message}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} /> Target Schema
            </p>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-xs text-gray-300 overflow-x-auto">
              <pre>{JSON.stringify(job.target_schema, null, 2)}</pre>
            </div>
          </div>

          {job.download_url && (
            <a 
              href={job.download_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 py-3 rounded-xl font-bold transition-all border border-green-500/20 hover:border-green-500/40"
            >
              <Download size={18} />
              Download Dataset
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { jobs, loading: jobsLoading } = useUserHistory(user?.uid);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-background">
        <Loader2 className="animate-spin text-accent-500" size={32} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-white bg-background p-4 text-center">
        <AlertCircle size={48} className="text-accent-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-gray-400 mb-6">Please log in to view your extraction history.</p>
        <Link href="/" className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full border border-white/20 transition-all font-medium">
          Go back Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pb-20">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-4xl p-6 sm:p-8 z-10 relative mt-8">
        <header className="mb-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              Extraction History
            </h1>
            <p className="text-gray-400 mt-2 font-medium">View and download your past pipeline executions.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-black/40 px-4 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
            {jobs.length} jobs found
          </div>
        </header>

        {jobsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading history...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-300">No jobs found</p>
            <p className="text-sm mt-2 max-w-sm text-center">You haven&apos;t run any extraction pipelines yet. Head back to the home page to start your first job.</p>
            <Link href="/" className="mt-6 bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 px-6 py-2.5 rounded-full border border-accent-500/30 transition-all font-medium">
              Start Extraction
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <JobCard key={job.job_id} job={job} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
