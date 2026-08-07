import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface JobState {
  status: "queued" | "processing" | "completed" | "failed";
  download_url?: string;
  processed_rows?: number;
  duration_seconds?: number;
  error_message?: string;
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
