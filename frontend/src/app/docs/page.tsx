"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Loader2, Edit3, Save, X, Eye } from "lucide-react";

const DOCS_DOC_ID = "docs";

const DEFAULT_DOCS = `# Structurify Documentation

Welcome to the **Structurify** documentation. Structurify is an AI-powered ETL pipeline that transforms messy, unstructured spreadsheets into strict, machine-readable JSON or Excel schemas.

## Overview
1. **Upload your unstructured file** (CSV, XLSX, PDF).
2. **Define your Target Schema** using the UI Builder or raw JSON.
3. **Submit the Job** and let Google Gemini 2.5 Flash extract and format the data.
4. **Get notified** via email when the job completes.

---

## 🛠️ Schema Builder (UI)

The UI Builder provides an intuitive way to construct your target schema without writing raw JSON.
- **Add Fields:** Click \`+ Add Field\` to create a new column constraint.
- **Field Name:** The exact column name you want in the final output (e.g., \`user_id\`).
- **Data Type:** Select from \`String\`, \`Integer\`, \`Float\`, \`Boolean\`, \`Date\`, etc.
- **Validation:** Mark fields as **Required** to enforce strict output, or allow nulls if data is optional.

## 📝 JSON Builder (Advanced)

For power users, you can toggle to the **JSON Editor** mode. This allows you to paste complex, nested schema definitions.
\`\`\`json
{
  "customer_id": "String",
  "total_spend": "Float",
  "is_active": "Boolean"
}
\`\`\`

## 📧 Email Notifications

You don't need to stare at the progress bar! Structurify supports asynchronous processing for large datasets.
- Enter your **Email Address** in the submission form.
- You will receive a **Job Started** email confirming your schema.
- Once the MapReduce pipeline completes, you will receive a **Job Completed** email containing a direct download link to your structured CSV/JSON file!

---

### Tips for Best Results
* **Be descriptive in field names:** AI uses your field names as context. \`customer_first_name\` works better than \`cfn\`.
* **Monitor Jobs:** You can always check the \`/history\` tab to see your past runs and download previously processed files.
`;

export default function DocsPage() {
  const { userData, loading: authLoading } = useAuth();
  const [markdown, setMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = userData?.role?.toLowerCase() === "admin" || userData?.role?.toLowerCase() === "owner";

  useEffect(() => {
    fetchDocs();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Documentation</h1>
          
          {isAdmin && (
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

        {!isEditing ? (
          <div className="bg-[#111] border border-white/5 p-8 rounded-3xl shadow-xl">
            <article className="prose prose-invert prose-emerald max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {editedMarkdown}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
