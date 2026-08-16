import re

with open("frontend/src/hooks/useAuth.tsx", "r") as f:
    content = f.read()

new_setdoc = """await setDoc(userRef, {
          email: loggedInUser.email,
          name: loggedInUser.displayName,
          role: "member",
          plan: "free",
          created_at: new Date().toISOString(),
          subscription_status: "none",
          subscription_id: null,
          customer_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_date: null
        });"""

content = re.sub(
    r'await setDoc\(userRef, {.*?created_at: new Date\(\)\.toISOString\(\)\s*}\);',
    new_setdoc,
    content,
    flags=re.DOTALL
)

with open("frontend/src/hooks/useAuth.tsx", "w") as f:
    f.write(content)
