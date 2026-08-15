"use client";

import { useState } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useAdminData } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, Activity, Database, AlertCircle, 
  CheckCircle2, Clock, XCircle, Settings, ShieldAlert, RefreshCw
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "users">("dashboard");
  const { users, jobs, auditLogs, loading, updateUserRole, updateUserPlan, cancelJob } = useAdminData();
  const { userData } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Derived Metrics
  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === "pro" || u.plan === "max").length;
  const activeJobs = jobs.filter(j => j.status === "queued" || j.status === "processing");
  const failedJobs = jobs.filter(j => j.status === "failed").length;
  
  const totalTokensUsed = auditLogs.reduce((acc, log) => acc + (log.total_tokens || 0), 0);
  const totalRowsProcessed = jobs.reduce((acc, job) => acc + (job.processed_rows || 0), 0);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-emerald-400" />
                Admin Portal
              </h1>
              <p className="text-gray-400 mt-2">Manage users, monitor global jobs, and view system metrics.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all backdrop-blur-md"
                title="Force Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
                {(["dashboard", "jobs", "users"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<Users />} title="Total Users" value={formatNumber(totalUsers)} sub={`${proUsers} Paid Users`} />
                <MetricCard icon={<Activity />} title="Active Jobs" value={formatNumber(activeJobs.length)} sub="Currently running" />
                <MetricCard icon={<Database />} title="Rows Processed" value={formatNumber(totalRowsProcessed)} sub="All time" />
                <MetricCard icon={<Settings />} title="Tokens Burned" value={formatNumber(totalTokensUsed)} sub="Across all models" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400"/> Recent Audit Activity</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.slice(0, 20).map(log => (
                      <div key={log.id} className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-200">{log.action}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            log.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}>{log.status}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>User: {log.user_id}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400"/> System Health</h3>
                  <div className="flex flex-col gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Job Success Rate</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {jobs.length > 0 ? Math.round(((jobs.length - failedJobs) / jobs.length) * 100) : 100}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${jobs.length > 0 ? ((jobs.length - failedJobs) / jobs.length) * 100 : 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-sm font-semibold text-gray-300">Job ID / File</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">User Email</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Progress</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Created At</th>
                      <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-200">{job.file_name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[200px]">{job.id}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-400">{job.email || "unknown"}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            job.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            job.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            job.status === "cancelled" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                            "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                          }`}>
                            {job.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5"/> : 
                             job.status === "failed" ? <XCircle className="w-3.5 h-3.5"/> : 
                             job.status === "cancelled" ? <XCircle className="w-3.5 h-3.5"/> : 
                             <Activity className="w-3.5 h-3.5"/>}
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                           {job.total_chunks ? `${Math.round(((job.completed_chunks || 0) / job.total_chunks) * 100)}%` : "-"}
                        </td>
                        <td className="p-4 text-sm text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          {(job.status === "queued" || job.status === "processing") && (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                            >
                              Cancel Job
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">No jobs found in the system.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-sm font-semibold text-gray-300">User / Email</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Joined</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Role</th>
                      <th className="p-4 text-sm font-semibold text-gray-300">Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      // Just allow changes if I am owner, or if I am admin and they are member.
                      const canChangeRole = userData?.role === "owner" && u.role !== "owner";
                      const canChangePlan = userData?.role === "owner" || userData?.role === "admin";
                      
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="text-sm font-medium text-gray-200">{u.name || "Anonymous"}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Unknown"}
                          </td>
                          <td className="p-4">
                            <select 
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              disabled={!canChangeRole}
                              className="bg-black/50 border border-white/10 rounded-lg text-sm text-gray-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              {u.role === "owner" && <option value="owner">Owner</option>}
                            </select>
                          </td>
                          <td className="p-4">
                            <select 
                              value={u.plan}
                              onChange={(e) => updateUserPlan(u.id, e.target.value)}
                              disabled={!canChangePlan}
                              className="bg-black/50 border border-white/10 rounded-lg text-sm text-gray-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="max">Max</option>
                            </select>
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

function MetricCard({ icon, title, value, sub }: { icon: React.ReactNode, title: string, value: string, sub: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
        <div className="text-3xl font-bold text-white mt-1">{value}</div>
        <div className="text-xs text-gray-500 mt-2">{sub}</div>
      </div>
    </div>
  );
}
