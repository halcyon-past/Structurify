import re

with open("frontend/src/hooks/useAdminData.ts", "r") as f:
    content = f.read()

new_cancel = """
  const cancelJob = async (jobId: string) => {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
"""

content = re.sub(
    r'const cancelJob = async \(jobId: string\) => {\n    await fetch.*?\n    }\);\n  };',
    new_cancel.strip(),
    content,
    flags=re.DOTALL
)

if 'import { auth }' not in content:
    content = content.replace('import { db } from "@/lib/firebase";', 'import { db, auth } from "@/lib/firebase";')

with open("frontend/src/hooks/useAdminData.ts", "w") as f:
    f.write(content)
