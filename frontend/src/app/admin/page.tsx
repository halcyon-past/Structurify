"use client";

import toast from "react-hot-toast";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useAdminData, AdminJob, SystemSettings } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { 
  Users, Activity, Database, CheckCircle2, 
  Clock, XCircle, ShieldAlert, RefreshCw, 
  Zap, BarChart3, Info, Skull, Server, Terminal
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "users" | "deployments" | "settings">("dashboard");
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [depServiceFilter, setDepServiceFilter] = useState<string>("all");
  const [depStatusFilter, setDepStatusFilter] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { users, jobs, auditLogs, deployments, settings, loading, updateUserRole, updateUserPlan, cancelJob, saveSystemSettings } = useAdminData();
  const { userData } = useAuth();
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    if (!loading && settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [loading, settings, localSettings]);

  const executeKillSwitch = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/kill-switch`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to engage kill switch");
      toast.success(`Kill switch engaged. System purged: ${data.message || "Success"}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: unknown) {
      console.error(e);
      toast.error((e as Error).message || "Failed to engage kill switch.");
    }
  };

  const killSwitch = async () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-bold text-red-600 text-sm mb-1">CRITICAL WARNING</p>
          <p className="text-xs text-gray-700">This will immediately purge ALL active queues and forcefully terminate all running processing jobs across the entire system. Are you absolutely sure?</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              await executeKillSwitch();
            }}
          >
            Confirm Purge
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '400px' } });
  };

  useEffect(() => {
    // Update current time every second for live duration calculations
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] pt-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-transparent border-b-cyan-500 rounded-full animate-spin absolute inset-0 mix-blend-screen" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === "pro" || u.plan === "max").length;
  const activeJobs = jobs.filter(j => j.status === "queued" || j.status === "processing");
  const failedJobs = jobs.filter(j => j.status === "failed").length;
  
  const totalTokensUsed = jobs.reduce((acc, job) => acc + (job.total_tokens || 0), 0);
  const totalRowsProcessed = jobs.reduce((acc, job) => acc + (job.processed_rows || 0), 0);
  const successRate = jobs.length > 0 ? Math.round(((jobs.length - failedJobs) / jobs.length) * 100) : 100;

  const successfulJobs = jobs.filter(j => j.status === "completed" && j.processed_rows && j.processed_rows > 0);
  let totalSuccessfulTime = 0;
  let totalSuccessfulRows = 0;
  successfulJobs.forEach(j => {
    const start = new Date(j.created_at).getTime();
    const end = new Date(j.updated_at || j.created_at).getTime();
    totalSuccessfulTime += (end - start) / 1000;
    totalSuccessfulRows += j.processed_rows || 0;
  });
  const avgTimePerRow = totalSuccessfulRows > 0 ? (totalSuccessfulTime / totalSuccessfulRows) : 0;
  const formattedAvgTime = avgTimePerRow > 0 ? `${avgTimePerRow.toFixed(2)}s` : "N/A";

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const calculateDuration = (job: AdminJob) => {
    const start = new Date(job.created_at).getTime();
    let end = currentTime;
    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      end = job.updated_at ? new Date(job.updated_at).getTime() : start;
    }
    
    const diff = Math.max(0, end - start);
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-white font-sans selection:bg-emerald-500/30 relative">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4 tracking-wider uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                Command Center
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Platform Admin
              </h1>
              <p className="text-gray-400 mt-3 text-lg max-w-xl">
                Real-time oversight of global infrastructure, AI processing streams, and user subscriptions.
              </p>
              <div className="mt-6">
                <button 
                  onClick={killSwitch}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-black tracking-widest uppercase text-white bg-red-600 hover:bg-red-500 border border-red-400/50 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 active:translate-y-0"
                  title="Purge all queues and abort active jobs"
                >
                  <Skull className="w-5 h-5 animate-pulse" />
                  ENGAGE KILL SWITCH
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-2xl overflow-x-auto max-w-full">
              <button 
                onClick={() => window.location.reload()}
                className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Force Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              {(["dashboard", "jobs", "users", "deployments", "settings"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab 
                      ? "bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                <MetricCard 
                  icon={<Users className="w-6 h-6"/>} 
                  title="Total Users" 
                  value={formatNumber(totalUsers)} 
                  sub={`${proUsers} Active Subscriptions`}
                  gradient="from-blue-500/20 to-cyan-500/5"
                  iconColor="text-cyan-400"
                />
                <MetricCard 
                  icon={<Zap className="w-6 h-6"/>} 
                  title="Active Streams" 
                  value={formatNumber(activeJobs.length)} 
                  sub="Jobs currently processing"
                  gradient="from-amber-500/20 to-orange-500/5"
                  iconColor="text-amber-400"
                />
                <MetricCard 
                  icon={<Database className="w-6 h-6"/>} 
                  title="Rows Extracted" 
                  value={formatNumber(totalRowsProcessed)} 
                  sub="Global lifetime rows"
                  gradient="from-purple-500/20 to-pink-500/5"
                  iconColor="text-purple-400"
                />
                <MetricCard 
                  icon={<BarChart3 className="w-6 h-6"/>} 
                  title="Tokens Burned" 
                  value={formatNumber(totalTokensUsed)} 
                  sub="Gemini LLM inference"
                  gradient="from-emerald-500/20 to-teal-500/5"
                  iconColor="text-emerald-400"
                />
                <MetricCard 
                  icon={<Clock className="w-6 h-6"/>} 
                  title="Avg Speed" 
                  value={formattedAvgTime} 
                  sub="Time per successful row"
                  gradient="from-indigo-500/20 to-blue-500/5"
                  iconColor="text-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                      <Activity className="w-6 h-6 text-emerald-400"/> 
                      Platform Health
                    </h3>
                    
                    <div className="relative z-10 space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-sm font-medium text-gray-400">Success Rate</span>
                          <span className="text-3xl font-black text-emerald-400">{successRate}%</span>
                        </div>
                        <div className="w-full bg-black/50 rounded-full h-3 border border-white/5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full relative" 
                            style={{ width: `${successRate}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Failed Jobs</div>
                          <div className="text-xl font-bold text-red-400">{formatNumber(failedJobs)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Jobs</div>
                          <div className="text-xl font-bold text-gray-200">{formatNumber(jobs.length)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                      <Server className="w-5 h-5 text-indigo-400"/> 
                      Latest Deployments
                    </h3>
                    <div className="space-y-3">
                      {["frontend", "backend", "worker"].map(service => {
                        const dep = deployments?.find(d => d.service === service);
                        if (!dep) return null;
                        
                        // Handle Firestore Timestamp vs string
                        let dateString = "Unknown Date";
                        if (dep.timestamp) {
                          const ts = dep.timestamp as { toDate?: () => Date } | string;
                          if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function') {
                            dateString = ts.toDate().toLocaleString();
                          } else {
                            dateString = new Date(ts as string).toLocaleString();
                          }
                        }

                        return (
                          <a 
                            key={service} 
                            href={dep.log_url || "#"} 
                            target={dep.log_url ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className={`flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 transition-colors ${dep.log_url ? 'hover:bg-white/5 cursor-pointer' : ''}`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold capitalize text-gray-200">{service}</div>
                                <div className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-white/10 text-gray-400">
                                  By {dep.actor}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-1">
                                {dep.commit.substring(0, 7)} • {dateString}
                              </div>
                            </div>
                            <div className={`p-1.5 rounded-lg ${dep.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {dep.status === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                            </div>
                          </a>
                        );
                      })}
                      {deployments?.length === 0 && <div className="text-xs text-gray-500 text-center py-2">No deployments recorded yet</div>}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col h-full min-h-0">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3 shrink-0">
                    <Clock className="w-6 h-6 text-blue-400"/> 
                    Live System Feed
                  </h3>
                  <div className="flex-1 relative min-h-0">
                    <div className="absolute inset-0 overflow-y-auto pr-4 custom-scrollbar space-y-3">
                    {auditLogs.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">No recent activity found.</div>
                    ) : (
                      auditLogs.slice(0, 50).map((log, i) => (
                        <div 
                          key={log.id} 
                          className="flex flex-col gap-3 p-4 bg-black/40 hover:bg-black/60 rounded-2xl border border-white/5 transition-all group"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl ${
                                log.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                                log.status === "failed" ? "bg-red-500/10 text-red-400" :
                                "bg-gray-500/10 text-gray-400"
                              }`}>
                                {log.status === "success" ? <CheckCircle2 className="w-5 h-5"/> : 
                                 log.status === "failed" ? <XCircle className="w-5 h-5"/> : 
                                 <Activity className="w-5 h-5"/>}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                                  {log.action.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">Job: {log.job_id.split('-')[0]}...</div>
                              </div>
                            </div>
                            
                            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 text-xs">
                              <span className="text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">{log.user_id.substring(0, 8)}</span>
                              <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          {(log.error_message || log.file_name || log.cloud_run_revision) && (
                            <div className="pl-14 pr-2">
                              <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {log.error_message && (
                                  <div className="col-span-1 sm:col-span-2 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                    <div className="text-[10px] uppercase tracking-wider text-red-500/70 font-bold mb-1">Error Reason</div>
                                    <div className="text-sm text-red-400 font-mono break-words">{log.error_message}</div>
                                  </div>
                                )}
                                {log.file_name && (
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">File Processed</div>
                                    <div className="text-xs text-gray-300 font-mono truncate" title={log.file_name}>{log.file_name}</div>
                                  </div>
                                )}
                                {log.cloud_run_revision && (
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Worker Revision</div>
                                    <div className="text-xs text-gray-300 font-mono">{log.cloud_run_revision.split('-').pop()}</div>
                                  </div>
                                )}
                                {log.total_tokens !== undefined && (
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Tokens Used</div>
                                    <div className="text-xs text-emerald-400 font-mono">{log.total_tokens.toLocaleString()}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-2 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Target File</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">State</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Time Taken</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => {
                      const rawPercentage = job.total_chunks ? Math.round(((job.completed_chunks || 0) / job.total_chunks) * 100) : 0;
                      const progressPercentage = Math.min(100, rawPercentage); // clamp at 100%
                      
                      return (
                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedJob(job)}>
                          <td className="p-5">
                            <div className="text-sm font-bold text-gray-200 group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                              <Database className="w-4 h-4 text-gray-500" />
                              {job.file_name}
                            </div>
                            <div className="text-xs text-gray-600 font-mono mt-1.5">{job.email || job.id.substring(0,8)}</div>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                              job.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              job.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              job.status === "cancelled" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                              "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                            }`}>
                              {job.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5"/> : 
                               job.status === "failed" ? <XCircle className="w-3.5 h-3.5"/> : 
                               job.status === "cancelled" ? <XCircle className="w-3.5 h-3.5"/> : 
                               <Activity className="w-3.5 h-3.5 animate-spin"/>}
                              {job.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-5">
                            {job.total_chunks ? (
                              <div className="flex items-center gap-3 w-32">
                                <div className="flex-1 bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                                  <div 
                                    className={`h-full rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono text-gray-400">
                                  {progressPercentage}%
                                </span>
                              </div>
                            ) : <span className="text-xs text-gray-600 font-mono">N/A</span>}
                          </td>
                          <td className="p-5 text-sm text-gray-300 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              {calculateDuration(job)}
                            </div>
                          </td>
                          <td className="p-5 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-all"
                            >
                              <Info className="w-3.5 h-3.5" />
                              Details
                            </button>
                            {(job.status === "queued" || job.status === "processing" || job.status === "processing_chunks") && (
                              <button
                                onClick={() => cancelJob(job.id)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 px-3 py-2 rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Kill
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-16 text-center">
                          <Database className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                          <div className="text-gray-400 text-lg font-medium">No processing jobs active</div>
                          <div className="text-gray-600 text-sm mt-1">The global queue is completely empty.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-2 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User Identity</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">System Role</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Tier / Plan</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const canChangeRole = userData?.role === "owner" && u.role !== "owner";
                      const canChangePlan = userData?.role === "owner" || userData?.role === "admin";
                      
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                          <td className="p-5">
                            <div className="text-sm font-bold text-gray-200 group-hover:text-emerald-300 transition-colors flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 font-bold">
                                {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <div>{u.name || "Anonymous User"}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-sm text-gray-400 font-mono">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Legacy"}
                          </td>
                          <td className="p-5">
                            <select 
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              disabled={!canChangeRole}
                              className="bg-black/60 border border-white/10 rounded-xl text-sm font-medium text-gray-200 px-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 cursor-pointer hover:bg-white/5 transition-colors relative"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 10px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              {u.role === "owner" && <option value="owner">Owner (Root)</option>}
                            </select>
                          </td>
                          <td className="p-5">
                            <select 
                              value={u.plan}
                              onChange={(e) => updateUserPlan(u.id, e.target.value)}
                              disabled={!canChangePlan}
                              className={`border rounded-xl text-sm font-bold px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 cursor-pointer transition-colors ${
                                u.plan === 'max' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' :
                                u.plan === 'pro' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' :
                                'bg-black/60 border-white/10 text-gray-300 hover:bg-white/5'
                              }`}
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 10px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
                            >
                              <option value="free">Free Tier</option>
                              <option value="pro">Pro Plan</option>
                              <option value="max">Max Plan</option>
                            </select>
                          </td>
                          <td className="p-5 text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "deployments" && (
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-6 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-indigo-400" />
                  Deployment History
                </h3>
                <div className="flex gap-4">
                  <select 
                    value={depServiceFilter}
                    onChange={(e) => setDepServiceFilter(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-xl text-sm font-medium text-gray-200 px-4 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Services</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="worker">Worker</option>
                  </select>
                  <select 
                    value={depStatusFilter}
                    onChange={(e) => setDepStatusFilter(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-xl text-sm font-medium text-gray-200 px-4 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Service</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Commit</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actor</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Timestamp</th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments?.filter(d => 
                      (depServiceFilter === "all" || d.service === depServiceFilter) &&
                      (depStatusFilter === "all" || d.status === depStatusFilter)
                    ).map((dep, i) => {
                      let dateString = "Unknown Date";
                      if (dep.timestamp) {
                        const ts = dep.timestamp as { toDate?: () => Date } | string;
                        if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function') {
                          dateString = ts.toDate().toLocaleString();
                        } else {
                          dateString = new Date(ts as string).toLocaleString();
                        }
                      }
                      
                      return (
                        <tr key={dep.id || i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="p-4 font-mono text-sm">
                            <div className="flex items-center gap-2">
                              {dep.service === "frontend" && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>}
                              {dep.service === "backend" && <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>}
                              {dep.service === "worker" && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>}
                              <span className="text-gray-300 font-bold capitalize">{dep.service}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              dep.status === "success" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {dep.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-sm text-gray-400">
                            {dep.commit}
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {dep.actor}
                          </td>
                          <td className="p-4 text-right text-sm font-mono text-gray-400">
                            {dateString}
                          </td>
                          <td className="p-4 text-right">
                            {dep.log_url ? (
                              <a 
                                href={dep.log_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-wider"
                              >
                                View Logs
                              </a>
                            ) : (
                              <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">No Logs</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {(!deployments || deployments.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                          No deployment history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

                    {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Server className="w-6 h-6 text-purple-400"/> 
                    System Configuration
                  </h3>
                  <button 
                    onClick={async () => {
                      if (localSettings) {
                        await saveSystemSettings(localSettings);
                        toast.success("Settings and Prompts have been saved and applied dynamically!");
                      }
                    }}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    Save Changes
                  </button>
                </div>
                
                {localSettings ? (
                  <div className="space-y-8 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Gemini LLM Model</label>
                        <p className="text-sm text-gray-500 mb-2">Select the underlying Gemini model used by the ETL worker for data transformation.</p>
                        <select 
                          value={localSettings.llm_model || 'gemini-3.6-flash'}
                          onChange={(e) => setLocalSettings({...localSettings, llm_model: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended)</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy/Working)</option>
                          <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Fast/Cost Efficient)</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Complex Reasoning)</option>
                          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Ultra Fast)</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Max Rows Per Chunk</label>
                        <p className="text-sm text-gray-500 mb-2">The absolute maximum number of rows a worker will send to Gemini in a single prompt.</p>
                        <input 
                          type="number"
                          value={localSettings.max_rows_per_chunk || 500}
                          onChange={(e) => setLocalSettings({...localSettings, max_rows_per_chunk: parseInt(e.target.value) || 500})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Target Cells Per Chunk</label>
                        <p className="text-sm text-gray-500 mb-2">Target cell threshold (rows × columns). Used to dynamically scale down chunk size for wide CSVs.</p>
                        <input 
                          type="number"
                          value={localSettings.target_cells_per_chunk || 5000}
                          onChange={(e) => setLocalSettings({...localSettings, target_cells_per_chunk: parseInt(e.target.value) || 5000})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <hr className="border-white/10" />
                    
                    <h4 className="text-lg font-bold text-white mb-4">Prompt Management</h4>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Auto-Clean System Prompt</label>
                        <textarea 
                          rows={6}
                          value={localSettings.prompt_auto_clean_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_auto_clean_system: e.target.value})}
                          placeholder="You are a strict data transformation engine..."
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Auto-Clean User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_auto_clean_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_auto_clean_user: e.target.value})}
                          placeholder="Clean the following CSV data... 

{chunk_data}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Schema Map System Prompt</label>
                        <textarea 
                          rows={6}
                          value={localSettings.prompt_schema_map_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_schema_map_system: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Schema Map User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_schema_map_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_schema_map_user: e.target.value})}
                          placeholder="Map the following CSV data... 

{chunk_data}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Metadata System Prompt</label>
                        <textarea 
                          rows={4}
                          value={localSettings.prompt_metadata_system || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_metadata_system: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Metadata User Prompt</label>
                        <textarea 
                          rows={2}
                          value={localSettings.prompt_metadata_user || ''}
                          onChange={(e) => setLocalSettings({...localSettings, prompt_metadata_user: e.target.value})}
                          placeholder="Schema: {schema}
Stats: {stats}"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">Loading settings...</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f1115] border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-400" />
                Job Metadata
              </h2>
              <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar text-sm space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Job ID</div>
                  <div className="font-mono text-gray-200">{selectedJob.id}</div>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">User / IP</div>
                  <div className="text-gray-200">{selectedJob.email || "System"} <span className="text-gray-500 font-mono text-xs ml-2">({selectedJob.ip_address || "unknown"})</span></div>
                </div>
              </div>

              {selectedJob.error_message && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <div className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Fatal Error</div>
                  <div className="font-mono text-red-200 whitespace-pre-wrap">{selectedJob.error_message}</div>
                </div>
              )}

              {selectedJob.target_schema && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Target Schema</div>
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 font-mono text-gray-300 overflow-x-auto">
                    <pre>{JSON.stringify(selectedJob.target_schema, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedJob.columns_metadata && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Column Intelligence (AI Generated)</div>
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-5 text-gray-300">
                    {selectedJob.columns_metadata.global_description && (
                      <div className="mb-4 text-sm text-emerald-400/80 italic border-l-2 border-emerald-500/30 pl-3 py-1">
                        {selectedJob.columns_metadata.global_description}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedJob.columns_metadata.columns?.map((col, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <div className="font-bold text-gray-200 truncate">{col.name || col.column_name}</div>
                              <span className="px-2 py-0.5 bg-black/40 border border-white/5 text-gray-400 rounded-md text-[10px] uppercase tracking-wider font-bold shrink-0">
                                {col.type || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-gray-400 text-xs mb-3 line-clamp-2" title={col.description}>{col.description}</div>
                          </div>
                          <div className="flex gap-2 text-[10px] font-mono text-gray-500 mt-auto">
                            <span className="px-2 py-1 bg-black/40 rounded-md shrink-0">Nulls: {col.null_count}</span>
                            <span className="px-2 py-1 bg-black/40 rounded-md shrink-0">Distinct: {col.distinct_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Timestamps</div>
                  <div className="text-gray-300 space-y-1">
                    <div><span className="text-gray-500">Created:</span> {new Date(selectedJob.created_at).toLocaleString()}</div>
                    {selectedJob.updated_at && <div><span className="text-gray-500">Updated:</span> {new Date(selectedJob.updated_at).toLocaleString()}</div>}
                    <div><span className="text-gray-500">Duration:</span> {calculateDuration(selectedJob)}</div>
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Execution Metrics</div>
                  <div className="text-gray-300 space-y-1">
                    <div><span className="text-gray-500">Tokens:</span> {formatNumber(selectedJob.total_tokens || 0)}</div>
                    <div><span className="text-gray-500">Rows:</span> {formatNumber(selectedJob.processed_rows || 0)}</div>
                    <div><span className="text-gray-500">Chunks:</span> {selectedJob.completed_chunks || 0} / {selectedJob.total_chunks || 0}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  );
}

function MetricCard({ icon, title, value, sub, gradient, iconColor }: { icon: React.ReactNode, title: string, value: string, sub: string, gradient: string, iconColor: string }) {
  return (
    <div className="relative group rounded-3xl p-[1px] overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative h-full bg-black/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-black/60">
        <div className="mb-6">
          <div className={`inline-block p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner ${iconColor}`}>
            {icon}
          </div>
        </div>
        <div>
          <h4 className="text-gray-400 text-sm font-semibold tracking-wide uppercase mb-2">{title}</h4>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{value}</div>
          <div className="text-sm text-gray-500 mt-2 font-medium">{sub}</div>
        </div>
      </div>
    </div>
  );
}
