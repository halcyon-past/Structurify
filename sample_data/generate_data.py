import argparse
import csv
import random
import uuid
import datetime
from pathlib import Path
from faker import Faker

fake = Faker()

def generate_clean_row():
    return {
        "id": str(uuid.uuid4()),
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "phone_number": fake.phone_number(),
        "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat(),
        "address": fake.street_address(),
        "city": fake.city(),
        "country": fake.country(),
        "company": fake.company(),
        "job_title": fake.job(),
        "salary": round(random.uniform(30000, 150000), 2),
        "is_active": random.choice([True, False]),
        "created_at": fake.date_time_this_decade().isoformat()
    }

def mess_up_value(key, val):
    if val is None or val == "":
        return val
        
    val_str = str(val)
    
    # 5% chance to be completely empty (missing data)
    if random.random() < 0.05:
        return ""
        
    # Introduce messy formatting based on type
    if key in ["first_name", "last_name", "city", "country"]:
        if random.random() < 0.3:
            return val_str.lower()
        elif random.random() < 0.3:
            return val_str.upper()
        elif random.random() < 0.2:
            return f"  {val_str}  " # Leading/trailing whitespace
            
    if key == "email":
        if random.random() < 0.2:
            return val_str.replace("@", " [at] ")
        if random.random() < 0.1:
            return val_str.upper()
            
    if key == "phone_number":
        if random.random() < 0.4:
            # strip all non-numeric and format weirdly
            digits = ''.join(filter(str.isdigit, val_str))
            if digits:
                return f"{digits[:3]}.{digits[3:6]}.{digits[6:]}"
                
    if key in ["date_of_birth", "created_at"]:
        if random.random() < 0.5:
            try:
                # parse and change format
                dt = datetime.datetime.fromisoformat(val_str)
                formats = ["%d/%m/%Y", "%m-%d-%y", "%B %d, %Y", "%d %b %Y"]
                return dt.strftime(random.choice(formats))
            except:
                pass
                
    if key == "salary":
        if random.random() < 0.3:
            return f"${val_str}"
        if random.random() < 0.2:
            return f"{val_str} USD"
            
    if key == "is_active":
        if random.random() < 0.3:
            return "yes" if val else "no"
        if random.random() < 0.2:
            return "1" if val else "0"
        if random.random() < 0.2:
            return "TRUE" if val else "FALSE"
            
    return val_str

def generate_messy_row():
    clean = generate_clean_row()
    messy = {}
    
    # Occasionally mess up column headers implicitly by returning a dict with slightly altered keys
    # But for CSV, we keep the same headers and just mess up the values.
    for k, v in clean.items():
        messy[k] = mess_up_value(k, v)
        
    return messy

def write_csv(filename, rows, fieldnames):
    filepath = Path(__file__).parent / filename
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        # 10% chance to mess up headers in messy dataset
        if "messy" in filename and random.random() < 0.1:
            messy_headers = {h: h.upper() if random.random() < 0.5 else h.replace("_", " ") for h in fieldnames}
            writer.writerow(messy_headers)
        else:
            writer.writeheader()
            
        writer.writerows(rows)
    print(f"Generated {filepath} with {len(rows)} rows.")

def main():
    parser = argparse.ArgumentParser(description="Generate sample datasets.")
    parser.add_argument("--rows", type=int, default=1000, help="Number of rows to generate.")
    parser.add_argument("--type", choices=["clean", "messy", "both"], default="both", help="Type of dataset to generate.")
    args = parser.parse_args()

    fieldnames = [
        "id", "first_name", "last_name", "email", "phone_number", 
        "date_of_birth", "address", "city", "country", "company", 
        "job_title", "salary", "is_active", "created_at"
    ]

    if args.type in ["clean", "both"]:
        print(f"Generating {args.rows} clean rows...")
        clean_rows = [generate_clean_row() for _ in range(args.rows)]
        write_csv(f"generated_clean_{args.rows}.csv", clean_rows, fieldnames)

    if args.type in ["messy", "both"]:
        print(f"Generating {args.rows} messy rows...")
        messy_rows = [generate_messy_row() for _ in range(args.rows)]
        write_csv(f"generated_messy_{args.rows}.csv", messy_rows, fieldnames)

if __name__ == "__main__":
    main()
