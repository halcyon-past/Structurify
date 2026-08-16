import os

files_to_patch = [
    "frontend/src/app/layout.tsx",
    "frontend/src/app/sitemap.ts",
    "frontend/src/app/robots.ts",
]

for file_path in files_to_patch:
    if not os.path.exists(file_path):
        print(f"{file_path} not found.")
        continue
    with open(file_path, "r") as f:
        content = f.read()
    
    new_content = content.replace("structurify.web.app", "structurify.aritro.cloud")
    
    with open(file_path, "w") as f:
        f.write(new_content)
    print(f"Patched {file_path}")
