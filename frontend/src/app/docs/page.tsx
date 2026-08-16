"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Loader2, Edit3, Save, X, Eye } from "lucide-react";
import mermaid from "mermaid";
import { useRef } from "react";

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    if (ref.current) {
      const id = 'mermaid-svg-' + Math.random().toString(36).substring(2, 9);
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(console.error);
    }
  }, [chart]);
  
  return <div ref={ref} className="flex justify-center my-8 overflow-x-auto w-full" />;
};

const DOCS_DOC_ID = "docs_v2";

const DEFAULT_DOCS = `# Structurify Documentation

Welcome to the **Structurify** documentation! Structurify is an AI-powered ETL pipeline that transforms messy, unstructured spreadsheets into strict, machine-readable datasets.

## 🔄 Simplified Architecture Flow

\`\`\`mermaid
graph TD;
    A[User Uploads File] --> B[Next.js Frontend];
    B --> C{File > 5MB?};
    C -- Yes --> D[Send 'Job Started' Email];
    C -- No --> E[Bypass Email];
    D --> E;
    E --> F[Upload to Google Cloud Storage];
    F --> G[Pub/Sub Job Queue];
    G --> H[Cloud Run AI Workers];
    H --> I[Gemini AI Map-Reduce];
    I --> J[DuckDB Data Aggregation];
    J --> K[Zip Creation data.csv + metadata.json];
    K --> L[Firestore Job Updated];
    L --> M[Send 'Job Completed' Email with Download Link];
\`\`\`

## 🚀 How It Works
1. **Upload your unstructured file**: Currently supported formats are **CSV, XLSX, and XLS**.
2. **Define your Target Schema**: Use the UI Builder or paste a raw JSON schema.
3. **Submit the Job**: Our asynchronous MapReduce pipeline processes your data using Google Gemini.
4. **Download Results**: Once completed, you will receive a ZIP file containing your structured data and a metadata report.

## 🔔 Email Notifications
If you provide an email address during upload, you will receive automated notifications:
- **Job Started:** For files larger than 5MB.
- **Job Completed:** Includes a direct, secure link to download your cleaned ZIP file.
- **Job Cancelled:** If you manually cancel the job, or if an administrator halts the system.

## 🛑 Job Management & History
Users can view all their past jobs in the **Extraction History** tab. 
- You can manually **Cancel** any active job directly from the History tab. 
- Administrators have access to an **Admin Portal** and a **Global Kill Switch** that instantly terminates stuck or ghost jobs.

---

## 🛠️ Schema Builder (UI)

The UI Builder provides an intuitive way to construct your target schema.
- **Add Fields:** Click \`+ Add Field\` to create a new column constraint.
- **Field Name:** The exact column name you want in the final output (e.g., \`user_id\`).
- **Data Types Available:** \`String\`, \`Integer\`, \`Float\`, \`Boolean\`, \`Date\`.
- **Validation:** Mark fields as **Required** to enforce strict output, or leave them optional.

## 📝 JSON Builder (Advanced)

For power users, you can toggle to the **JSON Editor** mode. This allows you to paste complex schema definitions. 
**Available Types for JSON Builder:** \`String\`, \`Integer\`, \`Float\`, \`Boolean\`, \`Date\`.

**Example:**
\`\`\`json
{
  "customer_id": "String",
  "total_spend": "Float",
  "is_active": "Boolean",
  "registration_date": "Date"
}
\`\`\`

---

## 📧 Email Notifications

Structurify supports asynchronous processing so you don't have to wait on the page:
- **Large Files (>5MB):** You will receive an immediate **"Job Started"** email confirming your job is in the queue.
- **All Files:** Once the MapReduce pipeline completes, you will receive a **"Job Completed"** email containing a secure direct download link to your results.

---

## 🗂️ History & Result ZIP

All of your past runs are safely stored in your account.
- **History Tab:** Navigate to \`/history\` to view the status of all your jobs, review their target schemas, and download previously processed files.
- **ZIP File Export:** The final output is packaged as a \`.zip\` archive containing two files:
  1. **Data File:** Your beautifully structured CSV or JSON data.
  2. **Metadata File:** A detailed JSON report generated during the processing phase, giving you insights and statistics about your data extraction!
`;

interface GitHubRelease {
  id: number;
  name: string;
  tag_name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
}

export default function DocsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"docs" | "changelog">("docs");
  
  // Docs State
  const [markdown, setMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Changelog State
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);

  const isAdmin = userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "owner";

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchReleases = async () => {
    setLoadingReleases(true);
    try {
      const res = await fetch("https://api.github.com/repos/halcyon-past/Structurify/releases");
      if (!res.ok) throw new Error("Failed to fetch releases");
      const data = await res.json();
      setReleases(data);
    } catch (e) {
      console.error("Error fetching releases:", e);
    } finally {
      setLoadingReleases(false);
    }
  };

  useEffect(() => {
    if (activeTab === "changelog" && releases.length === 0) {
      fetchReleases();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchDocs = async () => {
    try {
      const docRef = doc(db, "settings", DOCS_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const text = docSnap.data().content;
        setMarkdown(text);
        setEditedMarkdown(text);
      } else {
        setMarkdown(DEFAULT_DOCS);
        setEditedMarkdown(DEFAULT_DOCS);
      }
    } catch (e: unknown) {
      console.warn("Docs not found, using default.", e);
      setMarkdown(DEFAULT_DOCS);
      setEditedMarkdown(DEFAULT_DOCS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "settings", DOCS_DOC_ID);
      await setDoc(docRef, { content: editedMarkdown }, { merge: true });
      setMarkdown(editedMarkdown);
      setIsEditing(false);
      alert("Documentation saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save documentation. Ensure you have admin permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-6 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-white/90">Documentation</h1>
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setActiveTab("docs")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === "docs" ? "bg-white/10 text-white shadow" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Docs
              </button>
              <button
                onClick={() => setActiveTab("changelog")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === "changelog" ? "bg-white/10 text-white shadow" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Changelog
              </button>
            </div>
          </div>
          
          {isAdmin && activeTab === "docs" && (
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-medium border border-white/10"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Docs
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditedMarkdown(markdown);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition text-sm font-medium border border-red-500/20"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition text-sm font-medium border border-emerald-500/30 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {activeTab === "docs" ? (
          <>
            {!isEditing ? (
              <div className="bg-[#111] border border-white/5 p-8 rounded-3xl shadow-xl">
                <article className="prose prose-invert prose-emerald max-w-none">
                  <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match && match[1] === "mermaid") {
                      return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                    {markdown}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
                <div className="flex flex-col h-full bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                  <div className="bg-white/5 border-b border-white/10 p-3 flex items-center gap-2 text-sm text-gray-400 font-medium">
                    <Edit3 className="w-4 h-4" />
                    Markdown Editor
                  </div>
                  <textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="flex-1 w-full p-6 bg-transparent text-gray-200 resize-none outline-none font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 transition"
                    placeholder="Write your markdown here..."
                  />
                </div>
                
                <div className="flex flex-col h-full bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                  <div className="bg-white/5 border-b border-white/10 p-3 flex items-center gap-2 text-sm text-emerald-400/80 font-medium">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <article className="prose prose-invert prose-emerald max-w-none">
                      <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match && match[1] === "mermaid") {
                      return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                        {editedMarkdown}
                      </ReactMarkdown>
                    </article>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            {loadingReleases ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                No releases found or failed to load.
              </div>
            ) : (
              releases.map((release) => (
                <div key={release.id} className="bg-[#111] border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-emerald-400">{release.name || release.tag_name}</h2>
                      {release.prerelease && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                          Pre-release
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span>{new Date(release.published_at).toLocaleDateString()}</span>
                      <a href={release.html_url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">
                        View on GitHub
                      </a>
                    </div>
                  </div>
                  <article className="prose prose-invert prose-emerald max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          if (!inline && match && match[1] === "mermaid") {
                            return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {release.body || "*No release notes provided.*"}
                    </ReactMarkdown>
                  </article>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
