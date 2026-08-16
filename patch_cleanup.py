import re

with open("backend/src/api/routers/jobs.py", "r") as f:
    content = f.read()

content = re.sub(r'@router\.post\("/_admin/update-users"\).*?return {"status": "success", "updated_count": count}', '', content, flags=re.DOTALL)

with open("backend/src/api/routers/jobs.py", "w") as f:
    f.write(content.strip() + "\n")
