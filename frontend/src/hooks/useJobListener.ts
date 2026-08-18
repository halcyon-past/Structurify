import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface JobState {
  status: "queued" | "processing" | "processing_chunks" | "completed" | "failed" | "cancelled";
  download_url?: string;
  processed_rows?: number;
  duration_seconds?: number;
  error_message?: string;
  total_chunks?: number;
  completed_chunks?: number;
  is_preview?: boolean;
  preview_data?: Record<string, unknown>[];
  preview_columns?: string[];
  file_path?: string;
  target_schema?: Record<string, unknown>;
  file_name?: string;
  email?: string;
  role?: string;
  plan?: string;
  user_id?: string;
}

export function useJobListener(activeJobId: string | null) {
  const [jobState, setJobState] = useState<JobState | null>(null);

  useEffect(() => {
    if (!activeJobId) {
      setJobState(null);
      return;
    }

    const jobRef = doc(db, "jobs", activeJobId);
    const unsubscribe = onSnapshot(jobRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as JobState;
        setJobState(data);
      }
    });

    return () => unsubscribe();
  }, [activeJobId]);

  return jobState;
}
