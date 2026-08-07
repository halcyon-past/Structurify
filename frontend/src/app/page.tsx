"use client";

import { useState } from "react";
import { File } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { JobStatus } from "@/components/JobStatus";
import { SchemaBuilder, SchemaField } from "@/components/SchemaBuilder";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useJobListener } from "@/hooks/useJobListener";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([
    { name: "id", type: "Integer", required: true },
    { name: "name", type: "String", required: true }
  ]);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  
  const { uploadAndSubmitJob, isUploading, uploadProgress } = useFileUpload();
  const jobState = useJobListener(activeJobId);

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file.");
    if (schemaFields.length === 0) return alert("Schema cannot be empty.");
    
    const targetSchema: Record<string, string> = {};
    for (const field of schemaFields) {
      if (!field.name.trim()) return alert("Field names cannot be empty.");
      targetSchema[field.name] = field.type;
    }

    setActiveJobId(null);

    try {
      const jobId = await uploadAndSubmitJob(file, targetSchema);
      setActiveJobId(jobId);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "An error occurred.");
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
          <section className="flex flex-col gap-6">
            <UploadZone 
              file={file} 
              onFileSelect={setFile} 
              isUploading={isUploading} 
              uploadProgress={uploadProgress} 
            />
            {activeJobId && <JobStatus jobId={activeJobId} jobState={jobState} />}
          </section>

          <section>
            <SchemaBuilder 
              fields={schemaFields}
              onChange={setSchemaFields}
              onSubmit={handleSubmit}
              isSubmitting={isUploading}
              isSubmitDisabled={schemaFields.length === 0 || !file}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
