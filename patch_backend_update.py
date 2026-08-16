with open("backend/src/api/routers/jobs.py", "r") as f:
    content = f.read()

new_endpoint = """
@router.post("/_admin/update-users")
async def admin_update_users(firestore_svc: FirestoreService = Depends(get_firestore_service)):
    db = firestore_svc.db
    users_ref = db.collection("users")
    docs = users_ref.stream()
    count = 0
    batch = db.batch()
    for doc in docs:
        user_data = doc.to_dict()
        updates = {}
        if "subscription_status" not in user_data: updates["subscription_status"] = "none"
        if "subscription_id" not in user_data: updates["subscription_id"] = None
        if "customer_id" not in user_data: updates["customer_id"] = None
        if "current_period_start" not in user_data: updates["current_period_start"] = None
        if "current_period_end" not in user_data: updates["current_period_end"] = None
        if "cancel_at_period_end" not in user_data: updates["cancel_at_period_end"] = False
        if "payment_date" not in user_data: updates["payment_date"] = None
        if "plan" not in user_data: updates["plan"] = "free"
        if updates:
            batch.update(doc.reference, updates)
            count += 1
    batch.commit()
    return {"status": "success", "updated_count": count}
"""

content = content + new_endpoint

with open("backend/src/api/routers/jobs.py", "w") as f:
    f.write(content)
