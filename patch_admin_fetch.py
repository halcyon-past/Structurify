import re

with open("frontend/src/app/admin/page.tsx", "r") as f:
    content = f.read()

new_kill_switch = """
  const killSwitch = async () => {
    if (!window.confirm("CRITICAL WARNING: This will immediately purge ALL active queues and forcefully terminate all running processing jobs across the entire system. Are you absolutely sure?")) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/jobs/kill-switch`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to engage kill switch");
      alert(`Kill switch engaged. System purged: ${data.message || "Success"}`);
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to engage kill switch.");
    }
"""

content = re.sub(
    r'const killSwitch = async \(\) => {.*?alert\("Failed to engage kill switch\."\);\n    }',
    new_kill_switch.strip(),
    content,
    flags=re.DOTALL
)

# Also ensure auth is imported
if 'import { auth }' not in content:
    content = content.replace('import { db } from "@/lib/firebase";', 'import { db, auth } from "@/lib/firebase";')
    # Or just add it at the top
    if 'import { db, auth } from "@/lib/firebase";' not in content:
        content = content.replace('import { useAuth } from "@/hooks/useAuth";', 'import { useAuth } from "@/hooks/useAuth";\nimport { auth } from "@/lib/firebase";')

with open("frontend/src/app/admin/page.tsx", "w") as f:
    f.write(content)
