import re

with open("worker/src/services/file_parser.py", "r") as f:
    content = f.read()

content = content.replace("file_size_mb > 5.0", "file_size_mb > 1.0")

with open("worker/src/services/file_parser.py", "w") as f:
    f.write(content)
