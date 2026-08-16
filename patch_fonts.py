import re

with open("frontend/src/app/layout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import localFont from "next/font/local";',
    'import { Space_Grotesk, JetBrains_Mono } from "next/font/google";'
)

# Remove local font definitions
content = re.sub(
    r'const geistSans = localFont\({.*?}\);\nconst geistMono = localFont\({.*?}\);\n',
    'const spaceGrotesk = Space_Grotesk({\n  subsets: ["latin"],\n  variable: "--font-geist-sans",\n});\nconst jetbrainsMono = JetBrains_Mono({\n  subsets: ["latin"],\n  variable: "--font-geist-mono",\n});\n',
    content,
    flags=re.DOTALL
)

# Keep the variable names the same so Tailwind picks them up from globals.css if configured,
# or we just change the variables to Space Grotesk.
content = content.replace(
    'className={`${geistSans.variable} ${geistMono.variable} antialiased`}',
    'className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}'
)

with open("frontend/src/app/layout.tsx", "w") as f:
    f.write(content)
