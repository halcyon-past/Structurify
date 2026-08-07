"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, File, Plus, Trash2, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type FieldType = "String" | "Integer" | "Float" | "Boolean" | "Date";

interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
}

interface JobState {
  status: "queued" | "processing" | "completed" | "failed";
  download_url?: string;
  processed_rows?: number;
  duration_seconds?: number;
  error_message?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([
    { name: "id", type: "Integer", required: true },
    { name: "name", type: "String", required: true }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (!activeJobId) return;

    // Listen to Firestore document for real-time updates
    const jobRef = doc(db, "jobs", activeJobId);
    const unsubscribe = onSnapshot(jobRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as JobState;
        setJobState(data);
      }
    });

    return () => unsubscribe();
  }, [activeJobId]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.csv') || selectedFile.name.match(/\.xlsx?$/)) {
      setFile(selectedFile);
    } else {
      alert("Only CSV and XLSX files are supported.");
    }
  };

  const addField = () => {
    setSchemaFields([...schemaFields, { name: "", type: "String", required: false }]);
  };

  const removeField = (index: number) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    const newFields = [...schemaFields];
    newFields[index] = { ...newFields[index], [key]: value };
    setSchemaFields(newFields);
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file.");
    if (schemaFields.length === 0) return alert("Schema cannot be empty.");
    
    // Validate schema
    const targetSchema: Record<string, string> = {};
    for (const field of schemaFields) {
      if (!field.name.trim()) return alert("Field names cannot be empty.");
      targetSchema[field.name] = field.type;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setJobState(null);
    setActiveJobId(null);

    try {
      // 1. Get Presigned URL
      const urlRes = await fetch(`${BACKEND_URL}/api/v1/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type || "text/csv" })
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, file_path } = await urlRes.json();

      // 2. Upload to GCS using XMLHttpRequest for progress tracking
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
      const jobRes = await fetch(`${BACKEND_URL}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path,
          file_name: file.name,
          target_schema: targetSchema
        })
      });
      if (!jobRes.ok) throw new Error("Failed to queue job");
      const { job_id } = await jobRes.json();
      
      setActiveJobId(job_id);
    } catch (error: any) {
      alert(error.message || "An error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="mb-8 border-b pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-xl"><File size={28} /></span>
            Structurify
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Heterogeneous Schema Compiler & ETL Pipeline</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Upload & Status */}
          <section className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold mb-4">1. Upload Source File</h2>
              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelection(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                {file ? (
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium text-gray-700">Drag & drop your messy spreadsheet here</p>
                    <p className="text-sm text-gray-500 mt-1">Supports .CSV, .XLSX</p>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Uploading to GCS...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Status Dashboard */}
            {activeJobId && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold mb-4">Job Status Pipeline</h2>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${jobState?.status === 'failed' ? 'bg-red-100 text-red-600' : jobState?.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {jobState?.status === 'completed' ? <CheckCircle size={24} /> : 
                       jobState?.status === 'failed' ? <AlertCircle size={24} /> : 
                       <Loader2 size={24} className="animate-spin" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 capitalize">{jobState?.status || 'Queued'}</p>
                      <p className="text-sm text-gray-500 text-xs font-mono">ID: {activeJobId}</p>
                    </div>
                  </div>

                  {jobState?.status === 'completed' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Processed Rows</p>
                          <p className="font-bold text-lg">{jobState.processed_rows}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Processing Time</p>
                          <p className="font-bold text-lg">{jobState.duration_seconds}s</p>
                        </div>
                      </div>
                      {jobState.download_url && (
                        <a 
                          href={jobState.download_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          <Download size={20} />
                          Download Clean XLSX
                        </a>
                      )}
                    </div>
                  )}

                  {jobState?.status === 'failed' && (
                    <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm overflow-auto">
                      <p className="font-semibold mb-1">Error:</p>
                      <p>{jobState.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Schema Builder */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">2. Define Target Schema</h2>
              <button 
                onClick={addField}
                className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <Plus size={16} /> Add Field
              </button>
            </div>
            
            <div className="flex-grow overflow-auto">
              {schemaFields.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No fields defined.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {schemaFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 group">
                      <input 
                        type="text" 
                        value={field.name}
                        onChange={(e) => updateField(idx, 'name', e.target.value)}
                        placeholder="Field Name"
                        className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select 
                        value={field.type}
                        onChange={(e) => updateField(idx, 'type', e.target.value)}
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="String">String</option>
                        <option value="Integer">Integer</option>
                        <option value="Float">Float</option>
                        <option value="Boolean">Boolean</option>
                        <option value="Date">Date</option>
                      </select>
                      <label className="flex items-center gap-1 text-sm text-gray-600">
                        <input 
                          type="checkbox" 
                          checked={field.required}
                          onChange={(e) => updateField(idx, 'required', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Req
                      </label>
                      <button 
                        onClick={() => removeField(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={handleSubmit}
                disabled={isUploading || schemaFields.length === 0 || !file}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isUploading ? "Processing..." : "Compile Heterogeneous Data"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
