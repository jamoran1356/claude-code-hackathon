# 🚀 PromptMind - The Prompt Stock Market

**Claude Code Hackathon 2026**  
**Status:** 🔴 In Development (Sprint Week 1)

---

## 📋 Quick Overview

**What it is:**
A decentralized marketplace where prompt engineers publish high-quality prompts as tradeable tokens. Quality is verified by Claude AI. Market prices determine true value. Users earn passive income from prompt usage.

**Why it matters:**
- 500k+ prompt engineers globally have no income source
- No standardized way to monetize prompts
- Market-driven quality (price = true value)
- Breeding allows innovation (hybrid prompts)

**The numbers:**
- 100k prompt usage/month = $1,000 revenue
- $5M market cap by Year 1
- 100k+ users, $10k+/month for top creators

---

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  React 18 + TypeScript + TailwindCSS
│  (React)    │  - Prompt browser
└──────┬──────┘  - Trading interface
       │         - Portfolio dashboard
       │         - Leaderboard
       │
┌──────▼──────────────────┐
│   Backend API            │
│  (Express.js)            │
├─────────────────────────┤│
│ • Prompt management     ││
│ • Claude evaluation     ││
│ • Trading logic         ││
│ • Fee distribution      ││
│ • Breeding mechanics    ││
└──────┬──────────────────┘
       │
┌──────▼────────────────────────────┐
│  External Services                 │
├────────────────────────────────────┤
│ • Claude API (quality evaluation)  │
│ • PostgreSQL (data persistence)    │
│ • Redis (leaderboard cache)        │
│ • Polygon (smart contracts)        │
└────────────────────────────────────┘
```

---

## 🎯 Core Features

### MVP (Week 1 - 48h)
- ✅ Prompt browser (search, filter, sort)
- ✅ Create prompt with Claude evaluation
- ✅ Trading interface (buy/sell)
- ✅ Leaderboard (top prompts)
- ✅ Prompt breeding
- ✅ Portfolio dashboard

### Extended (Week 2-3)
- [ ] Smart contract deployment
- [ ] Wallet integration (MetaMask)
- [ ] Real token trading
- [ ] User authentication
- [ ] Advanced analytics
- [ ] Reputation system

### Bonus (Week 4+)
- [ ] DAO governance
- [ ] Affiliate program
- [ ] Mobile app
- [ ] Advanced breeding algorithms

---

## 🛠️ Tech Stack

**Frontend:**
```
- React 18
- TypeScript
- TailwindCSS
- Axios (API calls)
- ethers.js (blockchain)
- React Router (navigation)
```

**Backend:**
```
- Express.js
- Node.js
- PostgreSQL (database)
- Redis (cache)
- Claude API (@anthropic-ai/sdk)
- ethers.js (smart contracts)
```

**Blockchain:**
```
- Polygon (Layer 2)
- Solidity (smart contracts)
- Hardhat (development)
- ERC20 tokens (prompts as tokens)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Claude API key ([get it here](https://console.anthropic.com))
- PostgreSQL (optional, using in-memory for MVP)

### Installation

```bash
# Clone repository
git clone https://github.com/jamoran1356/claude-code-hackathon.git
cd claude-code-hackathon

# Backend setup
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access

- **Backend API:** http://localhost:3001
- **Frontend:** http://localhost:3000
- **Health check:** http://localhost:3001/api/health

---

## 📚 API Endpoints

### Prompts
```
GET    /api/prompts              - List all prompts
GET    /api/prompts/:id          - Get single prompt
POST   /api/prompts              - Create new prompt
POST   /api/prompts/:id/execute  - Execute prompt with input
```

### Trading
```
POST   /api/trades               - Buy/sell tokens
```

### Leaderboard
```
GET    /api/leaderboard          - Top 20 prompts
```

### Breeding
```
POST   /api/breed                - Create hybrid prompt
```

### Health
```
GET    /api/health               - API status
```

---

## 💡 Example Usage

### Create a Prompt
```bash
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Expert Resume Writer",
    "description": "I am an expert resume writer...",
    "category": "career",
    "creator": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "prompt": {
    "id": "1",
    "title": "Expert Resume Writer",
    "qualityScore": 87,
    "tokenPrice": 8.7,
    "supply": 1000,
    ...
  }
}
```

### Execute a Prompt
```bash
curl -X POST http://localhost:3001/api/prompts/1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Help me write a resume for a software engineer role"
  }'
```

### Buy Tokens
```bash
curl -X POST http://localhost:3001/api/trades \
  -H "Content-Type: application/json" \
  -d '{
    "promptId": "1",
    "action": "buy",
    "amount": 10,
    "trader": "Jane Smith"
  }'
```

### Breed Prompts
```bash
curl -X POST http://localhost:3001/api/breed \
  -H "Content-Type: application/json" \
  -d '{
    "parent1Id": "1",
    "parent2Id": "2",
    "breeder": "Hybrid Creator"
  }'
```

---

## 📊 Revenue Model

**Fee per Prompt Usage:** $0.01

**Distribution:**
- Creator: 50% ($0.005)
- Protocol: 40% ($0.004)
- Claude Validators: 10% ($0.001)

**Example Scenario:**
```
10,000 monthly prompt executions
= 10,000 × $0.01 = $100 revenue

Top creator gets:
- $50 from fees
- $100-200 from token price appreciation
- Royalties from hybrid children
- Total: ~$200-300/month per prompt
```

---

## 🎮 Game Mechanics

### Quality Scoring
Claude evaluates each prompt 1-100 based on:
- Clarity of instructions
- Usefulness for actual tasks
- Originality
- Consistency of output

### Price Discovery
```
Token Price = BasePrice × (QualityScore/100) × (1 + Usage/1000)

Example:
- Base: $1
- Quality: 85/100
- Usage: 500
- Final Price: $1 × 0.85 × 1.5 = $1.275
```

### Breeding
```
Combine parent1 + parent2 → hybrid
- Claude synthesizes traits
- New token (500 supply)
- Parents earn 20% royalty on child trades
```

---

## 📈 Roadmap

| Phase | Timeline | Milestones |
|-------|----------|-----------|
| MVP | Week 1 | Core API, Frontend, Demo |
| Beta | Week 2 | Smart contracts, Wallet |
| Launch | Week 3 | Live trading, Real tokens |
| Growth | Week 4+ | DAO, Mobile, Marketing |

---

## 🏆 Submission Info

**Deadline:** March 31, 2026  
**Repository:** https://github.com/jamoran1356/claude-code-hackathon  
**Demo:** Live on Vercel (when ready)  
**Video:** 3-minute walkthrough

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discussion:** GitHub Discussions
- **Twitter:** [@jamoran1356](https://twitter.com/jamoran1356)

---

## 📄 License

MIT License - See LICENSE file

---

**Let's build the future of prompt monetization! 🚀**
