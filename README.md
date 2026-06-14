# OwnDeck

Consumer Lifecycle Manager for invoice upload, OCR extraction, warranty tracking, complaint drafting, and expiry alerts.

## Tech
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express + MongoDB
- AI/OCR: Tesseract.js + OpenAI API
- Storage: Cloudinary (or local fallback)

## Quick Start
1. Install Node.js 20+ and MongoDB Community Server.
2. In `d:/owndeck` run:
   - `npm install`
   - `npm run install:all`
3. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
4. Start both apps:
   - `npm run dev`
5. Open `http://localhost:5173`.

See `docs/SETUP.md` for complete setup and API details.

