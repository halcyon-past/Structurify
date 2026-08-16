import re

with open("frontend/src/app/layout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'export const metadata: Metadata = {',
    'export const metadata: Metadata = {\n  metadataBase: new URL("https://structurify.aritro.cloud"),'
)

with open("frontend/src/app/layout.tsx", "w") as f:
    f.write(content)
