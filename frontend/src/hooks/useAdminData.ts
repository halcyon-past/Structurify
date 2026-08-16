import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, setDoc, doc, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { UserData } from './useAuth';

export interface AdminJob {
  id: string;
  status: string;
  user_id: string;
  email: string;
  created_at: string;
  file_name: string;
  updated_at?: string;
  error_message?: string;
  ip_address?: string;
  target_schema?: Record<string, string>;
  columns_metadata?: {
    global_description?: string;
    columns?: Array<{
      name?: string;
      column_name?: string;
      type?: string;
      null_count?: number;
      distinct_count?: number;
      description?: string;
    }>;
  };
  total_tokens?: number;
  processed_rows?: number;
  total_chunks?: number;
  completed_chunks?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  job_id: string;
  user_id: string;
  timestamp: string;
  status: string;
  duration_seconds?: number;
  total_tokens?: number;
  error_message?: string;
  file_name?: string;
  cloud_run_revision?: string;
}

export interface DeploymentLog {
  id: string; // The service name (frontend, backend, worker)
  service: string;
  status: string;
  commit: string;
  actor: string;
  log_url?: string;
  timestamp: Timestamp | string | { toDate?: () => Date, _seconds?: number };
}

export interface SystemSettings {
  llm_model: string;
  max_rows_per_chunk: number;
  target_cells_per_chunk: number;
  prompt_auto_clean_system?: string;
  prompt_auto_clean_user?: string;
  prompt_schema_map_system?: string;
  prompt_schema_map_user?: string;
  prompt_metadata_system?: string;
  prompt_metadata_user?: string;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<(UserData & { id: string })[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deployments, setDeployments] = useState<DeploymentLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    llm_model: "gemini-3.6-flash",
    max_rows_per_chunk: 500,
    target_cells_per_chunk: 5000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Users Realtime Listener
    const qUsers = query(collection(db, "users"), orderBy("created_at", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData & { id: string }));
      setUsers(usersData);
    });

    // Settings Realtime Listener
    const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() as SystemSettings }));
      }
    });

    // Jobs Realtime Listener (limit to 100 for performance)
    const qJobs = query(collection(db, "jobs"), orderBy("created_at", "desc"), limit(100));
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminJob));
      setJobs(jobsData);
    });

    // Audit Logs Realtime Listener (limit to 500)
    const qAudit = query(collection(db, "job_audits"), limit(500));
    const unsubAudit = onSnapshot(qAudit, (snapshot) => {
      const auditData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          action: data.status === 'processing' ? 'started' : (data.status || 'unknown'),
          job_id: doc.id,
          user_id: data.user_id || 'guest',
          timestamp: data.completed_at || data.started_at || data.created_at || new Date().toISOString(),
          status: data.status || 'unknown',
          duration_seconds: data.job_runtime_seconds,
          total_tokens: data.total_tokens,
          error_message: data.error_message,
          file_name: data.file_name,
          cloud_run_revision: data.cloud_run_revision
        } as AuditLog;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(auditData);
    }, (error) => {
      console.error("Audit Logs Error:", error);
      setAuditLogs([{ 
        id: 'error', 
        action: `ERROR: ${error.message}`, 
        job_id: 'err-123', 
        user_id: 'system', 
        timestamp: new Date().toISOString(), 
        status: 'failed' 
      } as AuditLog]);
    });

    // Deployments Realtime Listener
    const qDeployments = query(collection(db, "deployments"), orderBy("timestamp", "desc"), limit(200));
    const unsubDeployments = onSnapshot(qDeployments, (snapshot) => {
      const depData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeploymentLog));
      setDeployments(depData);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubSettings();
      unsubJobs();
      unsubAudit();
      unsubDeployments();
    };
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    await updateDoc(doc(db, "users", userId), { plan: newPlan });
  };

  const cancelJob = async (jobId: string) => {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const updateSystemSetting = async (key: keyof SystemSettings, value: string | number) => {
    await setDoc(doc(db, "settings", "system"), { [key]: value }, { merge: true });
  };

  const saveSystemSettings = async (newSettings: SystemSettings) => {
    await setDoc(doc(db, "settings", "system"), newSettings, { merge: true });
  };

  return { users, jobs, auditLogs, deployments, settings, loading, updateUserRole, updateUserPlan, cancelJob, updateSystemSetting, saveSystemSettings };
};
