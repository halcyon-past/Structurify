with open("worker/src/services/llm_engine.py", "r") as f:
    content = f.read()

content = content.replace("'llm_model', 'gemini-2.5-flash'", "'llm_model', 'gemini-3.6-flash'")

with open("worker/src/services/llm_engine.py", "w") as f:
    f.write(content)
