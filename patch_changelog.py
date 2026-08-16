import re

with open("CHANGELOG.md", "r") as f:
    content = f.read()

new_content = content.replace(
    "### Changed\n- Refactored the **Admin Settings UI**",
    "### Changed\n- **Refined Global Header**: Redesigned the main navigation header to utilize a sticky frosted glassmorphism effect (`fixed`, `backdrop-blur-xl`), and exposed the 'Docs' button to all users, including unauthenticated guests.\n- Refactored the **Admin Settings UI**"
)

with open("CHANGELOG.md", "w") as f:
    f.write(new_content)
