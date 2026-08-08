import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAndSubmitJob = async (file: File, targetSchema: Record<string, string>, email?: string): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get Presigned URL
      const urlRes = await fetch(`${BACKEND_URL}/api/v1/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type || "text/csv" })
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, file_path } = await urlRes.json();

      // 2. Upload to GCS
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);
        xhr.setRequestHeader("Content-Type", file.type || "text/csv");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("GCS Upload failed"));
        };
        xhr.onerror = () => reject(new Error("GCS Upload failed"));
        xhr.send(file);
      });

      // 3. Submit Job
      const payload: Record<string, unknown> = {
        file_path,
        file_name: file.name,
        target_schema: targetSchema
      };
      if (email) payload.email = email;

      const jobRes = await fetch(`${BACKEND_URL}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!jobRes.ok) throw new Error("Failed to queue job");
      const { job_id } = await jobRes.json();
      
      return job_id;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAndSubmitJob, isUploading, uploadProgress };
}
