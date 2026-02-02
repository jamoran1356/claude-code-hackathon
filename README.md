# PromptMind - Prompt Stock Market

A decentralized marketplace for AI prompts with tokenization, trading, and breeding mechanics on Arbitrum blockchain.

---

## 🚀 Quick Start

### Requirements
- Node.js 18+
- Docker & Docker Compose
- Claude API Key
- Git

### Installation & Run

```bash
# Clone repository
git clone https://github.com/jamoran1356/claude-code-hackathon.git
cd claude-code-hackathon

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - ANTHROPIC_API_KEY
# - PRIVATE_KEY
# - DATABASE_URL (optional if using Docker)

# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Access application
open http://localhost:3000
```

The application will be available at `http://localhost:3000` with:
- **Frontend**: Next.js React app
- **Backend**: API routes at `/api/v1/*`
- **Database**: PostgreSQL (port 5432)
- **Cache**: Redis (port 6379)

---

## 🛠️ Development (Local)

### Without Docker

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Setup PostgreSQL (locally or Docker)
# docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Database Management

```bash
# View/manage database with Prisma Studio
npm run db:studio

# Create new migration
npm run migrate

# Seed test data
npm run db:seed

# Production deployment
npm run migrate:prod
```

---

## 📁 Project Structure

```
app/
├── api/v1/                  # REST API routes
│   ├── health/
│   ├── prompts/
│   ├── trades/
│   ├── breeding/
│   └── auth/
├── dashboard/               # Protected pages
├── (public)/                # Public pages
├── layout.tsx               # Root layout
└── page.tsx                 # Home page

lib/
├── db/                      # Database utilities
├── blockchain/              # Arbitrum integration
├── auth/                    # JWT & Web3 auth
├── services/                # Business logic
└── utils/                   # Helper functions

components/
├── ui/                      # Base components
└── layout/                  # Layout components

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Migration files

contracts/
├── solidity/                # Smart contracts
└── deployment/              # Deploy scripts

docker/
├── Dockerfile
└── .dockerignore

public/                      # Static assets
tests/                       # Test files
```

---

## 🔗 API Routes

### Prompts
```
GET    /api/v1/prompts              List all prompts
POST   /api/v1/prompts              Create new prompt
GET    /api/v1/prompts/:id          Get prompt details
POST   /api/v1/prompts/:id/execute  Execute prompt
```

### Trading
```
POST   /api/v1/trades              Buy/sell tokens
GET    /api/v1/trades              View trade history
```

### Breeding
```
POST   /api/v1/breeding            Create hybrid prompt
GET    /api/v1/breeding            View breeding history
```

### Authentication
```
POST   /api/v1/auth/login          Web3 wallet login
GET    /api/v1/auth/verify         Verify JWT token
```

### Health
```
GET    /api/v1/health              API status check
```

---

## 💾 Database

Uses PostgreSQL with Prisma ORM.

### Schema
- **Users**: Web3 wallets and profiles
- **Prompts**: Prompt content, quality scores, pricing
- **Trades**: Trading history with fee tracking
- **BreedingEvents**: Hybrid prompt creation
- **AuditLogs**: Security and compliance logging
- **RateLimit**: Rate limiting tracking
- **SuspiciousActivity**: Fraud detection

See `prisma/schema.prisma` for full schema definition.

---

## 🔐 Security

Multi-layer security architecture:

1. **Input Validation** - TypeScript with Zod schemas
2. **Authentication** - JWT tokens + Web3 signature verification
3. **Business Logic** - Transaction validation, balance checks, atomic operations
4. **Smart Contracts** - OpenZeppelin standards, ReentrancyGuard, multi-sig
5. **Infrastructure** - HTTPS only, CORS whitelisting, rate limiting
6. **Compliance** - Immutable audit logs, activity tracking

See `ARCHITECTURE-REFACTOR.md` for detailed security documentation.

---

## 🐳 Docker

All services run in containers.

### Services
- **app** (port 3000) - Next.js application
- **postgres** (port 5432) - PostgreSQL database
- **redis** (port 6379) - Redis cache

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Restart single service
docker-compose restart app
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Specific test file
npm test -- api.test.ts
```

---

## 📝 Configuration

Create `.env` file from `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# Blockchain
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
PRIVATE_KEY="your-wallet-key"
NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."

# Security
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000"

# Redis
REDIS_URL="redis://redis:6379"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **GitHub**: https://github.com/jamoran1356/claude-code-hackathon
- **Architecture**: See ARCHITECTURE-REFACTOR.md
- **Smart Contracts**: See contracts/solidity/

---

## 📞 Support

For questions or issues:
- Open GitHub Issues: https://github.com/jamoran1356/claude-code-hackathon/issues
- Check existing documentation in the repository

---

**Built for Claude Code Hackathon 2026**
