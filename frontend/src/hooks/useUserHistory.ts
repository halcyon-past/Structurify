import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { JobState } from "./useJobListener";

export interface HistoryJob extends JobState {
  job_id: string;
  created_at: string;
  updated_at?: string;
  file_name: string;
  target_schema: Record<string, string>;
  role?: string;
  plan?: string;
  email?: string;
  ip_address?: string;
  columns_metadata?: {
    global_description: string;
    columns: Array<{
      name: string;
      type: string;
      null_count: number;
      distinct_count: number;
      description: string;
    }>;
  };
}

export function useUserHistory(userId: string | undefined) {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const jobsRef = collection(db, "jobs");
        const q = query(jobsRef, where("user_id", "==", userId));
        const snapshot = await getDocs(q);
        
        const fetchedJobs: HistoryJob[] = [];
        snapshot.forEach((doc) => {
          fetchedJobs.push({ job_id: doc.id, ...doc.data() } as HistoryJob);
        });

        // Sort locally by created_at (descending) to avoid requiring a composite index
        fetchedJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setJobs(fetchedJobs);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const cancelJob = async (jobId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST'
      });
      setJobs(prev => prev.map(job => job.job_id === jobId ? { ...job, status: "cancelled" } : job));
    } catch (e) {
      console.error("Failed to cancel job", e);
    }
  };

  return { jobs, loading, cancelJob };
}
