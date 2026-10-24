# Auth Testing Playbook (Al-Kudsh)

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.admins.find({}).pretty()
db.admins.findOne({}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, unique index on admins.email, index on login_attempts.identifier.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@al-kudsh.com","password":"AlKudsh@2026"}'
cat cookies.txt   # expect ak_access httpOnly cookie
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns {"token", "admin"} and sets the ak_access cookie. /me returns the same admin.

## Step 3: Negative tests
- Wrong password → 401 "Invalid email or password"
- 5 wrong attempts → 429 lockout for 15 minutes
- 6th login request within a minute → 429 (slowapi rate limit)
