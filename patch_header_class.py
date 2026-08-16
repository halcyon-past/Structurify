import re

with open("frontend/src/components/Header.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="w-full flex items-center justify-between p-4 z-50 absolute top-0"',
    'className="w-full flex items-center justify-between p-4 relative"'
)

with open("frontend/src/components/Header.tsx", "w") as f:
    f.write(content)
