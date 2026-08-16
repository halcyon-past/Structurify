import re

with open("frontend/src/app/track/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center overflow-hidden p-6"',
    'className="min-h-screen bg-background text-foreground relative flex flex-col items-center justify-center overflow-hidden p-6 pt-24"'
)

with open("frontend/src/app/track/page.tsx", "w") as f:
    f.write(content)
