"use client";

import { useState } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useAdminData } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Activity, Database, CheckCircle2, 
  Clock, XCircle, ShieldAlert, RefreshCw, 
  Zap, ChevronRight, BarChart3
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "users">("dashboard");
  const { users, jobs, auditLogs, loading, updateUserRole, updateUserPlan, cancelJob } = useAdminData();
  const { userData } = useAuth();

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

  // Derived Metrics
  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === "pro" || u.plan === "max").length;
  const activeJobs = jobs.filter(j => j.status === "queued" || j.status === "processing");
  const failedJobs = jobs.filter(j => j.status === "failed").length;
  
  // FIXED: Sum total_tokens from jobs instead of audit logs to get true global count including live jobs
  const totalTokensUsed = jobs.reduce((acc, job) => acc + (job.total_tokens || 0), 0);
  const totalRowsProcessed = jobs.reduce((acc, job) => acc + (job.processed_rows || 0), 0);
  const successRate = jobs.length > 0 ? Math.round(((jobs.length - failedJobs) / jobs.length) * 100) : 100;

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-white font-sans selection:bg-emerald-500/30">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Header Section */}
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
            </div>
            
            <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-2xl">
              <button 
                onClick={() => window.location.reload()}
                className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Force Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              {(["dashboard", "jobs", "users"] as const).map((tab) => (
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

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
              </div>

              {/* Lower Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* System Health Panel */}
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
                </div>

                {/* Live Audit Feed */}
                <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col h-[500px]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-400"/> 
                    Live System Feed
                  </h3>
                  <div className="space-y-3 overflow-y-auto pr-4 custom-scrollbar flex-1 relative">
                    {auditLogs.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">No recent activity found.</div>
                    ) : (
                      auditLogs.slice(0, 50).map((log, i) => (
                        <div 
                          key={log.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/40 hover:bg-black/60 rounded-2xl border border-white/5 transition-all group"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
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
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-3xl p-2 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Target File</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User Account</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">State</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Initiated</th>
                      <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="p-5">
                          <div className="text-sm font-bold text-gray-200 group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                            <Database className="w-4 h-4 text-gray-500" />
                            {job.file_name}
                          </div>
                          <div className="text-xs text-gray-600 font-mono mt-1.5">{job.id}</div>
                        </td>
                        <td className="p-5">
                          <div className="text-sm text-gray-300">{job.email || "System/Unknown"}</div>
                          <div className="text-xs text-gray-600 mt-1 font-mono">{job.user_id.substring(0,8)}...</div>
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
                                  style={{ width: `${Math.round(((job.completed_chunks || 0) / job.total_chunks) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-mono text-gray-400">
                                {Math.round(((job.completed_chunks || 0) / job.total_chunks) * 100)}%
                              </span>
                            </div>
                          ) : <span className="text-xs text-gray-600 font-mono">N/A</span>}
                        </td>
                        <td className="p-5 text-sm text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
                        <td className="p-5 text-right">
                          {(job.status === "queued" || job.status === "processing") && (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Kill Job
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-16 text-center">
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

          {/* Users Tab */}
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

        </div>
      </div>
    </AdminProtectedRoute>
  );
}

function MetricCard({ icon, title, value, sub, gradient, iconColor }: { icon: React.ReactNode, title: string, value: string, sub: string, gradient: string, iconColor: string }) {
  return (
    <div className="relative group rounded-3xl p-[1px] overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative h-full bg-black/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-black/60">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner ${iconColor}`}>
            {icon}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
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
