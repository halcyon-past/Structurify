import pandas as pd

data = [
    {"created_at": "10/5/23", "name": "A"},
    {"created_at": "2024-07-27T04:50:41.584046", "name": "B"},
    {"created_at": "14 Dec 2022", "name": "C"},
    {"created_at": "Not a date", "name": "D"}, # outlier
    {"created_at": None, "name": "E"},
]

df = pd.DataFrame(data)

for col in df.columns:
    if df[col].dtype == 'object':
        sample = df[col].dropna()
        if sample.empty: continue
        
        parsed = pd.to_datetime(sample, errors='coerce', format='mixed')
        if parsed.notna().sum() / len(sample) >= 0.5:
            df[col] = pd.to_datetime(df[col], errors='coerce', format='mixed')
            df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
            
df = df.where(pd.notnull(df), None)
print(df.to_dict(orient='records'))
