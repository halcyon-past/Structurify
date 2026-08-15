"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadZone } from "@/components/UploadZone";
import { SchemaBuilder, SchemaField } from "@/components/SchemaBuilder";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([
    { name: "id", type: "Integer", required: true },
    { name: "name", type: "String", required: true }
  ]);
  
  const [email, setEmail] = useState("");
  
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);
  
  const { uploadAndSubmitJob, isUploading, uploadProgress } = useFileUpload();

  const router = useRouter();

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file.");
    
    const targetSchema: Record<string, string> = {};
    for (const field of schemaFields) {
      if (!field.name.trim()) return alert("Field names cannot be empty.");
      targetSchema[field.name] = field.type;
    }

    try {
      const jobId = await uploadAndSubmitJob(file, targetSchema, email, user?.uid);
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
      <div className="w-full max-w-7xl h-full flex flex-col p-4 md:p-6 lg:p-8 z-10 relative">
        {/* Compact Header */}
        <header className="flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/5 p-2 rounded-xl border border-white/10 shadow-sm backdrop-blur-xl flex items-center justify-center">
              <Image src="/logo.svg" alt="Structurify Logo" width={32} height={32} priority />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white/90">
              Structurify
            </h1>
          </div>
          <p className="text-gray-400 text-sm font-medium">
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
