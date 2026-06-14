# OwnDeck Setup Guide

## 1. System Requirements
- OS: Windows 10/11, macOS, or Linux
- Node.js: 20.x or newer (`node -v`)
- npm: 10.x or newer (`npm -v`)
- MongoDB: Community Server 7.x or MongoDB Atlas
- RAM: 8GB recommended for OCR + local dev

## 2. Required Accounts / Keys
- OpenAI API key (required for best AI structuring and complaint generation)
- Cloudinary account (optional, recommended for cloud file storage)
- SMTP credentials (optional, for real email alerts)

## 3. Install Dependencies
From workspace root `d:/owndeck`:
```bash
npm install
npm run install:all
```

## 4. Configure Environment

### Backend
Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/owndeck
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ALERT_FROM_EMAIL=no-reply@owndeck.local
FRONTEND_URL=http://localhost:5173
```

### Frontend
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 5. Run Project
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## 6. Main API Routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `POST /api/products/upload` (multipart key: `file`)
- `GET /api/products/:id`
- `PATCH /api/products/:id/lost-mode`
- `POST /api/ai/products/:id/complaint`
- `GET /api/ai/products/:id/lost-card`

## 7. Notes
- If OpenAI key is missing, backend uses safe fallback parsing and complaint templates.
- If Cloudinary keys are missing, files are stored locally at `backend/uploads`.
- If SMTP config is missing, expiry alerts are logged to console instead of email.
- Pre-expiry alert scheduler runs daily at 9:00 AM server time.

## 8. Helpful Utility Commands
From `d:/owndeck`:
```bash
npm.cmd run seed:demo --prefix backend
npm.cmd run check:integrations --prefix backend
```

- `seed:demo` creates:
	- Email: `demo@owndeck.local`
	- Password: `Demo@123`
	- One sample product in dashboard
- `check:integrations` verifies OpenAI and Cloudinary credentials/connectivity.

