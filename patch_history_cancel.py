import re

with open("frontend/src/hooks/useUserHistory.ts", "r") as f:
    content = f.read()

new_cancel = """
  const cancelJob = async (jobId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setJobs(prev => prev.map(job => job.job_id === jobId ? { ...job, status: "cancelled" } : job));
    } catch (e) {
      console.error("Failed to cancel job", e);
    }
  };
"""

content = re.sub(
    r'const cancelJob = async.*?console\.error\("Failed to cancel job", e\);\n    }\n  };',
    new_cancel.strip(),
    content,
    flags=re.DOTALL
)

if 'import { auth }' not in content:
    content = content.replace('import { db } from "@/lib/firebase";', 'import { db, auth } from "@/lib/firebase";')

with open("frontend/src/hooks/useUserHistory.ts", "w") as f:
    f.write(content)
