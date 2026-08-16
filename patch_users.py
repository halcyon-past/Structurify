from google.cloud import firestore
from datetime import datetime, timezone

db = firestore.Client(project="structurify-504821")

users_ref = db.collection("users")
docs = users_ref.stream()

count = 0
for doc in docs:
    user_data = doc.to_dict()
    updates = {}
    
    if "subscription_status" not in user_data:
        updates["subscription_status"] = "none"
    if "subscription_id" not in user_data:
        updates["subscription_id"] = None
    if "customer_id" not in user_data:
        updates["customer_id"] = None
    if "current_period_start" not in user_data:
        updates["current_period_start"] = None
    if "current_period_end" not in user_data:
        updates["current_period_end"] = None
    if "cancel_at_period_end" not in user_data:
        updates["cancel_at_period_end"] = False
    if "payment_date" not in user_data:
        updates["payment_date"] = None
    if "plan" not in user_data:
        updates["plan"] = "free"
        
    if updates:
        doc.reference.update(updates)
        count += 1

print(f"Updated {count} existing users with subscription tracking fields.")
