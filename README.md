# Password Strength + History POC

**Stack:** TypeScript · Express · MongoDB · Bcrypt · Zod

## Quick Start

```bash
# 1. Copy and fill in your .env
cp .env.example .env
# Edit .env with your MongoDB URI

# 2. Install dependencies
npm install

# 3. Run in dev mode (ts-node, no compile step)
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Server health check |
| GET | /users | List all users (DEV ONLY) |
| POST | /users | Register new user |
| POST | /users/login | Authenticate |
| PUT | /users/:username/password | Change password |
| DELETE | /users/:username | Delete user (DEV ONLY) |

## Test with cURL

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register (succeeds)
```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"pranav","password":"Pranav@123"}'
```

### 3. Register with weak password (fails — 400)
```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"weakuser","password":"password"}'
```

### 4. Login
```bash
curl -s -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pranav","password":"Pranav@123"}'
```

### 5. Change password (succeeds)
```bash
curl -s -X PUT http://localhost:3000/users/pranav/password \
  -H "Content-Type: application/json" \
  -d '{"current_password":"Pranav@123","new_password":"Pranav@456"}'
```

### 6. Reuse old password (fails — 409)
```bash
curl -s -X PUT http://localhost:3000/users/pranav/password \
  -H "Content-Type: application/json" \
  -d '{"current_password":"Pranav@456","new_password":"Pranav@123"}'
```

### 7. Inspect the database (DEV ONLY)
```bash
curl -s http://localhost:3000/users | python3 -m json.tool
```

## Password Rules

- Minimum 8 characters
- At least 1 uppercase letter  
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

## Password History

The last **5 passwords** are stored as bcrypt hashes and cannot be reused. 
This is configurable via `PASSWORD_HISTORY_LIMIT` in `routes/passwords.ts`.
