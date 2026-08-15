import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from './useAuth';

export interface AdminJob {
  id: string;
  status: string;
  user_id: string;
  email: string;
  created_at: string;
  file_name: string;
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
}

export const useAdminData = () => {
  const [users, setUsers] = useState<(UserData & { id: string })[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Users Realtime Listener
    const qUsers = query(collection(db, "users"), orderBy("created_at", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData & { id: string }));
      setUsers(usersData);
    });

    // Jobs Realtime Listener (limit to 100 for performance)
    const qJobs = query(collection(db, "jobs"), orderBy("created_at", "desc"), limit(100));
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminJob));
      setJobs(jobsData);
    });

    // Audit Logs Realtime Listener (limit to 500)
    const qAudit = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(500));
    const unsubAudit = onSnapshot(qAudit, (snapshot) => {
      const auditData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setAuditLogs(auditData);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubJobs();
      unsubAudit();
    };
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    await updateDoc(doc(db, "users", userId), { plan: newPlan });
  };

  const cancelJob = async (jobId: string) => {
    // Call the backend API instead of raw firestore to trigger the full abort
    await fetch(`https://structurify-worker-592450361494.us-central1.run.app/api/jobs/${jobId}/cancel`, {
      method: 'POST'
    });
  };

  return { users, jobs, auditLogs, loading, updateUserRole, updateUserPlan, cancelJob };
};
