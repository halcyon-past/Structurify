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
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-6xl p-8 z-10 relative">
        <header className="mb-12 border-b border-white/10 pb-8 pt-8 flex flex-col items-center text-center">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-glow mb-6 backdrop-blur-xl flex items-center justify-center">
            <Image src="/logo.svg" alt="Structurify Logo" width={48} height={48} priority />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
            Structurify
          </h1>
          <p className="text-gray-400 text-xl font-medium max-w-2xl">
            AI-Powered Heterogeneous Schema Compiler & ETL Pipeline
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="flex flex-col gap-6">
            <UploadZone 
              file={file} 
              onFileSelect={setFile} 
              isUploading={isUploading} 
              uploadProgress={uploadProgress} 
            />
          </section>

          <section>
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
      </div>
      <footer className="mt-12 mb-8 text-center text-sm text-gray-500 z-10">
        Created by <a href="https://www.aritro.cloud" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:text-accent-400 transition-colors hover:underline font-medium">Aritro Saha</a>
      </footer>
    </main>
  );
}
