# 🚀 Setup Instructions - Claude Code Hackathon

## Step 1: Create Repository on GitHub

Go to https://github.com/new and create:
- **Repository name:** `claude-code-hackathon`
- **Description:** "Claude-powered workflow automation - DoraHacks Hackathon"
- **Public:** Yes
- **Initialize:** No (we have files)

## Step 2: Push Local Repository

```bash
cd /workspace/anais-workspace/shared/proyectos/claude-code-hackathon

# Add remote (replace with your repo URL)
git remote add origin https://github.com/jamoran1356/claude-code-hackathon.git
git branch -M main
git push -u origin main
```

## Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 4: Setup Environment

```bash
# Backend
cp .env.example .env
# Add your Claude API key:
# ANTHROPIC_API_KEY=sk-ant-...
```

## Step 5: Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Step 6: Test API

```bash
curl -X POST http://localhost:3001/api/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{"description": "Every day at 9am, send me an email with weather forecast"}'
```

---

**You should now have a working AutoFlow backend ready for the hackathon!**
