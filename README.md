"# Event Nest - CodeInc

Event management platform for organizing and managing events.

## Project Structure

```
innoquint/
├── frontend/          # Static HTML/CSS/JS files
│   ├── index.html
│   ├── events.html
│   ├── dashboard2.html
│   ├── styles.css
│   └── app.js
│
├── backend/           # Node.js Express API
│   ├── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── package.json       # Root package.json
```

## Local Development

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### Frontend
Open `frontend/index.html` in browser or use:
```bash
cd frontend
python -m http.server 3000
```

## Deployment

### Frontend (Vercel/Netlify)
- Deploy `frontend/` folder
- Set build directory to `frontend`

### Backend (Render/Railway)
- Deploy `backend/` folder
- Add DATABASE_URL environment variable
- Run: `npx prisma generate && npm start`

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express, Prisma
- **Database**: SQLite (dev) / PostgreSQL (production)
