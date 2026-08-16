import re

with open("frontend/src/hooks/useAdminData.ts", "r") as f:
    content = f.read()

content = content.replace('import { auth } from "@/lib/firebase";\n', '')
content = content.replace('import { db } from "@/lib/firebase";', 'import { db, auth } from "@/lib/firebase";')

with open("frontend/src/hooks/useAdminData.ts", "w") as f:
    f.write(content)
