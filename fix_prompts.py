with open("worker/src/services/llm_engine.py", "r") as f:
    content = f.read()

# Replace actual newlines within the single quotes with \\n
content = content.replace('"Clean the following CSV data and return it as a JSON array of objects:\n\n{chunk_data}"', '"Clean the following CSV data and return it as a JSON array of objects:\\n\\n{chunk_data}"')
content = content.replace('"Map the following CSV data to the target schema:\n\n{chunk_data}"', '"Map the following CSV data to the target schema:\\n\\n{chunk_data}"')
content = content.replace('"Schema: {schema}\nStats: {stats}"', '"Schema: {schema}\\nStats: {stats}"')

with open("worker/src/services/llm_engine.py", "w") as f:
    f.write(content)
