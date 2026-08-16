import re

with open("frontend/src/app/globals.css", "r") as f:
    content = f.read()

content = content.replace("font-family: 'Inter', sans-serif;", "")
with open("frontend/src/app/globals.css", "w") as f:
    f.write(content)

with open("frontend/tailwind.config.ts", "r") as f:
    content = f.read()

font_config = """
      fontFamily: {
        sans: ['var(--font-space-grotesk)'],
        mono: ['var(--font-jetbrains-mono)'],
      },
      colors: {"""

content = content.replace("colors: {", font_config)
with open("frontend/tailwind.config.ts", "w") as f:
    f.write(content)

with open("frontend/src/app/layout.tsx", "r") as f:
    content = f.read()

content = content.replace('variable: "--font-geist-sans"', 'variable: "--font-space-grotesk"')
content = content.replace('variable: "--font-geist-mono"', 'variable: "--font-jetbrains-mono"')

with open("frontend/src/app/layout.tsx", "w") as f:
    f.write(content)
