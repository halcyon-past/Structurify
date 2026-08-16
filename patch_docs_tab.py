import re

with open("frontend/src/app/docs/page.tsx", "r") as f:
    content = f.read()

content = content.replace('>Changelog<', '>Releases<')

with open("frontend/src/app/docs/page.tsx", "w") as f:
    f.write(content)
