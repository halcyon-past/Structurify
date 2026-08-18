"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { SchemaBuilder, SchemaField } from "@/components/SchemaBuilder";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  
  const [email, setEmail] = useState("");
  
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);
  
  const { uploadAndSubmitJob, isUploading, uploadProgress } = useFileUpload();

  const router = useRouter();

  const handleSubmit = async (isPreview: boolean = false) => {
    if (!file) return alert("Please select a file.");
    
    const targetSchema: Record<string, string> = {};
    for (const field of schemaFields) {
      if (!field.name.trim()) return alert("Field names cannot be empty.");
      targetSchema[field.name] = field.type;
    }

    try {
      const jobId = await uploadAndSubmitJob(file, targetSchema, email, user?.uid, isPreview);
      router.push(`/track?jobId=${jobId}`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "An error occurred.");
    }
  };

  return (
    <main className="h-screen w-full bg-background text-foreground relative overflow-hidden flex flex-col items-center">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Main Container */}
      <div className="w-full max-w-7xl h-full flex flex-col p-4 pt-20 md:p-6 md:pt-20 lg:p-8 lg:pt-20 z-10 relative">
        {/* Compact Subtitle Header */}
        <header className="flex-shrink-0 flex items-center justify-between mb-4 md:mb-6">
          <p className="text-gray-300 text-sm md:text-base font-medium">
            Transform messy spreadsheets into structured, machine-readable datasets.
          </p>
        </header>

        {/* Content Grid */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-5/12 h-[350px] lg:h-full flex flex-col flex-shrink-0">
            <UploadZone 
              file={file} 
              onFileSelect={setFile} 
              isUploading={isUploading} 
              uploadProgress={uploadProgress} 
            />
          </section>

          <section className="w-full lg:w-7/12 h-full flex flex-col min-h-0">
            <SchemaBuilder 
              fields={schemaFields}
              onChange={setSchemaFields}
              onSubmit={handleSubmit}
              isSubmitting={isUploading}
              isSubmitDisabled={!file}
              email={email}
              onEmailChange={setEmail}
            />
          </section>
        </div>

        {/* Compact Footer */}
        <footer className="flex-shrink-0 mt-6 text-center text-xs text-gray-500">
          Created by <a href="https://www.aritro.cloud" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:text-accent-400 transition-colors hover:underline font-medium">Aritro Saha</a>
        </footer>
      </div>
    </main>
  );
}
